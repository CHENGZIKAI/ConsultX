from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import List, Optional, Sequence

from .analysis import RiskAdapter, RiskClassifier, SentimentAnalyzer
from .models import (
    BufferSnapshot,
    MessageRecord,
    RiskAssessment,
    RiskTier,
    SenderRole,
    SentimentBand,
    SessionMetrics,
    SessionRecord,
    SessionStatus,
    SessionSummary,
    utc_now,
)
from .storage import SessionStorage


class SessionError(Exception):
    """Base error for session-related failures."""


class SessionNotFound(SessionError):
    """Raised when a session id cannot be located."""


class SessionClosed(SessionError):
    """Raised when a write is attempted on an ended session."""


RISK_SEVERITY = {
    RiskTier.OK: 0,
    RiskTier.CAUTION: 1,
    RiskTier.HIGH: 2,
    RiskTier.CRISIS: 3,
}


def _sentiment_band_from_score(score: float) -> SentimentBand:
    if score > 0.1:
        return SentimentBand.POSITIVE
    if score < -0.1:
        return SentimentBand.NEGATIVE
    return SentimentBand.NEUTRAL


@dataclass
class MessageAppendResult:
    message: MessageRecord
    risk: RiskAssessment
    buffer: BufferSnapshot
    metrics: SessionMetrics


