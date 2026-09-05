import json
import os
from typing import Dict, List, Tuple, Any
import networkx as nx

TAXONOMY_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "skill_taxonomy_v1.json")
PREREQ_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "prerequisite_graph.json")

class SkillGraphEngine:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.skills_dict: Dict[str, Dict[str, Any]] = {}
        self._load_data()

    def _load_data(self):
        if os.path.exists(TAXONOMY_PATH):
            with open(TAXONOMY_PATH, "r") as f:
                tax_data = json.load(f)
                for cat in tax_data.get("categories", []):
                    cat_id = cat.get("id")
                    for s in cat.get("skills", []):
                        sid = s["id"]
                        self.skills_dict[sid] = {
                            "id": sid,
                            "name": s["name"],
                            "difficulty": s.get("difficulty", 3),
                            "category": cat_id,
                            "description": s.get("description", "")
                        }
                        self.graph.add_node(sid, **self.skills_dict[sid])

        if os.path.exists(PREREQ_PATH):
            with open(PREREQ_PATH, "r") as f:
                prereq_data = json.load(f)
                for edge in prereq_data.get("edges", []):
                    u = edge["source"]
                    v = edge["target"]
                    desc = edge.get("description", "")
                    if u in self.skills_dict and v in self.skills_dict:
                        self.graph.add_edge(u, v, description=desc)

    def analyze_skill_gaps(
        self,
        student_skills: Dict[str, int],
        required_skills: Dict[str, int]
    ) -> Dict[str, Any]:
        """
        Pure deterministic computation:
        - Checks which required skills are missing or below threshold
        - For each deficit, traverses prerequisite ancestry in topological order
        - Computes cumulative study hours and learning weeks
        """
        missing_skills = []
        weak_skills = []
        total_required_skills = len(required_skills)
        matched_skills_count = 0
        gap_severity_score = 0.0

        all_needed_prereqs = set()
        gap_breakdown = []

        for skill_id, min_prof in required_skills.items():
            actual_prof = student_skills.get(skill_id, 0)
            diff = min_prof - actual_prof
            skill_info = self.skills_dict.get(skill_id, {
                "name": skill_id.replace("_", " ").title(),
                "difficulty": 3
            })

            if actual_prof >= min_prof:
                matched_skills_count += 1
            elif actual_prof == 0:
                missing_skills.append(skill_id)
                gap_severity_score += diff
                # Ancestors in DAG
                if skill_id in self.graph:
                    ancestors = nx.ancestors(self.graph, skill_id)
                    for anc in ancestors:
                        if student_skills.get(anc, 0) < 2:
                            all_needed_prereqs.add(anc)
                gap_breakdown.append({
                    "skill_id": skill_id,
                    "skill_name": skill_info["name"],
                    "required_level": min_prof,
                    "actual_level": actual_prof,
                    "deficit": diff,
                    "status": "missing",
                    "difficulty": skill_info.get("difficulty", 3)
                })
            else:
                weak_skills.append(skill_id)
                gap_severity_score += diff
                gap_breakdown.append({
                    "skill_id": skill_id,
                    "skill_name": skill_info["name"],
                    "required_level": min_prof,
                    "actual_level": actual_prof,
                    "deficit": diff,
                    "status": "weak",
                    "difficulty": skill_info.get("difficulty", 3)
                })

        # Calculate coverage ratio
        coverage_ratio = (matched_skills_count / total_required_skills) if total_required_skills > 0 else 1.0

        # Topological sort for the prerequisite learning pathway
        subgraph_nodes = set(missing_skills) | set(weak_skills) | all_needed_prereqs
        subgraph = self.graph.subgraph(subgraph_nodes)
        
        try:
            topo_order = list(nx.topological_sort(subgraph))
        except Exception:
            topo_order = list(subgraph_nodes)

        learning_pathway = []
        total_hours = 0.0
        for node in topo_order:
            node_info = self.skills_dict.get(node, {
                "name": node.replace("_", " ").title(),
                "difficulty": 3
            })
            req_prof = required_skills.get(node, 3)
            cur_prof = student_skills.get(node, 0)
            delta = max(1, req_prof - cur_prof)
            hours = delta * (node_info.get("difficulty", 3) * 6)
            total_hours += hours
            learning_pathway.append({
                "skill_id": node,
                "skill_name": node_info["name"],
                "category": node_info.get("category", "general"),
                "estimated_hours": hours,
                "target_proficiency": req_prof,
                "current_proficiency": cur_prof,
                "is_prerequisite_ancestor": node in all_needed_prereqs
            })

        # Estimated weeks assuming 15 study hours/week
        estimated_weeks = round(total_hours / 15.0, 1)

        return {
            "total_required": total_required_skills,
            "matched_count": matched_skills_count,
            "coverage_ratio": round(coverage_ratio, 3),
            "coverage_percentage": round(coverage_ratio * 100, 1),
            "gap_severity": round(gap_severity_score, 2),
            "missing_skills": missing_skills,
            "weak_skills": weak_skills,
            "gap_breakdown": gap_breakdown,
            "topological_learning_pathway": learning_pathway,
            "estimated_bridging_hours": round(total_hours, 1),
            "estimated_bridging_weeks": estimated_weeks
        }

# Global singleton
graph_engine = SkillGraphEngine()
