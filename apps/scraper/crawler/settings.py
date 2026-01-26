import os

BOT_NAME = 'crawler'

SPIDER_MODULES = ['crawler.spiders']
NEWSPIDER_MODULE = 'crawler.spiders'

# Obey robots.txt rules
ROBOTSTXT_OBEY = True

# Scrapy-Redis Configuration
scheduler = "scrapy_redis.scheduler.Scheduler"
DUPEFILTER_CLASS = "scrapy_redis.dupefilter.RFPDupeFilter"
SCHEDULER_PERSIST = True

# Redis Connection
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')

# Item Pipelines
ITEM_PIPELINES = {
    'crawler.pipelines.JobMatchPipeline': 300,
    'scrapy_redis.pipelines.RedisPipeline': 400,
}

# API Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8000/api/v1')

# Requests
REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"
