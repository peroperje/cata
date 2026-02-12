import time
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from app.gmail_client import GmailClient
from app.api_client import APIClient
from app.extractor import extract_jobs_from_html, extract_jobs_from_text
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_client = APIClient()
# Note: GmailClient will try to authenticate on init. 
# In a real Docker env, we might need a better way to handle the flow.
try:
    gmail_client = GmailClient()
except Exception as e:
    logger.error(f"Failed to initialize Gmail client: {e}")
    gmail_client = None

def poll_gmail():
    if not gmail_client:
        logger.error("Gmail client not initialized. Skipping poll.")
        return

    logger.info("Starting Gmail poll...")
    settings, filters = api_client.get_config()
    
    if not settings or not settings.get("is_active"):
        logger.info("Gmail sync is disabled in settings. Skipping.")
        return

    # Construct query based on filters
    if not filters:
        logger.info("No filters defined. Skipping poll.")
        return

    sender_query = " OR ".join([f"from:{f['email_sender']}" for f in filters])
    
    last_sync = settings.get("last_sync_at")
    query = f"({sender_query})"
    if last_sync:
        # Convert iso format to gmail 'after' format (YYY/MM/DD)
        # For simplicity, we'll just search for messages in the last day 
        # or use a more precise id-based tracking if needed.
        dt = datetime.fromisoformat(last_sync)
        query += f" after:{dt.strftime('%Y/%m/%d')}"

    messages = gmail_client.list_messages(query=query)
    logger.info(f"Found {len(messages)} potential messages.")

    for msg in messages:
        content_info = gmail_client.get_message_content(msg['id'])
        if not content_info:
            continue
        
        extracted_jobs = extract_jobs_from_html(content_info['content'])
        if not extracted_jobs:
            extracted_jobs = extract_jobs_from_text(content_info['content'])

        for job in extracted_jobs:
            logger.info(f"Posting job: {job['title']} at {job['company']}")
            api_client.post_job(job)

    api_client.update_last_sync()
    logger.info("Gmail poll completed.")

def main():
    scheduler = BackgroundScheduler()
    # Initial interval, will be updated from settings in the loop
    scheduler.add_job(poll_gmail, 'interval', minutes=15)
    scheduler.start()

    logger.info("Gmail API Service started.")
    try:
        while True:
            time.sleep(60)
            # Todo: Dynamic interval update from settings
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()

if __name__ == "__main__":
    main()
