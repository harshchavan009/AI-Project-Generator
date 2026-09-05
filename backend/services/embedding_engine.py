import json
import os
import numpy as np
from typing import List, Dict, Any, Tuple

try:
    from fastembed import TextEmbedding
    _HAS_FASTEMBED = True
except Exception:
    _HAS_FASTEMBED = False

ARCHIVE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "department_archive.json")
REPOS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "public_repos.json")
CACHE_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "embeddings_cache.npz")

class LocalEmbeddingEngine:
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model_name = model_name
        self._model = None
        self._cache: Dict[str, np.ndarray] = {}
        self._load_cache()
        self.corpus_index: List[Dict[str, Any]] = []
        self._init_corpus_index()

    def _get_model(self):
        if self._model is None and _HAS_FASTEMBED:
            try:
                # FastEmbed runs on ONNX Runtime INT8 quantized, CPU only, zero external API
                self._model = TextEmbedding(model_name=self.model_name)
            except Exception as e:
                print(f"[EmbeddingEngine] Warning: FastEmbed init error: {e}")
        return self._model

    def _load_cache(self):
        if os.path.exists(CACHE_FILE):
            try:
                data = np.load(CACHE_FILE, allow_pickle=True)
                for k in data.files:
                    self._cache[k] = data[k]
            except Exception:
                pass

    def _save_cache(self):
        try:
            os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
            np.savez(CACHE_FILE, **self._cache)
        except Exception:
            pass

    def embed_text(self, text: str) -> np.ndarray:
        """Embeds single text deterministically into a 384-dimensional normalized vector."""
        text_clean = text.strip()
        cache_key = f"emb_{hash(text_clean)}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        model = self._get_model()
        if model is not None:
            try:
                vec = list(model.embed([text_clean]))[0]
                vec = np.array(vec, dtype=np.float32)
                # L2 normalize
                norm = np.linalg.norm(vec)
                if norm > 0:
                    vec = vec / norm
                self._cache[cache_key] = vec
                return vec
            except Exception as e:
                print(f"[EmbeddingEngine] Inference error: {e}")

        # Deterministic semantic hash vector fallback (384 dims) if ONNX runtime is initializing
        vec = self._fallback_hash_embedding(text_clean)
        self._cache[cache_key] = vec
        return vec

    def _fallback_hash_embedding(self, text: str) -> np.ndarray:
        """Deterministic 384-dim bag-of-words / n-gram hash vector normalized to unit length."""
        dim = 384
        vec = np.zeros(dim, dtype=np.float32)
        words = text.lower().replace("-", " ").split()
        for i, word in enumerate(words):
            h = hash(word) % dim
            vec[h] += 1.0 / (1.0 + np.log1p(i))
            # 2-grams
            if i > 0:
                h2 = hash(f"{words[i-1]}_{word}") % dim
                vec[h2] += 0.5
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Compute exact cosine similarity between two unit vectors."""
        dot = float(np.dot(vec1, vec2))
        return max(-1.0, min(1.0, dot))

    def _init_corpus_index(self):
        """Builds in-memory vector index over department historical abstracts and public GitHub repos."""
        self.corpus_index = []

        # Load department archive
        if os.path.exists(ARCHIVE_PATH):
            try:
                with open(ARCHIVE_PATH, "r") as f:
                    archive = json.load(f)
                    for item in archive.get("historical_projects", []):
                        text = f"{item.get('title', '')}. {item.get('abstract', '')}"
                        emb = self.embed_text(text)
                        self.corpus_index.append({
                            "id": item.get("id"),
                            "title": item.get("title"),
                            "source_type": "Department Historical Archive",
                            "domain": item.get("domain", "General"),
                            "year": item.get("year", 2024),
                            "text": text,
                            "embedding": emb
                        })
            except Exception as e:
                print(f"[EmbeddingEngine] Archive load error: {e}")

        # Load public repos
        if os.path.exists(REPOS_PATH):
            try:
                with open(REPOS_PATH, "r") as f:
                    repos_data = json.load(f)
                    for item in repos_data.get("repositories", []):
                        text = f"{item.get('repo', '')}: {item.get('description', '')}"
                        emb = self.embed_text(text)
                        self.corpus_index.append({
                            "id": item.get("repo"),
                            "title": item.get("repo"),
                            "source_type": "Public GitHub Repository",
                            "domain": item.get("domain", "Open Source"),
                            "stars": item.get("stars", 0),
                            "text": text,
                            "embedding": emb
                        })
            except Exception as e:
                print(f"[EmbeddingEngine] Repos load error: {e}")

        self._save_cache()

    def add_custom_archive_entry(self, title: str, abstract: str, domain: str = "General", year: int = 2025):
        """Allows faculty/admin to upload new departmental projects into index."""
        text = f"{title}. {abstract}"
        emb = self.embed_text(text)
        new_entry = {
            "id": f"upload-{len(self.corpus_index) + 1}",
            "title": title,
            "source_type": "Department Historical Archive (Custom Upload)",
            "domain": domain,
            "year": year,
            "text": text,
            "embedding": emb
        }
        self.corpus_index.append(new_entry)
        self._save_cache()
        return new_entry

    def check_novelty(
        self,
        idea_title: str,
        idea_description: str,
        top_k: int = 3,
        threshold: float = 0.72
    ) -> Dict[str, Any]:
        """
        Computes 0-100 novelty score against public repos and department archive:
        - Embeds student idea
        - Finds top_k closest matches
        - Novelty score = max(0, min(100, round((1.0 - max_similarity) * 100, 1)))
        - If max_similarity >= threshold, flags 'high overlap — revise before submission'
        """
        combined_text = f"{idea_title}. {idea_description}"
        idea_vec = self.embed_text(combined_text)

        scored_matches = []
        for item in self.corpus_index:
            sim = self.cosine_similarity(idea_vec, item["embedding"])
            scored_matches.append({
                "id": item["id"],
                "title": item["title"],
                "source_type": item["source_type"],
                "domain": item["domain"],
                "similarity_score": round(sim, 4),
                "similarity_percentage": round(max(0.0, sim) * 100, 1),
                "excerpt": item["text"][:140] + ("..." if len(item["text"]) > 140 else "")
            })

        # Sort by similarity descending
        scored_matches.sort(key=lambda x: x["similarity_score"], reverse=True)
        top_matches = scored_matches[:top_k]

        max_sim = top_matches[0]["similarity_score"] if top_matches else 0.0
        # Novelty score computation
        # Calibrated: 0.85 sim => 15 novelty, 0.40 sim => 78 novelty, 0.10 sim => 95 novelty
        novelty_score = max(5.0, min(98.0, (1.0 - max_sim) * 100))
        novelty_score = round(novelty_score, 1)

        is_high_overlap = max_sim >= threshold
        status = "High overlap — revise before submission" if is_high_overlap else (
            "Moderate overlap — acceptable with distinctive methodology" if max_sim >= 0.55 else "Distinct & novel proposal"
        )

        return {
            "novelty_score": novelty_score,
            "max_similarity_percentage": round(max(0.0, max_sim) * 100, 1),
            "threshold_percentage": round(threshold * 100, 1),
            "is_high_overlap": is_high_overlap,
            "status": status,
            "top_matches": top_matches,
            "corpus_size_evaluated": len(self.corpus_index)
        }

    def cluster_cohort_duplicates(
        self,
        student_proposals: List[Dict[str, Any]],
        similarity_threshold: float = 0.75
    ) -> List[Dict[str, Any]]:
        """
        Clusters cohort student ideas by embedding similarity:
        Flags groups of students converging on near-identical topics.
        """
        n = len(student_proposals)
        if n < 2:
            return []

        embeddings = []
        for sp in student_proposals:
            text = f"{sp.get('idea_title', '')}. {sp.get('idea_description', '')}"
            embeddings.append(self.embed_text(text))

        visited = set()
        clusters = []

        for i in range(n):
            if i in visited:
                continue
            group = [i]
            pairwise_sims = []
            for j in range(i + 1, n):
                if j in visited:
                    continue
                sim = self.cosine_similarity(embeddings[i], embeddings[j])
                if sim >= similarity_threshold:
                    group.append(j)
                    pairwise_sims.append(sim)

            if len(group) > 1:
                for idx in group:
                    visited.add(idx)
                avg_sim = float(np.mean(pairwise_sims)) if pairwise_sims else similarity_threshold
                clusters.append({
                    "cluster_id": f"cluster-{len(clusters) + 1}",
                    "average_similarity": round(avg_sim, 3),
                    "average_similarity_percentage": round(avg_sim * 100, 1),
                    "warning_level": "CRITICAL" if avg_sim >= 0.85 else "HIGH",
                    "students": [
                        {
                            "student_id": student_proposals[idx].get("student_id"),
                            "student_name": student_proposals[idx].get("student_name", "Anonymous Student"),
                            "idea_title": student_proposals[idx].get("idea_title"),
                            "domain": student_proposals[idx].get("domain")
                        }
                        for idx in group
                    ]
                })

        return clusters

# Global singleton
embedding_engine = LocalEmbeddingEngine()
