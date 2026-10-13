import logging
from typing import Dict, Any
from app.models_ai.base import BaseExtractionModel
from app.models_ai.ollama_provider import OllamaProvider
from app.models_ai.fallback_provider import FallbackExtractionProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

_ollama_instance = OllamaProvider()
_fallback_instance = FallbackExtractionProvider()
_force_fallback = False


def set_force_fallback(force: bool):
    global _force_fallback
    _force_fallback = force


async def get_active_model() -> BaseExtractionModel:
    """
    Returns the Ollama open-weight provider if reachable,
    otherwise gracefully falls back to the deterministic fallback engine.
    """
    if _force_fallback:
        return _fallback_instance

    is_ollama_up = await _ollama_instance.is_available()
    if is_ollama_up:
        return _ollama_instance

    logger.info("Ollama is not currently reachable; using deterministic fallback engine.")
    return _fallback_instance


async def check_ai_health() -> Dict[str, Any]:
    """Provides complete health metrics of AI subsystem."""
    ollama_up = await _ollama_instance.is_available()
    active_provider = "ollama" if (ollama_up and not _force_fallback) else "fallback"

    return {
        "active_provider": active_provider,
        "forced_fallback": _force_fallback,
        "ollama": {
            "configured_url": settings.OLLAMA_BASE_URL,
            "configured_model": settings.OLLAMA_MODEL,
            "is_reachable": ollama_up,
            "last_latency_ms": _ollama_instance.last_latency_ms,
        },
        "fallback": {
            "is_ready": True,
            "last_latency_ms": _fallback_instance.last_latency_ms,
        },
        "instructions": (
            "To use Ollama natively, install Ollama and run `ollama run gemma2:2b` or `ollama run gemma:2b`."
            if not ollama_up
            else "Ollama is active and responding."
        ),
    }
