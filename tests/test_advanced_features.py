"""
Comprehensive Integration Tests for CapstoneForge Advanced Features:
1. Idea Originality Transformer (/originality/transform)
2. Free-Text Idea Feasibility Checker (/feasibility/check-freetext)
3. Project Evolution Complexity Ladder (/evolution/ladder)
4. Task Board (Kanban) and GitHub Drift Integration (/tasks, /api/github/drift)
5. Mentor Confidence & Hallucination Guardrails (/mentor/chat)
6. Research Dataset Finder (/datasets/find)
"""

import pytest
import json
from fastapi.testclient import TestClient
from backend.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

# -------------------------------------------------------------
# 1. Feature 1: Idea Originality Transformer
# -------------------------------------------------------------
def test_originality_transformer_measured_improvement(client):
    res = client.post("/originality/transform", json={
        "idea_text": "Hospital management system for patient records, billing, and appointments",
        "domain": "healthcare",
        "threshold": 65.0
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "Healthcare" in data["detected_domain"] or "Enterprise" in data["detected_domain"]
    assert len(data["enhancement_patterns_applied"]) >= 2
    # Verify both original and projected novelty scores are real numbers
    assert isinstance(data["original_novelty_score"], (int, float))
    assert isinstance(data["projected_novelty_score"], (int, float))
    assert data["projected_novelty_score"] > data["original_novelty_score"]
    assert data["improvement_delta"] > 0
    assert len(data["upgraded_title"]) > 10
    assert len(data["upgraded_description"]) > 20

# -------------------------------------------------------------
# 2. Feature 2: Free-Text Idea Feasibility Checker
# -------------------------------------------------------------
def test_freetext_feasibility_infeasible_problem_flagged(client):
    # Infeasible PhD-level problem: long-horizon earthquake prediction
    res = client.post("/feasibility/check-freetext", json={
        "idea_text": "Predicting earthquake magnitude 30 days in advance using seismic sensors",
        "team_size": 2,
        "timeframe_weeks": 16,
        "hardware_constraint": "CPU-only"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["feasibility_verdict"] == "Low"
    assert data["feasibility_score"] <= 40.0
    assert len(data["structural_flags"]) >= 1
    # Check that alternative is provided and grounded in the same domain
    assert data["scoped_down_alternative"] is not None
    assert "Seismic" in data["scoped_down_alternative"]["title"] or "Sensor" in data["scoped_down_alternative"]["title"]

def test_freetext_feasibility_feasible_project(client):
    # Feasible undergraduate project
    res = client.post("/feasibility/check-freetext", json={
        "idea_text": "Real-time network traffic telemetry monitor with FastAPI and Prometheus dashboards",
        "team_size": 2,
        "timeframe_weeks": 16,
        "hardware_constraint": "CPU-only"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["feasibility_verdict"] in ["High", "Moderate"]
    assert data["feasibility_score"] >= 60.0

# -------------------------------------------------------------
# 3. Feature 3: Project Evolution Complexity Ladder
# -------------------------------------------------------------
def test_evolution_ladder_5_levels(client):
    res = client.post("/evolution/ladder", json={
        "idea_text": "Network intrusion detection system using machine learning classification",
        "domain": "cybersecurity"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert len(data["ladder"]) == 5
    # Verify levels 1 through 5 progression
    levels = data["ladder"]
    for i in range(5):
        assert levels[i]["level"] == i + 1
        assert len(levels[i]["added_capabilities"]) > 0
        assert len(levels[i]["added_tech_stack"]) > 0
        assert levels[i]["estimated_weeks"] > 0
    # Level 5 has greater work than Level 1
    assert levels[4]["estimated_weeks"] > levels[0]["estimated_weeks"]

# -------------------------------------------------------------
# 4. Feature 4: Task Board (Kanban) and Drift Integration
# -------------------------------------------------------------
def test_task_board_crud_and_drift_integration(client):
    test_project_id = "proj-unit-test-taskboard"
    
    # 1. Create 5 tasks (4 Completed, 1 In Progress -> 80% completion)
    for i in range(4):
        c_res = client.post(f"/tasks/{test_project_id}", json={
            "title": f"Sprint Deliverable {i+1}",
            "status": "Completed",
            "linked_week": i + 1,
            "is_stretch": False
        })
        assert c_res.status_code == 200

    ip_res = client.post(f"/tasks/{test_project_id}", json={
        "title": "Final Integration & Viva Preparation",
        "status": "In Progress",
        "linked_week": 5,
        "is_stretch": True
    })
    assert ip_res.status_code == 200

    # 2. Get task board
    board_res = client.get(f"/tasks/{test_project_id}")
    assert board_res.status_code == 200
    board_data = board_res.json()
    assert board_data["completed_tasks"] >= 4
    assert board_data["completion_percentage"] >= 80.0

    # 3. Verify task completion feeds directly into GitHub drift indicator
    # Week 3 out of 16 means ~18.8% expected, but actual is 80% -> must show "Ahead of Schedule"
    drift_res = client.get(f"/api/github/drift?project_id={test_project_id}&current_week=3&total_weeks=16")
    assert drift_res.status_code == 200
    drift_data = drift_res.json()["drift_analysis"]
    assert drift_data["actual_progress_percentage"] >= 80.0
    assert drift_data["drift_status"] == "Ahead of Schedule"

# -------------------------------------------------------------
# 5. Feature 5: Mentor Confidence & Hallucination Guardrail
# -------------------------------------------------------------
def test_mentor_grounded_vs_refusal_guardrail(client):
    # Test grounded technical question
    res_grounded = client.post("/mentor/chat", json={
        "project_id": "proj-unit-test",
        "project_title": "Edge Vision Pathology Classifier",
        "project_domain": "healthcare",
        "message": "How do I optimize INT8 tensor quantization for edge deployment on ARM Cortex?",
        "skill_gaps": ["onnx_runtime"],
        "citations": []
    })
    assert res_grounded.status_code == 200
    events_grounded = []
    for line in res_grounded.text.split("\n"):
        if line.startswith("data: "):
            events_grounded.append(json.loads(line[6:]))
    
    assert len(events_grounded) > 0
    final_grounded = events_grounded[-1]
    assert final_grounded.get("is_grounded") is True
    assert final_grounded.get("confidence_score") >= 50.0

    # Test deliberately off-topic / ungrounded question (Hallucination rejection)
    res_unrelated = client.post("/mentor/chat", json={
        "project_id": "proj-unit-test",
        "project_title": "Edge Vision Pathology Classifier",
        "project_domain": "healthcare",
        "message": "What is the traditional recipe for baking French sourdough bread?",
        "skill_gaps": [],
        "citations": []
    })
    assert res_unrelated.status_code == 200
    events_unrelated = []
    for line in res_unrelated.text.split("\n"):
        if line.startswith("data: "):
            events_unrelated.append(json.loads(line[6:]))
    
    assert len(events_unrelated) > 0
    final_unrelated = events_unrelated[-1]
    # Guardrail must flag ungrounded and decline
    assert final_unrelated.get("is_grounded") is False
    assert final_unrelated.get("confidence_score") < 45.0
    # Mentor explicitly declines to hallucinate
    first_token = events_unrelated[0].get("token", "")
    assert "Low Grounding Confidence" in first_token or "decline" in first_token.lower()

# -------------------------------------------------------------
# 6. Feature 6: Curated Research Dataset Finder
# -------------------------------------------------------------
def test_dataset_finder_matched_and_absence(client):
    # Case A: Matched dataset (NIH Chest X-ray 14)
    res_match = client.post("/datasets/find", json={
        "idea_text": "Automated classification of pneumonia in chest radiographs",
        "domain": "healthcare"
    })
    assert res_match.status_code == 200
    data_match = res_match.json()
    assert data_match["match_found"] is True
    assert len(data_match["matched_datasets"]) >= 1
    ds = data_match["matched_datasets"][0]
    assert "Chest" in ds["name"] or "X-ray" in ds["name"] or "NIH" in ds["name"]
    assert len(ds["columns_fields"]) > 0
    assert len(ds["url"]) > 0

    # Case B: Deliberately unmatched dataset (Absence of match is the correct answer)
    res_nomatch = client.post("/datasets/find", json={
        "idea_text": "Gourmet recipe recommendations for French pastry baking",
        "domain": "cooking"
    })
    assert res_nomatch.status_code == 200
    data_nomatch = res_nomatch.json()
    assert data_nomatch["match_found"] is False
    assert len(data_nomatch["matched_datasets"]) == 0
    assert "No curated public research dataset found" in data_nomatch["message"]
