from __future__ import annotations

import re
from typing import Callable, Iterable, List, Optional, Sequence

from .models import RiskAssessment, RiskTier, SentimentBand, SentimentResult

_WORD_RE = re.compile(r"[a-zA-Z']+")

_RISK_SEVERITY = {
    RiskTier.OK: 0,
    RiskTier.CAUTION: 1,
    RiskTier.HIGH: 2,
    RiskTier.CRISIS: 3,
}

RiskAdapter = Callable[[str, SentimentResult], Optional[RiskAssessment]]


def _tier_from_label(label: object) -> RiskTier:
    """Convert a free-form tier label to a RiskTier enum."""
    if not label:
        return RiskTier.OK
    normalized = str(label).strip().lower()
    mapping = {
        "ok": RiskTier.OK,
        "caution": RiskTier.CAUTION,
        "high": RiskTier.HIGH,
        "crisis": RiskTier.CRISIS,
    }
    return mapping.get(normalized, RiskTier.OK)


def _normalize_score(value: object) -> float:
    """Clamp a score into [0, 1], scaling risk_types' 0–3 range when present."""
    try:
        score = float(value)
    except (TypeError, ValueError):
        return 0.0
    if score > 1.0:
        score = score / 3.0
    return max(0.0, min(1.0, score))


class SentimentAnalyzer:
    """Lexicon-based sentiment analyser that avoids external dependencies."""

    POSITIVE_WORDS = {
        "calm",
        "hope",
        "relief",
        "grateful",
        "progress",
        "better",
        "supported",
        "proud",
        "strong",
        "encouraged",
        "improving",
        "relaxed",
    }
    NEGATIVE_WORDS = {
        "sad",
        "angry",
        "upset",
        "anxious",
        "stressed",
        "scared",
        "lonely",
        "hopeless",
        "worthless",
        "tired",
        "empty",
        "numb",
        "depressed",
        "afraid",
        "ashamed",
        "guilty",
        "fail",
        "failure",
        "broken",
        "hurt",
    }
    NEGATIONS = {
        "not",
        "never",
        "no",
        "hardly",
        "barely",
    }

    def score(self, text: str) -> SentimentResult:
        tokens = [token.lower() for token in _WORD_RE.findall(text)]
        matched_tokens: List[str] = []
        score = 0
        total = 0

        for idx, token in enumerate(tokens):
            if token in self.POSITIVE_WORDS:
                modifier = -1 if idx > 0 and tokens[idx - 1] in self.NEGATIONS else 1
                score += modifier
                total += 1
                matched_tokens.append(token)
            elif token in self.NEGATIVE_WORDS:
                modifier = -1 if idx > 0 and tokens[idx - 1] in self.NEGATIONS else 1
                score -= modifier
                total += 1
                matched_tokens.append(token)

        normalized = score / total if total else 0.0
        if normalized > 0.1:
            band = SentimentBand.POSITIVE
        elif normalized < -0.1:
            band = SentimentBand.NEGATIVE
        else:
            band = SentimentBand.NEUTRAL

        return SentimentResult(score=round(normalized, 3), band=band, tokens=matched_tokens)


