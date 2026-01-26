import requests
import logging
import os

logger = logging.getLogger(__name__)

class APIClient:
    def __init__(self, base_url=None):
        self.base_url = base_url or os.getenv('API_BASE_URL', 'http://localhost:8000/api/v1')

    def get_latest_cv_text(self):
        try:
            response = requests.get(f"{self.base_url}/cvs")
            response.raise_for_status()
            cvs = response.json()
            if cvs:
                # Assuming the first one is the latest as per API implementation
                return cvs[0]['text']
            return None
        except Exception as e:
            logger.error(f"Error fetching CV: {e}")
            return None

    def post_job_found(self, job_data):
        try:
            response = requests.post(f"{self.base_url}/jobs/found", json=job_data)
            response.raise_for_status()
            logger.info(f"Successfully posted job: {job_data.get('url')}")
            return response.json()
        except Exception as e:
            logger.error(f"Error posting job: {e}")
            return None
