from scrapy_redis.spiders import RedisCrawlSpider
from scrapy.spiders import Rule
from scrapy.linkextractors import LinkExtractor
from crawler.items import JobItem
from crawler.api_client import APIClient
from urllib.parse import urlparse
import re

class JobSpider(RedisCrawlSpider):
    name = 'job_spider'
    redis_key = 'job_spider:start_urls'
    
    # Dynamic domains will be handled in process_links or by allowed_domains setting
    # For RedisCrawlSpider, we can still use rules
    rules = (
        Rule(LinkExtractor(), process_links='filter_links', callback='parse_item', follow=True),
    )

    def __init__(self, *args, **kwargs):
        # RedisCrawlSpider handles initialization differently
        super(JobSpider, self).__init__(*args, **kwargs)
        self.api_client = APIClient()

    def filter_links(self, links):
        # Check if we should stop
        status = self.server.get('scraper:status')
        if status == b'stopped' or status == 'stopped':
            self.logger.info("Stop requested via Redis. Closing spider.")
            self.crawler.engine.close_spider(self, 'stopped_by_user')
            return []

        filtered_links = []
        # General job terms to prioritize/filter links
        # Added more English terms for Glassdoor, LinkedIn, etc.
        job_terms = [
            'job', 'career', 'vacancy', 'position', 'oglasi', 'posao', 
            'radno-mesto', 'konkurs', 'oglas/', 'listing', 'opening', 
            'detail', 'description', 'apply', 'careers'
        ]
        
        for link in links:
            url_lower = link.url.lower()
            text_lower = link.text.lower()
            
            # If standard job terms are in URL or link text, allow it
            if any(term in url_lower or term in text_lower for term in job_terms):
                filtered_links.append(link)
        
        return filtered_links

    def parse_item(self, response):
        # Check if we should stop
        status = self.server.get('scraper:status')
        if status == b'stopped' or status == 'stopped':
            self.logger.info("Stop requested via Redis. Closing spider.")
            self.crawler.engine.close_spider(self, 'stopped_by_user')
            return None

        if not hasattr(response, 'text'):
            return None

        self.logger.info(f'Processing possible job: {response.url}')
        item = JobItem()
        item['url'] = response.url
        item['title'] = (response.css('title::text').get() or 'No Title').strip()
        
        # More efficient and focused text extraction
        texts = response.xpath('//body//text()[not(parent::script or parent::style or parent::header or parent::footer)]').getall()
        text_content = " ".join(texts)
        
        # Clean up text - remove redundant whitespace
        text_content = re.sub(r'\s+', ' ', text_content).strip()
        item['content'] = text_content
        
        return item


