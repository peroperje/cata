from itemadapter import ItemAdapter
from crawler.nlp_utils import NLPUtils
from crawler.api_client import APIClient
import logging

class JobMatchPipeline:
    def __init__(self, api_url):
        self.nlp = NLPUtils()
        self.api_client = APIClient(api_url)
        self.cv_text = None
        self.cv_vector = None
        self.threshold = 0.5 # Defined threshold

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            api_url=crawler.settings.get('API_BASE_URL')
        )

    def open_spider(self, spider):
        self.cv_text = self.api_client.get_latest_cv_text()
        if self.cv_text:
            self.cv_vector = self.nlp.get_vector(self.cv_text)
            spider.logger.info("CV text fetched and vectorized.")
        else:
            spider.logger.warning("Could not fetch CV text from API.")

    def process_item(self, item, spider):
        if not self.cv_vector is None and item.get('content'):
            score = self.nlp.calculate_similarity_vector(self.cv_vector, item['content'])
            item['similarity_score'] = float(score)

            if score >= self.threshold:
                spider.logger.info(f"Match found! Score: {score} for URL: {item['url']}")
                job_payload = {
                    "title": item.get('title', 'Unknown Title'),
                    "url": item['url'],
                    "similarity_score": float(score)
                }
                self.api_client.post_job_found(job_payload)
            else:
                spider.logger.debug(f"Score {score} beLow threshold for URL: {item['url']}")
        
        return item
