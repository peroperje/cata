from crawler.api_client import APIClient
import logging

class JobMatchPipeline:
    def __init__(self, api_url):
        self.api_client = APIClient(api_url)

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            api_url=crawler.settings.get('API_BASE_URL')
        )

    def open_spider(self, spider):
        spider.logger.info("Pipeline opened. Acting as light job filter.")

    def is_likely_job(self, text):
        """Very light filter to check if page content looks like a job post."""
        if not text:
            return False
            
        text_lower = text.lower()
        # Light 'job-data' criteria - international + local
        job_keywords = [
            'requirements', 'responsibilities', 'qualifications', 'experience', 'apply', 'salary', 'benefits',
            'job description', 'about the role', 'what you will do', 'what we offer', 'skills',
            'uslovi', 'odgovornosti', 'kvalifikacije', 'iskustvo', 'prijava', 'plata', 'benefiti', 'nudi',
            'opis posla', 'lokacija', 'radno vreme'
        ]
        matches = [kw for kw in job_keywords if kw in text_lower]
        
        # If it has at least 2 job-related keywords, we consider it a lead
        return len(matches) >= 2



    def process_item(self, item, spider):
        content = item.get('content', '')
        
        if self.is_likely_job(content):
            spider.logger.info(f"Light match found for URL: {item['url']}")
            job_payload = {
                "title": item.get('title', 'Unknown Title'),
                "url": item['url'],
                "content": content
            }
            self.api_client.post_job_found(job_payload)
        else:
            spider.logger.debug(f"Skipping non-job page: {item['url']}")
        
        return item
