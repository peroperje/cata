import json
from typing import List
import google.generativeai as genai
from app.services.ai.base import AIBaseProvider

class GeminiProvider(AIBaseProvider):
    async def process(self, cv_text: str, form_data: List[dict], api_key: str, model_name: str) -> dict:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)

        prompt = f"""
        You are an expert at mapping CV information to job application forms.

        CV TEXT:
        \"\"\"
        {cv_text}
        \"\"\"

        FORM FIELDS (JSON):
        \"\"\"
        {json.dumps(form_data, indent=2)}
        \"\"\"

        TASK:
        Map the data from the CV to the form fields.
        Return a JSON object with a \"mappings\" array.
        Each mapping should have: \"fieldId\", \"fieldName\", and \"value\".
        Only return the JSON. No preamble.
        """

        response = await model.generate_content_async(prompt)
        text = response.text

        # Clean up code blocks if Gemini returns them
        cleaned_text = text.replace('```json', '').replace('```', '').strip()

        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError:
            raise ValueError("AI returned invalid JSON structure.")
