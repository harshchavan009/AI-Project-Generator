"""
Unit Tests for Pure Feasibility Engine Scoring Logic & Edge Cases.
Validates explainable rule penalty factors, ML probability scoring, and parameter boundaries.
"""

import pytest
from backend.services.feasibility_engine import feasibility_scorer

def test_zero_timeframe_edge_case():
    """Edge Case: Student enters zero or negative timeframe."""
    result = feasibility_scorer.evaluate_feasibility(
        team_size=1,
        timeframe_weeks=0,
        student_hardware="CPU-only",
        required_hardware="CPU-only",
        skill_gap_severity=0.0,
        component_count=4,
        novel_algorithm_required=False,
        typical_timeline_weeks=16
    )

    # Must clamp cleanly without ZeroDivisionError
    assert 0.0 <= result["feasibility_score"] <= 100.0
    # Must flag severe timeline compression factor
    timeline_factor = next((f for f in result["factor_breakdown"] if "Timeline" in f["factor"]), None)
    assert timeline_factor is not None
    assert timeline_factor["impact"] < 0

def test_massive_component_count_edge_case():
    """Edge Case: Idea has extreme architectural complexity (e.g. 50 microservices/components)."""
    result = feasibility_scorer.evaluate_feasibility(
        team_size=1,
        timeframe_weeks=16,
        student_hardware="CPU-only",
        required_hardware="CPU-only",
        skill_gap_severity=0.2,
        component_count=50,
        novel_algorithm_required=False,
        typical_timeline_weeks=16
    )

    # Solo developer component load penalty factor must be present
    comp_factor = next((f for f in result["factor_breakdown"] if "Solo Developer" in f["factor"] or "Component" in f["factor"]), None)
    assert comp_factor is not None
    assert comp_factor["impact"] < 0
    # Should result in low or moderate feasibility band
    assert result["feasibility_band"] in ["LOW (HIGH RISK)", "MODERATE"]

def test_hardware_constraint_mismatch():
    """Edge Case: Project requires specialized IoT hardware, student only has CPU-only workstation."""
    result = feasibility_scorer.evaluate_feasibility(
        team_size=2,
        timeframe_weeks=16,
        student_hardware="CPU-only",
        required_hardware="IoT hardware",
        skill_gap_severity=0.0,
        component_count=3,
        novel_algorithm_required=False,
        typical_timeline_weeks=16
    )

    hw_factor = next((f for f in result["factor_breakdown"] if "Hardware" in f["factor"]), None)
    assert hw_factor is not None
    assert hw_factor["impact"] <= -18.0

def test_ideal_feasibility_scenario():
    """Scenario: Ample timeframe (32 weeks), large team (4 students), matching hardware, no gaps."""
    result = feasibility_scorer.evaluate_feasibility(
        team_size=4,
        timeframe_weeks=32,
        student_hardware="GPU available",
        required_hardware="GPU available",
        skill_gap_severity=0.0,
        component_count=3,
        novel_algorithm_required=False,
        typical_timeline_weeks=12
    )

    assert result["feasibility_score"] >= 75.0
    assert result["feasibility_band"] == "HIGH"
    assert result["ml_completion_probability"] >= 0.70