class RiskClassifier:
    """
    Risk evaluator that delegates scoring to the RAG risk model (`backend.core.risk_types`).

    Heuristic keyword checks are retained only to surface flagged keywords/resources and
    do not influence the tier or score.
    """

    def __init__(
        self,
        adapters: Optional[Sequence[RiskAdapter]] = None,
        *,
        rag_module=None,
    ) -> None:
        self.adapters: List[RiskAdapter] = list(adapters or [])
        self._rag_module = rag_module or self._load_rag_module()

    CRISIS_PHRASES = {
        "kill myself",
        "end my life",
        "suicide",
        "take my life",
        "hurt myself",
        "want to die",
        "ending it all",
    }
    HIGH_KEYWORDS = {
        "cut",
        "self-harm",
        "jump",
        "overdose",
        "plan",
        "no reason",
        "can't go on",
        "die",
    }
    CAUTION_KEYWORDS = {
        "numb",
        "worthless",
        "hopeless",
        "empty",
        "lost",
        "alone",
        "tired",
        "fail",
        "failure",
        "break",
        "breaking",
        "drowning",
        "spiral",
        "panic",
        "overwhelmed",
        "burnout",
        "grief",
        "insomnia",
    }

    RESOURCE_MAP = {
        "suicide": {
            "type": "hotline",
            "label": "988 Suicide & Crisis Lifeline",
            "link": "tel:988",
        },
        "hurt myself": {
            "type": "hotline",
            "label": "Crisis Text Line",
            "link": "sms:741741",
        },
        "hopeless": {
            "type": "article",
            "label": "Grounding exercise: 5-4-3-2-1 method",
            "link": "https://www.healthline.com/health/grounding-techniques",
        },
        "lonely": {
            "type": "resource",
            "label": "Mental Health America peer support",
            "link": "https://mhanational.org/peers",
        },
        "anxious": {
            "type": "exercise",
            "label": "Box breathing technique",
            "link": "https://www.va.gov/WHOLEHEALTHLIBRARY/tools/box-breathing.asp",
        },
        "panic": {
            "type": "exercise",
            "label": "Panic attack grounding steps",
            "link": "https://www.verywellmind.com/stop-a-panic-attack-2584406",
        },
        "overwhelmed": {
            "type": "article",
            "label": "Guided journaling prompts for overwhelm",
            "link": "https://www.therapistaid.com/worksheets/coping-skills-anxiety.pdf",
        },
        "self-harm": {
            "type": "hotline",
            "label": "Self-Injury Outreach & Support",
            "link": "https://sioutreach.org/dont-hurt-yourself/",
        },
        "grief": {
            "type": "resource",
            "label": "Grief Share support groups",
            "link": "https://www.griefshare.org/findagroup",
        },
        "insomnia": {
            "type": "exercise",
            "label": "Sleep hygiene checklist",
            "link": "https://www.sleepfoundation.org/sleep-hygiene",
        },
        "burnout": {
            "type": "article",
            "label": "Burnout recovery micro-breaks",
            "link": "https://www.apa.org/topics/burnout/recover",
        },
    }

    def add_adapter(self, adapter: RiskAdapter) -> None:
        """Register an external risk adapter."""
        self.adapters.append(adapter)

    def assess(
        self,
        text: str,
        sentiment: SentimentResult,
        recent_tiers: Sequence[RiskTier] | None = None,
    ) -> RiskAssessment:
        rag_assessment, rag_notes = self._rag_assess(text)

        if rag_assessment:
            tier = rag_assessment.tier
            score = rag_assessment.score
            flagged = list(rag_assessment.flagged_keywords)
            notes = list(rag_assessment.notes)
            if rag_notes:
                notes.extend(rag_notes)
        else:
            tier = RiskTier.OK
            score = 0.0
            flagged = []
            notes = rag_notes or ["RAG risk module unavailable."]

        # Add flagged keywords for downstream resources without changing the tier.
        flagged.extend(self._extract_keywords(text))

        tier, score, adapter_flagged, adapter_notes = self._apply_adapters(text, sentiment, tier, score)
        flagged.extend(adapter_flagged)
        notes.extend(adapter_notes)

        unique_flagged = sorted(set(flagged))
        return RiskAssessment(tier=tier, score=round(score, 3), flagged_keywords=unique_flagged, notes=notes)

    def _extract_keywords(self, text: str) -> List[str]:
        lowered = text.lower()
        flagged: List[str] = []
        flagged.extend(self._find_phrases(lowered, self.CRISIS_PHRASES))
        flagged.extend(self._find_keywords(lowered, self.HIGH_KEYWORDS))
        flagged.extend(self._find_keywords(lowered, self.CAUTION_KEYWORDS))
        return flagged

    def _rag_assess(self, text: str) -> tuple[Optional[RiskAssessment], List[str]]:
        if not self._rag_module:
            return None, ["RAG risk module unavailable."]
        try:
            raw = self._call_rag_fn(self._rag_module, text)
        except Exception as exc:  # pragma: no cover - defensive logging
            return None, [f"RAG risk module error: {exc}"]
        if not isinstance(raw, dict):
            return None, ["RAG risk module returned an unexpected response."]

        tier = _tier_from_label(raw.get("risk_level") or raw.get("tier"))
        score = _normalize_score(raw.get("score", 0.0))
        flagged: List[str] = []
        notes: List[str] = []

        dimensions = raw.get("dimensions")
        if isinstance(dimensions, str):
            flagged.append(dimensions)
        elif isinstance(dimensions, (list, tuple)):
            flagged.extend([d for d in dimensions if isinstance(d, str)])

        dimension = raw.get("dimension")
        if isinstance(dimension, str):
            flagged.append(dimension)

        raw_notes = raw.get("notes") or []
        for note in raw_notes:
            if note:
                notes.append(str(note))

        emotion = raw.get("emotion")
        if emotion and not any("emotion" in n for n in notes):
            notes.append(f"emotion={emotion}")

        return RiskAssessment(tier=tier, score=score, flagged_keywords=flagged, notes=notes), []

    @staticmethod
    def _load_rag_module():
        try:
            from backend.core import risk_types
        except Exception:
            return None
        return risk_types

    @staticmethod
    def _call_rag_fn(mod, text: str):
        for name in ("assess", "analyze", "analyze_text", "evaluate", "predict", "classify", "run"):
            if hasattr(mod, name):
                return getattr(mod, name)(text)
        raise RuntimeError("RAG risk module is missing a callable entry point.")

    @staticmethod
    def _find_phrases(text: str, phrases: Iterable[str]) -> List[str]:
        hits = []
        for phrase in phrases:
            if phrase in text:
                hits.append(phrase)
        return hits

    @staticmethod
    def _find_keywords(text: str, keywords: Iterable[str]) -> List[str]:
        hits: List[str] = []
        token_set = set(_WORD_RE.findall(text))
        for keyword in keywords:
            if " " in keyword:
                if keyword in text:
                    hits.append(keyword)
            else:
                if keyword in token_set:
                    hits.append(keyword)
        return hits

    def suggest_resources(self, keywords: Iterable[str], tier: RiskTier) -> List[dict]:
        suggestions: List[dict] = []
        for keyword in keywords:
            resource = self.RESOURCE_MAP.get(keyword)
            if resource:
                suggestions.append(resource)

        if tier in {RiskTier.HIGH, RiskTier.CRISIS} and not any(
            res for res in suggestions if res.get("type") == "hotline"
        ):
            suggestions.append(
                {
                    "type": "hotline",
                    "label": "988 Suicide & Crisis Lifeline",
                    "link": "tel:988",
                }
            )
        return suggestions

    def _apply_adapters(
        self,
        text: str,
        sentiment: SentimentResult,
        current_tier: RiskTier,
        current_score: float,
    ) -> tuple[RiskTier, float, List[str], List[str]]:
        flagged: List[str] = []
        tier = current_tier
        score = current_score
        notes: List[str] = []

        for adapter in self.adapters:
            try:
                result = adapter(text, sentiment)
            except Exception as exc:  # pragma: no cover - defensive logging
                notes.append(f"Adapter '{getattr(adapter, '__name__', repr(adapter))}' failed: {exc}")
                continue
            if not result:
                continue
            flagged.extend(result.flagged_keywords)
            if _RISK_SEVERITY[result.tier] > _RISK_SEVERITY[tier]:
                tier = result.tier
                notes.append(
                    f"Adapter '{getattr(adapter, '__name__', repr(adapter))}' escalated tier to {result.tier.value}."
                )
            score = max(score, result.score)
            if result.notes:
                notes.extend(result.notes)

        return tier, score, flagged, notes
