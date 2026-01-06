import json
from typing import List
from google import genai
from app.services.ai.base import AIBaseProvider

class GeminiProvider(AIBaseProvider):
    async def process(self, cv_text: str, form_data: List[dict], api_key: str, model_name: str) -> dict:
        client = genai.Client(api_key=api_key)

        prompt = f"""
        You are an expert AI assistant helping a candidate fill out a job application form based on their CV.
        Your goal is to make the candidate shine by providing thoughtful, natural, and well-written responses to subjective questions, while strictly extracting factual data.

        CV TEXT:
        \"\"\"
        {cv_text}
        \"\"\"

        FORM FIELDS (JSON):
        \"\"\"
        {json.dumps(form_data, indent=2)}
        \"\"\"

        INSTRUCTIONS:
        1. **Factual Fields** (Name, Email, Phone, etc.): Extract the data exactly as it appears in the CV.
        2. **Subjective/Open-Ended Questions** (e.g., "Why are you interested?", "Proudest achievement?", "Technical challenge?", "Cover Letter content"):
           - Do NOT just copy-paste text from the CV.
           - Synthesize a new, natural, first-person response ("I have...") that directly answers the question using evidence from the CV.
           - For "Why are you interested?", relate the candidate's background (years of experience, specific tech stack) to a general desire for growth and impact in a role that fits their profile.
           - For "Proudest achievement", pick a significant accomplishment or project from the CV and frame it as a success story.
           - Keep the tone professional, enthusiastic, and human-like.
        3. **Output Format**:
           - Return a single JSON object with a "mappings" array.
           - Each mapping must have: "fieldId", "fieldName", and "value".
           - Return ONLY the JSON. No markdown blocking (```json), no preamble.
        """

        response = await client.aio.models.generate_content(
            model=model_name,
            contents=prompt
        )
        text = response.text

        # Clean up code blocks if Gemini returns them
        cleaned_text = text.replace('```json', '').replace('```', '').strip()

        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError:
            raise ValueError("AI returned invalid JSON structure.")
