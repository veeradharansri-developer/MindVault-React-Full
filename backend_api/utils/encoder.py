import re
import hashlib
import numpy as np
from collections import Counter

class HashedTfidfEncoder:
    def __init__(self, dimension=384):
        self.dimension = dimension

    def _tokenize(self, text):
        return re.findall(r'\w+', text.lower())

    def _hash_word(self, word):
        # Deterministic MD5 hash to index mapping (avoids Python's process-salting hash() variance)
        h = hashlib.md5(word.encode('utf-8')).hexdigest()
        return int(h, 16) % self.dimension

    def encode(self, texts, convert_to_numpy=True, show_progress_bar=False):
        is_single = isinstance(texts, str)
        if is_single:
            texts = [texts]
            
        vectors = []
        for text in texts:
            words = self._tokenize(text)
            vec = np.zeros(self.dimension)
            if words:
                counts = Counter(words)
                for word, count in counts.items():
                    idx = self._hash_word(word)
                    # TF count normalized by total words
                    tf = count / len(words)
                    vec[idx] += tf
                
                # Normalize vector to unit length
                norm = np.linalg.norm(vec)
                if norm > 0:
                    vec = vec / norm
            vectors.append(vec)
            
        return np.array(vectors) if not is_single else vectors[0]
