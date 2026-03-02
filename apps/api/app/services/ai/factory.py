from app.services.ai.gemini import GeminiProvider
from app.services.ai.huggingface import HuggingFaceProvider
from app.services.ai.groq import GroqProvider

class AIProviderFactory:
    _providers = {
        "gemini": GeminiProvider(),
        "huggingface": HuggingFaceProvider(),
        "groq": GroqProvider(),
    }

    @classmethod
    def get_provider(cls, provider_name: str):
        provider = cls._providers.get(provider_name.lower())
        if not provider:
            raise ValueError(f"Provider {provider_name} not supported.")
        return provider
