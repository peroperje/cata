import scrapy

class JobItem(scrapy.Item):
    title = scrapy.Field()
    url = scrapy.Field()
    content = scrapy.Field()
    similarity_score = scrapy.Field()
