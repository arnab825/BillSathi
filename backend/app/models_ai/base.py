from abc import ABC, abstractmethod
from typing import Dict, Any
from app.schemas.extraction import LLMExtractionOutput


class BaseExtractionModel(ABC):
    @abstractmethod
    async def is_available(self) -> bool:
        """Check if model service / engine is reachable and ready."""
        pass

    @abstractmethod
    async def extract(self, raw_text: str) -> LLMExtractionOutput:
        """Extract structured financial data from raw document text."""
        pass

    @abstractmethod
    def get_provider_info(self) -> Dict[str, Any]:
        """Return provider metadata, model name, type, and status."""
        pass