class SessionTracker:
    """Core orchestration layer for session tracking and analytics."""

    def __init__(
        self,
        storage: Optional[SessionStorage] = None,
        *,
        buffer_size: int = 20,
        sentiment_analyzer: Optional[SentimentAnalyzer] = None,
        risk_classifier: Optional[RiskClassifier] = None,
    ) -> None:
        self.storage = storage or SessionStorage()
        self.buffer_size = buffer_size
        self.sentiment_analyzer = sentiment_analyzer or SentimentAnalyzer()
        self.risk_classifier = risk_classifier or RiskClassifier()

    # Session lifecycle ---------------------------------------------------

    def create_session(self, user_id: str, metadata: Optional[dict] = None) -> SessionRecord:
        session = SessionRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            status=SessionStatus.ACTIVE,
            created_at=utc_now(),
            updated_at=utc_now(),
            active_risk_tier=RiskTier.OK,
            metadata=metadata or {},
        )
        self.storage.create_session(session)
        self.storage.save_buffer(BufferSnapshot(session_id=session.id, messages=[], capacity=self.buffer_size))
        return session

    def get_session(self, session_id: str) -> SessionRecord:
        session = self.storage.get_session(session_id)
        if not session:
            raise SessionNotFound(f"Session '{session_id}' not found.")
        return session

    def list_sessions(
        self,
        *,
        user_id: Optional[str] = None,
        status: Optional[SessionStatus] = None,
    ) -> List[SessionRecord]:
        return self.storage.list_sessions(user_id=user_id, status=status)

    def end_session(self, session_id: str) -> SessionSummary:
        session = self.get_session(session_id)
        if session.status == SessionStatus.ENDED:
            return self.get_summary(session_id)

        metrics, flagged = self._recalculate_metrics(session_id)
        self.storage.update_session(
            session_id,
            status=SessionStatus.ENDED,
            active_risk_tier=metrics.max_risk_tier,
        )
        session = self.get_session(session_id)
        summary = self._build_summary(session, metrics, flagged_keywords=flagged)
        return summary

    # Message handling ----------------------------------------------------

    def append_message(
        self,
        session_id: str,
        *,
        sender: SenderRole,
        content: str,
    ) -> MessageAppendResult:
        session = self.get_session(session_id)
        if session.status != SessionStatus.ACTIVE:
            raise SessionClosed(f"Session '{session_id}' is not active.")

        sentiment = self.sentiment_analyzer.score(content)
        recent_messages = self.storage.recent_messages(session_id, self.buffer_size)
        recent_tiers = [m.risk_tier for m in recent_messages]
        assessment = self.risk_classifier.assess(content, sentiment, recent_tiers)

        message = MessageRecord(
            id=None,
            session_id=session_id,
            sender=sender,
            content=content,
            sentiment_score=sentiment.score,
            risk_tier=assessment.tier,
            risk_score=assessment.score,
            flagged_keywords=assessment.flagged_keywords,
            created_at=utc_now(),
        )
        saved_message = self.storage.insert_message(message)
        self.storage.update_session(session_id, active_risk_tier=assessment.tier)
        buffer = self._update_buffer(session_id)
        metrics, _ = self._recalculate_metrics(session_id)
        return MessageAppendResult(
            message=saved_message,
            risk=assessment,
            buffer=buffer,
            metrics=metrics,
        )

    def get_messages(self, session_id: str) -> List[MessageRecord]:
        self.get_session(session_id)  # ensure exists
        return self.storage.list_messages(session_id)

    def get_buffer(self, session_id: str) -> BufferSnapshot:
        buffer = self.storage.load_buffer(session_id)
        if buffer:
            return buffer
        self.get_session(session_id)  # raises if missing
        recent = self.storage.recent_messages(session_id, self.buffer_size)
        snapshot = BufferSnapshot(session_id=session_id, messages=recent, capacity=self.buffer_size)
        self.storage.save_buffer(snapshot)
        return snapshot

    # Summaries -----------------------------------------------------------

    def get_summary(self, session_id: str) -> SessionSummary:
        session = self.get_session(session_id)
        metrics = self.storage.get_metrics(session_id)
        flagged = self._collect_flagged_keywords(session_id)
        if not metrics:
            metrics, flagged = self._recalculate_metrics(session_id)
        return self._build_summary(session, metrics, flagged_keywords=flagged)

    # Internal helpers ----------------------------------------------------

    def _update_buffer(self, session_id: str) -> BufferSnapshot:
        recent = self.storage.recent_messages(session_id, self.buffer_size)
        snapshot = BufferSnapshot(session_id=session_id, messages=recent, capacity=self.buffer_size)
        self.storage.save_buffer(snapshot)
        return snapshot

    def _collect_flagged_keywords(self, session_id: str) -> List[str]:
        messages = self.storage.list_messages(session_id)
        keywords = set()
        for message in messages:
            keywords.update(message.flagged_keywords)
        return sorted(keywords)

    def _recalculate_metrics(self, session_id: str) -> tuple[SessionMetrics, List[str]]:
        messages = self.storage.list_messages(session_id)
        message_count = len(messages)
        user_turns = sum(1 for m in messages if m.sender == SenderRole.USER)
        assistant_turns = sum(1 for m in messages if m.sender == SenderRole.ASSISTANT)
        avg_sentiment = round(sum(m.sentiment_score for m in messages) / message_count, 3) if message_count else 0.0

        tier_counts = {tier.value: 0 for tier in RiskTier}
        band_counts = {band.value: 0 for band in SentimentBand}
        flagged_keywords = set()
        recent_risk = []
        for message in messages:
            tier_counts[message.risk_tier.value] += 1
            band = _sentiment_band_from_score(message.sentiment_score)
            band_counts[band.value] += 1
            flagged_keywords.update(message.flagged_keywords)
            recent_risk.append(message.risk_tier)

        max_risk_tier = RiskTier.OK
        for tier in RiskTier:
            if tier_counts[tier.value] and RISK_SEVERITY[tier] >= RISK_SEVERITY[max_risk_tier]:
                max_risk_tier = tier

        trend_notes: List[str] = []
        if recent_risk:
            last_three = recent_risk[-3:]
            if all(tier in {RiskTier.CAUTION, RiskTier.HIGH, RiskTier.CRISIS} for tier in last_three):
                trend_notes.append("Sustained elevated risk across last three turns.")
            if len(recent_risk) >= 2 and RISK_SEVERITY[recent_risk[-1]] > RISK_SEVERITY[recent_risk[-2]]:
                trend_notes.append("Risk climbing on most recent turn.")
            if avg_sentiment < -0.3:
                trend_notes.append("Overall negative sentiment.")

        suggested_resources = self.risk_classifier.suggest_resources(
            flagged_keywords,
            max_risk_tier,
        )

        metrics = SessionMetrics(
            session_id=session_id,
            message_count=message_count,
            user_turns=user_turns,
            assistant_turns=assistant_turns,
            avg_sentiment=avg_sentiment,
            max_risk_tier=max_risk_tier,
            tier_counts=tier_counts,
            band_counts=band_counts,
            trend_notes=trend_notes,
            suggested_resources=suggested_resources,
        )
        self.storage.upsert_metrics(metrics)
        return metrics, sorted(flagged_keywords)

    def _build_summary(
        self,
        session: SessionRecord,
        metrics: SessionMetrics,
        *,
        flagged_keywords: List[str],
    ) -> SessionSummary:
        duration_seconds = int(max(0.0, (session.updated_at - session.created_at).total_seconds()))
        notes = list(metrics.trend_notes)
        if session.status == SessionStatus.ENDED:
            notes.append("Session marked as ended.")
        return SessionSummary(
            session=session,
            metrics=metrics,
            duration_seconds=duration_seconds,
            flagged_keywords=flagged_keywords,
            notes=notes,
        )

    def register_risk_adapter(self, adapter: RiskAdapter) -> None:
        """Expose risk classifier adapter registration for external integrations."""
        self.risk_classifier.add_adapter(adapter)
