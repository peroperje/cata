import json
from typing import List
from google import genai
from app.services.ai.base import AIBaseProvider

class GeminiProvider(AIBaseProvider):
    async def process(self, cv_text: str, form_data: List[dict], api_key: str, model_name: str, instruction: str = None) -> dict:
        print(f"DEBUG: Processing with model {model_name}")
        client = genai.Client(api_key=api_key)

        instruction_prompt = ""
        if instruction:
            instruction_prompt = f"""
        ADDITIONAL INSTRUCTIONS FROM USER:
        \"\"\"
        {instruction}
        \"\"\"
        Please prioritize these instructions above general guidelines.
        """

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
        (Note: the "value" field in the JSON above represents the current content of the field on the page.)

        {instruction_prompt}

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
           - **Data Types**: All 'value' fields MUST be strings. Convert booleans (true/false) to strings ("true"/"false").
        """

        try:
            response = await client.aio.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    'response_mime_type': 'application/json',
                }
            )
        except Exception as e:
            print(f"DEBUG: Error calling Gemini API: {str(e)}")
            raise ValueError(f"Gemini API error: {str(e)}")

        if not response.text:
            print(f"DEBUG: Gemini returned empty response. Safety filters might be triggered. Response: {response}")
            raise ValueError("AI returned an empty response. This may be due to safety filters.")

        text = response.text
        print(f"DEBUG: AI raw response: {text}")

        # Clean up code blocks if Gemini returns them (though JSON mode should prevent this)
        cleaned_text = text.replace('```json', '').replace('```', '').strip()

        try:
            data = json.loads(cleaned_text)
            
            # If the AI returned the list directly, wrap it in a mappings object
            if isinstance(data, list):
                data = {"mappings": data}
            
            # Post-processing to ensure adherence to schema
            if "mappings" in data and isinstance(data["mappings"], list):
                valid_mappings = []
                for item in data["mappings"]:
                    if not isinstance(item, dict):
                        continue
                        
                    # Ensure required fields exist, use defaults if missing
                    field_id = str(item.get("fieldId", item.get("id", "")))
                    field_name = str(item.get("fieldName", item.get("name", "")))
                    value = item.get("value", "")
                    
                    # Force string conversion for value
                    if isinstance(value, bool):
                        value = str(value).lower()
                    else:
                        value = str(value)
                        
                    if field_id or field_name:
                        valid_mappings.append({
                            "fieldId": field_id,
                            "fieldName": field_name,
                            "value": value
                        })
                
                return {"mappings": valid_mappings}
            else:
                print(f"DEBUG: AI response missing 'mappings' key: {data}")
                raise ValueError("AI response missing 'mappings' key.")
                
        except json.JSONDecodeError:
            print(f"DEBUG: Failed to parse JSON: {cleaned_text}")
            raise ValueError("AI returned invalid JSON structure.")

    async def extract_metadata(self, page_text: str, api_key: str, model_name: str) -> dict:
        print(f"DEBUG: Extracting metadata with model {model_name}")
        client = genai.Client(api_key=api_key)

        prompt = f"""
        You are an expert at extracting job information from webpage content.
        Your task is to identify the **Job Title** and **Company Name** from the provided text.

        PAGE CONTENT:
        \"\"\"
        {page_text[:10000]}  # Truncate to avoid context window issues
        \"\"\"

        INSTRUCTIONS:
        1. Look for headings, prominent text, and job-related keywords.
        2. If the company name is not explicitly mentioned but implied (e.g., in the header), return it.
        3. Return a single JSON object with the following fields:
           - "title": The title of the job (string).
           - "company": The name of the hiring company (string).
        4. If you cannot find the information, return empty strings for the fields.

        Return ONLY the JSON object.
        """

        try:
            response = await client.aio.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    'response_mime_type': 'application/json',
                }
            )
        except Exception as e:
            print(f"DEBUG: Error calling Gemini API: {str(e)}")
            raise ValueError(f"Gemini API error: {str(e)}")

        if not response.text:
            raise ValueError("AI returned an empty response.")

        try:
            data = json.loads(response.text)
            return {
                "title": str(data.get("title", "")).strip(),
                "company": str(data.get("company", "")).strip()
            }
        except json.JSONDecodeError:
            print(f"DEBUG: Failed to parse metadata JSON: {response.text}")
            return {"title": "", "company": ""}
