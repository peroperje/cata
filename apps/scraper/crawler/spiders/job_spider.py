from scrapy.spiders import CrawlSpider, Rule
from scrapy.linkextractors import LinkExtractor
from crawler.items import JobItem
from crawler.api_client import APIClient
from urllib.parse import urlparse
import re

class JobSpider(CrawlSpider):
    name = 'job_spider'
    
    allowed_domains = []
    start_urls = []

    rules = (
        Rule(LinkExtractor(), process_links='filter_links', callback='parse_item', follow=True),
    )

    def __init__(self, *args, **kwargs):
        super(JobSpider, self).__init__(*args, **kwargs)
        self.api_client = APIClient()
        
        # Priority: explicit 'url' argument
        url = kwargs.get('url')
        if url:
            self.start_urls = [url]
            domain = urlparse(url).netloc
            if domain:
                self.allowed_domains = [domain]
        elif not self.start_urls:
            # Default fallback for testing
            self.start_urls = ['https://www.example.com/careers']
            self.allowed_domains = ['example.com']

    def filter_links(self, links):
        filtered_links = []
        # General job terms to prioritize/filter links
        job_terms = ['job', 'career', 'vacancy', 'position', 'oglasi', 'posao', 'radno-mesto', 'konkurs', 'oglas/']
        
        for link in links:
            url_lower = link.url.lower()
            text_lower = link.text.lower()
            
            # If standard job terms are in URL or link text, allow it
            if any(term in url_lower or term in text_lower for term in job_terms):
                filtered_links.append(link)
        
        return filtered_links

    def parse_item(self, response):
        if not hasattr(response, 'text'):
            return None

        self.logger.info(f'Processing possible job: {response.url}')
        item = JobItem()
        item['url'] = response.url
        item['title'] = (response.css('title::text').get() or 'No Title').strip()
        
        # More efficient and focused text extraction
        # Using xpath to get all text nodes in body except scripts/styles
        texts = response.xpath('//body//text()[not(parent::script or parent::style or parent::header or parent::footer)]').getall()
        text_content = " ".join(texts)
        
        # Clean up text - remove redundant whitespace
        text_content = re.sub(r'\s+', ' ', text_content).strip()
        item['content'] = text_content
        
        return item

