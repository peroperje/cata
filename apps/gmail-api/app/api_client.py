import httpx
import os
import logging

logger = logging.getLogger(__name__)

class APIClient:
    def __init__(self, base_url=None):
        self.base_url = base_url or os.getenv("API_URL", "http://api:8000/api/v1")

    def get_config(self):
        """Fetch settings and filters from the backend."""
        try:
            with httpx.Client(base_url=self.base_url) as client:
                settings = client.get("/gmail/settings").json()
                filters = client.get("/gmail/filters").json()
                return settings, filters
        except Exception as e:
            logger.error(f"Error fetching config: {e}")
            return None, None

    def post_job(self, job_data):
        """Send extracted job to the backend."""
        try:
            with httpx.Client(base_url=self.base_url) as client:
                response = client.post("/gmail/jobs", json=job_data)
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Error posting job: {e}")
            return False

    def update_last_sync(self):
        """Update last sync timestamp in backend."""
        try:
            from datetime import datetime
            with httpx.Client(base_url=self.base_url) as client:
                client.patch("/gmail/settings", json={"last_sync_at": datetime.utcnow().isoformat()})
        except Exception as e:
            logger.error(f"Error updating last sync: {e}")
