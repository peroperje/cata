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
    # Rules for crawling
    rules = (
        # Job detail pages - these are the items we want
        Rule(
            LinkExtractor(allow=r'/posao/'),
            callback='parse_item',
            follow=False
        ),
        # Category/List pages - follow these to find jobs
        Rule(
            LinkExtractor(allow=r'/oglasi-za-posao/'),
            follow=True,
            process_links='filter_links'
        ),
    )

    def __init__(self, *args, **kwargs):
        super(JobSpider, self).__init__(*args, **kwargs)
        self.api_client = APIClient()

    def filter_links(self, links):
        # Check if we should stop
        status = self.server.get('scraper:status')
        if status == b'stopped' or status == 'stopped':
            return []

        # We allow all links that matched the rules (which already filtered for job/category patterns)
        self.logger.info(f"Crawl Trace: Processing {len(links)} links from rules")
        return links

    def parse_item(self, response):
        self.logger.info(f'PARSING ITEM: {response.url}')
        # Check if we should stop
        status = self.server.get('scraper:status')
        if status == b'stopped' or status == 'stopped':
            self.logger.info("Scraper stopped, skipping parse")
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


