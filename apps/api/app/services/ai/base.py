from abc import ABC, abstractmethod
from typing import List

class AIBaseProvider(ABC):
    @abstractmethod
    async def process(self, cv_text: str, form_data: List[dict], api_key: str, model_name: str) -> dict:
        pass
