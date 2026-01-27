import json
from typing import List
from huggingface_hub import InferenceClient
from app.services.ai.base import AIBaseProvider

class HuggingFaceProvider(AIBaseProvider):
    async def process(self, cv_text: str, form_data: List[dict], api_key: str, model_name: str) -> dict:
        print(f"DEBUG: Processing with Hugging Face model {model_name}")
        
        # Use InferenceClient with the new router endpoint
        client = InferenceClient(api_key=api_key, base_url="https://router.huggingface.co")

        prompt = f"""
        You are an expert AI assistant helping a candidate fill out a job application form based on their CV.
        Your goal is to provide thoughtful, natural, and well-written responses to subjective questions, while strictly extracting factual data.

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
           - Keep the tone professional, enthusiastic, and human-like.
        3. **Output Format**:
           - Return a single JSON object with a "mappings" array.
           - Each mapping must have: "fieldId", "fieldName", and "value".
           - **Data Types**: All 'value' fields MUST be strings.
        4. **CRITICAL**: Return ONLY a valid JSON object. No other text or explanation.
        """

        try:
            # We use chat completion for better instruction following on Llama 3
            messages = [
                {"role": "system", "content": "You are a specialized JSON generator for job application forms. You translate CV data into form fields. Return ONLY raw JSON."},
                {"role": "user", "content": prompt}
            ]
            
            # Using the chat completion interface which is standard for modern LLMs on HF
            response = client.chat_completion(
                model=model_name,
                messages=messages,
                max_tokens=2048,
                response_format={"type": "json_object"}
            )
            
            text = response.choices[0].message.content
            print(f"DEBUG: Hugging Face raw response: {text}")

        except Exception as e:
            print(f"DEBUG: Error calling Hugging Face API: {str(e)}")
            raise ValueError(f"Hugging Face API error: {str(e)}")

        if not text:
            raise ValueError("Hugging Face returned an empty response.")

        # Clean up in case the model returns markdown code blocks
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
            print(f"DEBUG: Failed to parse JSON from Hugging Face: {cleaned_text}")
            raise ValueError("AI returned invalid JSON structure.")
