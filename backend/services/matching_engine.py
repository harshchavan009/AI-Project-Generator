import json
import os
from typing import List, Dict, Any
import numpy as np

from backend.services.embedding_engine import embedding_engine
from backend.services.graph_engine import graph_engine
from backend.services.feasibility_engine import feasibility_scorer
from backend.services.hireability_engine import hireability_engine

CORPUS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "idea_corpus.json")

class MatchingEngine:
    def __init__(self):
        self.ideas: List[Dict[str, Any]] = []
        self._idea_embeddings: Dict[str, np.ndarray] = {}
        self._load_corpus()

    def _load_corpus(self):
        if os.path.exists(CORPUS_PATH):
            try:
                with open(CORPUS_PATH, "r") as f:
                    corpus_data = json.load(f)
                    self.ideas = corpus_data.get("ideas", [])
                    # Pre-embed idea descriptions
                    for idea in self.ideas:
                        text = f"{idea['title']}. {idea['domain']}. {idea['description']}"
                        self._idea_embeddings[idea["id"]] = embedding_engine.embed_text(text)
            except Exception as e:
                print(f"[MatchingEngine] Error loading ideas: {e}")

    def match_ideas_for_student(
        self,
        student_skills: Dict[str, int],
        interest_domains: List[str],
        team_size: int = 1,
        timeframe_weeks: int = 16,
        hardware_constraint: str = "CPU-only",
        relevance_weight: float = 0.55,
        feasibility_weight: float = 0.45,
        limit: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Pure, explainable deterministic matching algorithm:
        1. Local FastEmbed cosine similarity between student interests & idea descriptions
        2. Graph-based skill coverage ratio and topological prerequisite gap traversal
        3. Explainable feasibility rule engine + ML blend
        4. Novelty vector distance checking
        5. Tech stack hireability scoring
        6. Combined rank: (relevance_w * relevance) + (feasibility_w * feasibility)
        """
        interest_text = " ".join(interest_domains) if interest_domains else "General Software & AI Engineering"
        student_interest_vec = embedding_engine.embed_text(interest_text)

        matched_ideas = []

        for idea in self.ideas:
            idea_id = idea["id"]
            idea_desc_vec = self._idea_embeddings.get(idea_id)
            if idea_desc_vec is None:
                text = f"{idea['title']}. {idea['domain']}. {idea['description']}"
                idea_desc_vec = embedding_engine.embed_text(text)
                self._idea_embeddings[idea_id] = idea_desc_vec

            # (a) Cosine similarity for semantic domain relevance
            raw_sim = embedding_engine.cosine_similarity(student_interest_vec, idea_desc_vec)
            # Normalize to 0-1
            domain_sim = max(0.0, min(1.0, (raw_sim + 1.0) / 2.0))

            # Domain affinity boost if exact domain is in student's selected tags
            is_exact_domain = idea["domain"] in interest_domains
            if is_exact_domain:
                domain_sim = min(1.0, domain_sim + 0.15)

            # (b) Skill coverage & Topological prerequisite gap analysis via NetworkX DiGraph
            skill_analysis = graph_engine.analyze_skill_gaps(
                student_skills=student_skills,
                required_skills=idea["required_skills"]
            )

            coverage_ratio = skill_analysis["coverage_ratio"]
            gap_severity = skill_analysis["gap_severity"]

            # Relevance score (0-100)
            relevance_score = round(((domain_sim * 0.45) + (coverage_ratio * 0.55)) * 100.0, 1)

            # (c) Feasibility evaluation (Rule engine + Scikit-Learn blend)
            feasibility_res = feasibility_scorer.evaluate_feasibility(
                team_size=team_size,
                timeframe_weeks=timeframe_weeks,
                student_hardware=hardware_constraint,
                required_hardware=idea.get("hardware_requirement", "CPU-only"),
                skill_gap_severity=gap_severity,
                component_count=idea.get("component_count", 4),
                novel_algorithm_required=idea.get("novel_algorithm_required", False),
                typical_timeline_weeks=idea.get("typical_timeline_weeks", 16)
            )

            # (d) Novelty check (Vector index against public repos & department archive)
            novelty_res = embedding_engine.check_novelty(
                idea_title=idea["title"],
                idea_description=idea["description"],
                top_k=3
            )

            # (e) Placement-relevance / Hireability score
            hireability_res = hireability_engine.evaluate_hireability(
                tech_stack=idea.get("tech_stack", []),
                domain=idea["domain"]
            )

            # (f) Combined Score Ranking
            combined_score = round(
                (relevance_weight * relevance_score) + (feasibility_weight * feasibility_res["feasibility_score"]),
                1
            )

            matched_ideas.append({
                "id": idea_id,
                "title": idea["title"],
                "domain": idea["domain"],
                "description": idea["description"],
                "required_skills": idea["required_skills"],
                "typical_timeline_weeks": idea.get("typical_timeline_weeks", 16),
                "hardware_requirement": idea.get("hardware_requirement", "CPU-only"),
                "component_count": idea.get("component_count", 4),
                "novel_algorithm_required": idea.get("novel_algorithm_required", False),
                "tech_stack": idea.get("tech_stack", []),
                "mvp_features": idea.get("mvp_features", []),
                "stretch_features": idea.get("stretch_features", []),
                
                # Deterministic Scores & Explainable Breakdowns
                "combined_score": combined_score,
                "relevance_score": relevance_score,
                "domain_similarity_percentage": round(domain_sim * 100, 1),
                "is_domain_match": is_exact_domain,
                
                "skill_coverage": {
                    "coverage_ratio": coverage_ratio,
                    "coverage_percentage": skill_analysis["coverage_percentage"],
                    "matched_count": skill_analysis["matched_count"],
                    "total_required": skill_analysis["total_required"],
                    "gap_severity": gap_severity,
                    "missing_skills": skill_analysis["missing_skills"],
                    "weak_skills": skill_analysis["weak_skills"],
                    "gap_breakdown": skill_analysis["gap_breakdown"],
                    "topological_learning_pathway": skill_analysis["topological_learning_pathway"],
                    "estimated_bridging_weeks": skill_analysis["estimated_bridging_weeks"],
                    "estimated_bridging_hours": skill_analysis["estimated_bridging_hours"]
                },
                
                "feasibility": feasibility_res,
                "novelty": novelty_res,
                "hireability": hireability_res
            })

        # Sort ideas by combined score descending
        matched_ideas.sort(key=lambda x: x["combined_score"], reverse=True)
        return matched_ideas[:limit]

# Global singleton
matching_engine = MatchingEngine()
