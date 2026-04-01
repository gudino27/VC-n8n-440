import json
import os

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer


class CourseRetriever:
    def __init__(self, index_dir: str = "data/domain"):
        self.index = faiss.read_index(os.path.join(index_dir, "courses.faiss"))
        with open(os.path.join(index_dir, "metadata.json")) as f:
            self.metadata = json.load(f)
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def search(self, query: str, top_k: int = 5) -> list:
        embedding = self.model.encode([query], convert_to_numpy=True).astype(np.float32)
        scores, indices = self.index.search(embedding, top_k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            entry = dict(self.metadata[idx])
            entry["score"] = float(score)
            results.append(entry)
        return results

    def get_by_code(self, course_code: str):
        # Normalize by collapsing internal spaces so "CPTS 122" matches "CPT S 122"
        import re
        def _norm(code):
            return re.sub(r'\s+', '', code.upper())

        target = _norm(course_code)
        for entry in self.metadata:
            if _norm(entry["course_code"]) == target:
                return entry
        return None
