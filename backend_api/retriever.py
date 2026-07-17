import os
import pickle
import numpy as np
from utils.encoder import HashedTfidfEncoder

class Retriever:
    def __init__(self, data_dir=None, model_name='all-MiniLM-L6-v2'):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        if data_dir is None:
            data_dir = os.path.join(base_dir, "data")
            
        self.embeddings_path = os.path.join(data_dir, "embeddings.npy")
        self.metadata_path = os.path.join(data_dir, "metadata.pkl")
        
        self.model = HashedTfidfEncoder(dimension=384)
        self.embeddings = None
        self.metadata = None
        
        self.load_index()
        
    def load_index(self):
        """Loads embeddings and metadata from disk if they exist."""
        if os.path.exists(self.embeddings_path) and os.path.exists(self.metadata_path):
            try:
                self.embeddings = np.load(self.embeddings_path)
                with open(self.metadata_path, "rb") as f:
                    self.metadata = pickle.load(f)
            except Exception as e:
                print(f"Error loading vector index: {e}")
                self.embeddings = None
                self.metadata = None
                
    def retrieve(self, query, top_k=3, allowed_sources=None):
        """
        Embeds the query and computes cosine similarity against all document chunks.
        Returns a list of dicts with 'text', 'source', and 'score'.
        """
        if self.embeddings is None or self.metadata is None:
            # Try reloading in case ingestion happened after initialization
            self.load_index()
            if self.embeddings is None or self.metadata is None:
                return []
            
        # Embed query
        query_vector = self.model.encode(query)
        query_norm = np.linalg.norm(query_vector)
        if query_norm == 0:
            return []
        
        query_vector_norm = query_vector / query_norm
        
        # Calculate cosine similarity manually using numpy
        embeddings_norms = np.linalg.norm(self.embeddings, axis=1)
        # Avoid division by zero
        embeddings_norms[embeddings_norms == 0] = 1.0
        normalized_embeddings = self.embeddings / embeddings_norms[:, np.newaxis]
        
        similarities = np.dot(normalized_embeddings, query_vector_norm)
        
        # Apply team filter if allowed_sources is provided
        if allowed_sources is not None:
            allowed_set = set(allowed_sources)
            for idx in range(len(similarities)):
                source = self.metadata[idx].get("source")
                if source not in allowed_set:
                    similarities[idx] = -1.0
        
        # Get top K indices
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            if similarities[idx] < -0.9:
                continue
            score = float(similarities[idx])
            results.append({
                "text": self.metadata[idx]["text"],
                "source": self.metadata[idx]["source"],
                "score": score,
                "page_number": self.metadata[idx].get("page_number")
            })
            
        return results
