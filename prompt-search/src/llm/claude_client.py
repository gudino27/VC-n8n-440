from typing import Dict, List, Optional

import anthropic

from .base import BaseLLMClient


class ClaudeClient(BaseLLMClient):
    def __init__(
        self,
        model: str = "claude-haiku-4-5",
        api_key: Optional[str] = None,
        stop_sequences: Optional[List[str]] = None,
    ):
        self.model = model
        self.stop_sequences = stop_sequences or []
        self._client = anthropic.Anthropic(api_key=api_key)
        self._total_input_tokens = 0
        self._total_output_tokens = 0

    def generate(self, prompt: str, temperature: float = 0.7, max_tokens: int = 500) -> str:
        response = self._client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=[{"role": "user", "content": prompt}],
            stop_sequences=self.stop_sequences or anthropic.NOT_GIVEN,
        )
        self._total_input_tokens += response.usage.input_tokens
        self._total_output_tokens += response.usage.output_tokens
        return next(block.text for block in response.content if block.type == "text")

    def get_usage_stats(self) -> Dict:
        return {
            "model": self.model,
            "provider": "claude",
            "total_input_tokens": self._total_input_tokens,
            "total_output_tokens": self._total_output_tokens,
            "total_tokens": self._total_input_tokens + self._total_output_tokens,
        }
