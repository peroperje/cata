import re
import logging

logger = logging.getLogger(__name__)

class NLPUtils:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(NLPUtils, cls).__new__(cls)
        return cls._instance

    def _get_keywords(self, text):
        """Extract keywords from text using simple regex."""
        if not text:
            return set()
        # Clean text and split into words
        words = re.findall(r'\b\w{3,}\b', text.lower())
        # Filter out common stop words (minimal list for efficiency)
        stop_words = {'the', 'and', 'for', 'with', 'that', 'from', 'this', 'have', 'been', 'which', 'will', 'your', 'working', 'teams'}
        return {word for word in words if word not in stop_words}

    def calculate_similarity(self, text1, text2):
        """Calculate a simple keyword overlap ratio."""
        keywords1 = self._get_keywords(text1)
        keywords2 = self._get_keywords(text2)
        
        if not keywords1 or not keywords2:
            return 0.0
            
        intersection = keywords1.intersection(keywords2)
        # Ratio based on the smaller set to find "matching" rather than "identity"
        return len(intersection) / len(keywords1) if keywords1 else 0.0

    def calculate_similarity_vector(self, keywords1, text2):
        """Calculate similarity using pre-extracted keywords from CV."""
        if not keywords1 or not text2:
            return 0.0
            
        keywords2 = self._get_keywords(text2)
        intersection = set(keywords1).intersection(keywords2)
        
        return len(intersection) / len(keywords1) if keywords1 else 0.0

    def extract_keywords_list(self, text):
        """Helper to get keywords as a list for storage/passing."""
        return list(self._get_keywords(text))
