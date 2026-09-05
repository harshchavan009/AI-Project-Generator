"""
Unit Tests for Pure Novelty & Vector Uniqueness Engine.
Validates cosine similarity nearest-neighbor retrieval, thresholding, and overlap flagging.
"""

import pytest
from backend.services.embedding_engine import embedding_engine

def test_identical_idea_vs_corpus_entry_edge_case():
    """Edge Case: Idea submitted has text identical to an existing corpus entry."""
    # Seed entry from department archive
    entry = embedding_engine.corpus_index[0]

    res = embedding_engine.check_novelty(
        idea_title=entry["title"],
        idea_description=entry["text"],
        top_k=3,
        threshold=0.72
    )

    # Cosine similarity with self must be extremely high (> 85%)
    assert res["max_similarity_percentage"] >= 85.0
    # Overlap must be flagged
    assert res["is_high_overlap"] is True
    assert "High overlap" in res["status"]
    # Novelty score should be depressed (< 30.0)
    assert res["novelty_score"] <= 30.0
    # Nearest match should be the exact entry
    assert len(res["top_matches"]) > 0
    assert res["top_matches"][0]["id"] == entry["id"]

def test_highly_novel_orthogonal_idea():
    """Edge Case: Highly unique, esoteric engineering project unrelated to past department archives."""
    title = "Sub-Surface Acoustic Neuromorphic Swarm Navigation for Glaciers"
    description = "Custom hardware spike-timing acoustic beamforming array estimating sub-ice crevasse topography via neuromorphic silicon."

    res = embedding_engine.check_novelty(
        idea_title=title,
        idea_description=description,
        top_k=3,
        threshold=0.72
    )

    # Should not flag high overlap
    assert res["is_high_overlap"] is False
    assert res["status"] in ["Distinct & novel proposal", "Moderate overlap — acceptable with distinctive methodology"]
    assert 0.0 <= res["novelty_score"] <= 100.0


def test_empty_string_novelty_handling():
    """Edge Case: Empty or blank strings submitted."""
    res = embedding_engine.check_novelty(
        idea_title="",
        idea_description="",
        top_k=3,
        threshold=0.72
    )

    assert "novelty_score" in res
    assert 0.0 <= res["novelty_score"] <= 100.0
    assert isinstance(res["top_matches"], list)
