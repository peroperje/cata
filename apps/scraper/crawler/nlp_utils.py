import spacy
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import logging

logger = logging.getLogger(__name__)

class NLPUtils:
    _instance = None
    _nlp = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(NLPUtils, cls).__new__(cls)
            try:
                cls._nlp = spacy.load("en_core_web_md")
            except OSError:
                logger.warning("en_core_web_md not found, downloading...")
                from spacy.cli import download
                download("en_core_web_md")
                cls._nlp = spacy.load("en_core_web_md")
        return cls._instance

    def get_vector(self, text):
        if not text:
            return None
        doc = self._nlp(text)
        return doc.vector

    def calculate_similarity(self, text1, text2):
        vec1 = self.get_vector(text1)
        vec2 = self.get_vector(text2)

        if vec1 is None or vec2 is None:
            return 0.0

        return cosine_similarity([vec1], [vec2])[0][0]
    
    def calculate_similarity_vector(self, vec1, text2):
        vec2 = self.get_vector(text2)
        if vec1 is None or vec2 is None:
            return 0.0
        return cosine_similarity([vec1], [vec2])[0][0]
