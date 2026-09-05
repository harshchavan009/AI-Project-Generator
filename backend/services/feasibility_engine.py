import os
import joblib
import numpy as np
from typing import Dict, Any, List

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "feasibility_model.joblib")

class FeasibilityScorer:
    def __init__(self):
        self._ml_bundle = None
        self._load_ml_model()

    def _load_ml_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                self._ml_bundle = joblib.load(MODEL_PATH)
            except Exception as e:
                print(f"[FeasibilityScorer] Warning loading ML model: {e}")

    def evaluate_feasibility(
        self,
        team_size: int,
        timeframe_weeks: int,
        student_hardware: str,
        required_hardware: str,
        skill_gap_severity: float,
        component_count: int,
        novel_algorithm_required: bool,
        typical_timeline_weeks: int = 16
    ) -> Dict[str, Any]:
        """
        Deterministic, explainable rule engine + scikit-learn ML blend:
        Outputs 0-100 score + granular factor breakdown showing every penalty and credit.
        """
        rule_score = 100.0
        breakdown: List[Dict[str, Any]] = []

        # -------------------------------------------------------------
        # Rule 1: Hardware Constraint Matching
        # -------------------------------------------------------------
        hw_match_factor = 1.0
        std_hw_lower = student_hardware.lower()
        req_hw_lower = required_hardware.lower()

        if req_hw_lower in ["none", "cpu-only"] or req_hw_lower == std_hw_lower:
            hw_match_factor = 1.0
            breakdown.append({
                "factor": "Hardware Compatibility",
                "impact": 0.0,
                "status": "PASS",
                "explanation": f"Student environment ({student_hardware}) satisfies project requirement ({required_hardware})."
            })
        elif "gpu" in req_hw_lower and "gpu" not in std_hw_lower:
            hw_penalty = -18.0
            rule_score += hw_penalty
            hw_match_factor = 0.4
            breakdown.append({
                "factor": "Hardware Constraint Mismatch",
                "impact": hw_penalty,
                "status": "PENALTY",
                "explanation": f"Project requires dedicated GPU acceleration; student has {student_hardware}. Cloud GPU or quantization required."
            })
        elif "iot" in req_hw_lower and "iot" not in std_hw_lower:
            hw_penalty = -22.0
            rule_score += hw_penalty
            hw_match_factor = 0.2
            breakdown.append({
                "factor": "Physical Hardware Constraint",
                "impact": hw_penalty,
                "status": "PENALTY",
                "explanation": f"Project requires embedded IoT/microcontroller testbench; student selected {student_hardware}."
            })
        else:
            hw_penalty = -8.0
            rule_score += hw_penalty
            hw_match_factor = 0.7
            breakdown.append({
                "factor": "Hardware Disparity",
                "impact": hw_penalty,
                "status": "PENALTY",
                "explanation": f"Minor hardware divergence between {student_hardware} and required {required_hardware}."
            })

        # -------------------------------------------------------------
        # Rule 2: Skill Gap Severity
        # -------------------------------------------------------------
        if skill_gap_severity == 0:
            bonus = 6.0
            rule_score += bonus
            breakdown.append({
                "factor": "Skill Readiness",
                "impact": bonus,
                "status": "CREDIT",
                "explanation": "Student proficiency fully matches all required prerequisite skills without missing competencies."
            })
        elif skill_gap_severity <= 3.0:
            gap_penalty = -4.0 * skill_gap_severity
            rule_score += gap_penalty
            breakdown.append({
                "factor": "Moderate Skill Gap",
                "impact": round(gap_penalty, 1),
                "status": "PENALTY",
                "explanation": f"Minor proficiency delta ({skill_gap_severity:.1f} pts) easily bridgeable during initial 2-3 sprint weeks."
            })
        else:
            gap_penalty = min(35.0, 12.0 + (skill_gap_severity - 3.0) * 4.5)
            rule_score -= gap_penalty
            breakdown.append({
                "factor": "Significant Skill Gap",
                "impact": -round(gap_penalty, 1),
                "status": "PENALTY",
                "explanation": f"High deficit ({skill_gap_severity:.1f} pts) across key architectural competencies demands substantial ramp-up."
            })

        # -------------------------------------------------------------
        # Rule 3: Team Capacity vs Component Breadth
        # -------------------------------------------------------------
        if team_size == 1 and component_count >= 5:
            team_penalty = -14.0
            rule_score += team_penalty
            breakdown.append({
                "factor": "Solo Developer Component Load",
                "impact": team_penalty,
                "status": "PENALTY",
                "explanation": f"Solo engineer tasked with {component_count} distinct architectural subsystems increases delivery risk."
            })
        elif team_size >= 3 and component_count <= 4:
            team_credit = 6.0
            rule_score += team_credit
            breakdown.append({
                "factor": "Team Parallelization Capacity",
                "impact": team_credit,
                "status": "CREDIT",
                "explanation": f"Team of {team_size} provides ample bandwidth to parallelize {component_count} module deliverables."
            })
        else:
            breakdown.append({
                "factor": "Team Allocation",
                "impact": 0.0,
                "status": "PASS",
                "explanation": f"Team size of {team_size} is balanced for {component_count} subsystem components."
            })

        # -------------------------------------------------------------
        # Rule 4: Timeframe Schedule Compression
        # -------------------------------------------------------------
        timeline_delta = timeframe_weeks - typical_timeline_weeks
        if timeline_delta < 0:
            time_penalty = max(-24.0, timeline_delta * 3.0)
            rule_score += time_penalty
            breakdown.append({
                "factor": "Timeline Compression",
                "impact": round(time_penalty, 1),
                "status": "PENALTY",
                "explanation": f"Allotted {timeframe_weeks} weeks is {abs(timeline_delta)} weeks shorter than typical benchmark ({typical_timeline_weeks} wks)."
            })
        elif timeline_delta >= 4:
            time_credit = 5.0
            rule_score += time_credit
            breakdown.append({
                "factor": "Buffer Timeline Margin",
                "impact": time_credit,
                "status": "CREDIT",
                "explanation": f"Allotted {timeframe_weeks} weeks provides a generous {timeline_delta}-week safety buffer."
            })
        else:
            breakdown.append({
                "factor": "Timeline Alignment",
                "impact": 0.0,
                "status": "PASS",
                "explanation": f"Allotted {timeframe_weeks} weeks matches typical implementation duration ({typical_timeline_weeks} wks)."
            })

        # -------------------------------------------------------------
        # Rule 5: Algorithmic Novelty Risk
        # -------------------------------------------------------------
        if novel_algorithm_required:
            novel_penalty = -8.0
            rule_score += novel_penalty
            breakdown.append({
                "factor": "Novel Algorithm R&D Risk",
                "impact": novel_penalty,
                "status": "PENALTY",
                "explanation": "Requires custom non-trivial algorithmic design, increasing experimental uncertainty."
            })
        else:
            breakdown.append({
                "factor": "Established Architectural Patterns",
                "impact": 0.0,
                "status": "PASS",
                "explanation": "Relies on validated, battle-tested engineering patterns without open R&D risk."
            })

        rule_score_clamped = max(5.0, min(98.0, round(rule_score, 1)))

        # -------------------------------------------------------------
        # Optional ML Scikit-Learn Model Prediction Blend
        # -------------------------------------------------------------
        ml_score = rule_score_clamped
        ml_prob = None
        if self._ml_bundle and "model" in self._ml_bundle:
            try:
                clf = self._ml_bundle["model"]
                X = np.array([[
                    float(team_size),
                    float(timeframe_weeks),
                    float(hw_match_factor),
                    float(skill_gap_severity),
                    float(component_count),
                    1.0 if novel_algorithm_required else 0.0
                ]])
                prob = float(clf.predict_proba(X)[0][1])
                ml_prob = round(prob, 3)
                ml_score = round(prob * 100.0, 1)
            except Exception as e:
                print(f"[FeasibilityScorer] ML predict error: {e}")

        # Blend: 70% rule engine + 30% ML model
        final_feasibility = round((0.70 * rule_score_clamped) + (0.30 * ml_score), 1)
        final_feasibility = max(5.0, min(98.0, final_feasibility))

        feasibility_band = "HIGH" if final_feasibility >= 75 else (
            "MODERATE" if final_feasibility >= 50 else "LOW (HIGH RISK)"
        )

        return {
            "feasibility_score": final_feasibility,
            "feasibility_band": feasibility_band,
            "rule_score": rule_score_clamped,
            "ml_completion_probability": ml_prob if ml_prob is not None else round(final_feasibility / 100.0, 2),
            "factor_breakdown": breakdown,
            "rules_applied_count": len(breakdown)
        }

# Global singleton
feasibility_scorer = FeasibilityScorer()
