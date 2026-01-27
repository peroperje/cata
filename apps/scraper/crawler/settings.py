import os

BOT_NAME = 'crawler'

SPIDER_MODULES = ['crawler.spiders']
NEWSPIDER_MODULE = 'crawler.spiders'

# Obey robots.txt rules
ROBOTSTXT_OBEY = True

# Scrapy-Redis Configuration
# Fix: SCHEDULER must be uppercase
SCHEDULER = "scrapy_redis.scheduler.Scheduler"
DUPEFILTER_CLASS = "scrapy_redis.dupefilter.RFPDupeFilter"
SCHEDULER_PERSIST = True

# Redis Connection
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')

# Performance Settings - Fixing high CPU and being a good spider
CONCURRENT_REQUESTS = 4
DOWNLOAD_DELAY = 2.0  # 2 seconds delay between requests
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 2.0
AUTOTHROTTLE_MAX_DELAY = 20.0
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0

# Breadth-first crawl settings
DEPTH_PRIORITY = 1
SCHEDULER_DISK_QUEUE = 'scrapy.squeue.PickleFifoDiskQueue'
SCHEDULER_MEMORY_QUEUE = 'scrapy.squeue.FifoMemoryQueue'

# Limit depth to avoid infinite crawling in large job boards
DEPTH_LIMIT = 3

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

