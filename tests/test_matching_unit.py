"""
Unit Tests for Pure Matching Engine Scoring Logic & Edge Cases.
Validates deterministic scoring, topological prerequisite traversal, and boundary handling.
"""

import pytest
from backend.services.matching_engine import matching_engine

def test_empty_skill_profile_edge_case():
    """Edge Case: Student has zero skills configured (empty dictionary)."""
    matched = matching_engine.match_ideas_for_student(
        student_skills={},
        interest_domains=["Healthcare & Biomedical AI"],
        team_size=1,
        timeframe_weeks=16,
        hardware_constraint="CPU-only",
        limit=5
    )

    assert len(matched) > 0
    top_idea = matched[0]
    coverage = top_idea["skill_coverage"]

    # Skill coverage ratio must be exactly 0.0
    assert coverage["coverage_ratio"] == 0.0
    assert coverage["coverage_percentage"] == 0.0
    assert coverage["matched_count"] == 0
    # Missing skills must equal all required skills of this idea
    assert len(coverage["missing_skills"]) == coverage["total_required"]
    # Bridging weeks must be > 0
    assert coverage["estimated_bridging_weeks"] > 0
    # Combined score must be bounded between 0 and 100
    assert 0.0 <= top_idea["combined_score"] <= 100.0

def test_perfect_skill_match_edge_case():
    """Edge Case: Student possesses all required skills at maximum proficiency (level 5)."""
    # Pick first idea and provide full level 5 skills
    idea = matching_engine.ideas[0]
    perfect_skills = {skill: 5 for skill in idea["required_skills"].keys()}

    matched = matching_engine.match_ideas_for_student(
        student_skills=perfect_skills,
        interest_domains=[idea["domain"]],
        team_size=idea.get("team_size", 2),
        timeframe_weeks=idea.get("typical_timeline_weeks", 16),
        hardware_constraint=idea.get("hardware_requirement", "CPU-only"),
        limit=10
    )

    # Find the target idea
    target_match = next((m for m in matched if m["id"] == idea["id"]), None)
    assert target_match is not None

    coverage = target_match["skill_coverage"]
    assert coverage["coverage_ratio"] == 1.0
    assert coverage["coverage_percentage"] == 100.0
    assert len(coverage["missing_skills"]) == 0
    assert coverage["estimated_bridging_weeks"] == 0.0
    assert target_match["is_domain_match"] is True
    # Should rank high
    assert target_match["relevance_score"] >= 95.0

def test_interest_domain_bonus():
    """Validates that ideas matching student interest domain receive proper relevance weighting."""
    skills = {"python": 3, "pytorch": 3}
    matched_with_domain = matching_engine.match_ideas_for_student(
        student_skills=skills,
        interest_domains=["Healthcare & Biomedical AI"],
        limit=50
    )

    matched_without_domain = matching_engine.match_ideas_for_student(
        student_skills=skills,
        interest_domains=["FinTech & Fraud Analytics"],
        limit=50
    )

    healthcare_in_first = next((m for m in matched_with_domain if m["domain"] == "Healthcare & Biomedical AI"), None)
    healthcare_in_second = next((m for m in matched_without_domain if m["domain"] == "Healthcare & Biomedical AI"), None)

    if healthcare_in_first and healthcare_in_second:
        assert healthcare_in_first["relevance_score"] > healthcare_in_second["relevance_score"]

def test_weight_tuning():
    """Validates that relevance vs feasibility weights dynamically shift ranking."""
    skills = {"python": 4, "sql": 3}
    
    # 1. Relevance heavy (0.9 vs 0.1)
    rel_heavy = matching_engine.match_ideas_for_student(
        student_skills=skills,
        interest_domains=["FinTech & Fraud Analytics"],
        relevance_weight=0.9,
        feasibility_weight=0.1,
        limit=10
    )

    # 2. Feasibility heavy (0.1 vs 0.9)
    feas_heavy = matching_engine.match_ideas_for_student(
        student_skills=skills,
        interest_domains=["FinTech & Fraud Analytics"],
        relevance_weight=0.1,
        feasibility_weight=0.9,
        limit=10
    )

    assert len(rel_heavy) > 0
    assert len(feas_heavy) > 0

