from scrapy.spiders import CrawlSpider, Rule
from scrapy.linkextractors import LinkExtractor
from crawler.items import JobItem
from crawler.api_client import APIClient
from crawler.nlp_utils import NLPUtils
import spacy

class JobSpider(CrawlSpider):
    name = 'job_spider'
    
    # These should ideally be passed as arguments or config
    allowed_domains = ['example.com'] # specific job board or just empty for broad crawl? 
    # Broad crawl is dangerous without limits. I'll adhere to specific domains if possible. 
    # But the prompt implies "discovers jobs", likely from a set of start_urls.
    start_urls = ['https://www.example.com/careers'] 

    rules = (
        Rule(LinkExtractor(), process_links='filter_links', callback='parse_item', follow=True),
    )

    def __init__(self, *args, **kwargs):
        super(JobSpider, self).__init__(*args, **kwargs)
        self.api_client = APIClient()
        self.nlp_utils = NLPUtils()
        
        cv_text = self.api_client.get_latest_cv_text()
        self.keywords = []
        if cv_text:
            doc = self.nlp_utils._nlp(cv_text)
            # Simple keyword extraction: Nouns and PROPNs
            self.keywords = [token.text.lower() for token in doc if token.pos_ in ('NOUN', 'PROPN') and not token.is_stop]
            self.keywords = list(set(self.keywords)) # deduplicate
        
        # Ensure we have start_urls if passed
        if 'url' in kwargs:
             self.start_urls = [kwargs.get('url')]

    def filter_links(self, links):
        if not self.keywords:
            return links
            
        filtered_links = []
        for link in links:
            # Check if any keyword matches the link text or url path
            # This is a bit naive but serves the purpose of "filtering/prioritizing"
            # We can also prioritize by yielding important links first, but filtering is easier to show.
            # Let's simple check if link text contains any keyword.
            text_lower = link.text.lower()
            url_lower = link.url.lower()
            
            # If standard job terms are in URL, always allow
            if any(term in url_lower for term in ['job', 'career', 'vacancy', 'position']):
                filtered_links.append(link)
                continue
                
            # Otherwise check for keywords
            if any(kw in text_lower or kw in url_lower for kw in self.keywords):
                 filtered_links.append(link)
        
        return filtered_links

    def parse_item(self, response):
        self.logger.info(f'Crawled: {response.url}')
        item = JobItem()
        item['url'] = response.url
        item['title'] = response.css('title::text').get()
        
        # Extract text content from the body, removing scripts and styles
        text_content = " ".join(response.css('body *::text').getall())
        # Clean up text
        import re
        text_content = re.sub(r'\s+', ' ', text_content).strip()
        item['content'] = text_content
        
        return item
