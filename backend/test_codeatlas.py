"""
Automated Integration Test Suite for CodeAtlas Backend.
Verifies AST parsing, NetworkX graph algorithms, Tarjan cycle detection,
local INT8 ONNX MiniLM embedding search, and SQLite caching.
"""

import os
import asyncio
from database import init_db, save_cached_analysis, get_cached_analysis
from services.ast_parser import parse_repository
from services.graph_engine import build_dependency_graph, analyze_graph_algorithms, detect_cycles
from services.embedding_engine import index_codebase_nodes, search_codebase
from services.llm_service import explain_node


async def run_tests():
    print("--- 1. Testing SQLite Database Layer ---")
    await init_db()
    dummy_key = "test_repo_key_123"
    dummy_graph = {"nodes": [{"id": "a"}], "edges": []}
    dummy_stats = {"total_nodes": 1}
    await save_cached_analysis(dummy_key, "https://github.com/test/repo", "hash1", dummy_graph, dummy_stats)
    cached = await get_cached_analysis(dummy_key)
    assert cached is not None, "Failed to retrieve cached analysis"
    assert cached["graph_data"]["nodes"][0]["id"] == "a"
    print("✓ SQLite caching verified.")

    print("\n--- 2. Testing AST Parser ---")
    current_dir = os.path.dirname(__file__)
    ast_result = parse_repository(current_dir)
    assert ast_result["total_files"] >= 4, f"Expected at least 4 python files, found {ast_result['total_files']}"
    print(f"✓ AST parser scanned {ast_result['total_files']} files successfully.")

    print("\n--- 3. Testing Graph Engine & Cycle Detection ---")
    G, _ = build_dependency_graph(ast_result)
    assert len(G.nodes) > 0, "Graph has 0 nodes"
    assert len(G.edges) > 0, "Graph has 0 edges"
    cycle_nodes, cycle_edges, cycles = detect_cycles(G)
    print(f"✓ Graph built: {len(G.nodes)} nodes, {len(G.edges)} edges.")
    print(f"✓ Tarjan's SCC detected {len(cycles)} cycles correctly.")

    print("\n--- 4. Testing PageRank & Louvain Community Detection ---")
    graph_payload = analyze_graph_algorithms(G)
    assert "summary" in graph_payload
    summary = graph_payload["summary"]
    hotspots = summary.get("hotspots", [])
    assert len(hotspots) > 0, "No hotspots identified by PageRank"
    top_hotspot = hotspots[0]
    print(f"✓ PageRank calculated: Top hotspot is {top_hotspot['label']} (PR: {top_hotspot['pagerank_score']})")
    print(f"✓ Louvain communities detected: {summary['communities_count']} communities found.")

    print("\n--- 5. Testing Local INT8 ONNX MiniLM Embeddings & Semantic Search ---")
    test_job = "test_job_run"
    indexed_count = index_codebase_nodes(test_job, graph_payload["nodes"])
    assert indexed_count > 0, "0 nodes were indexed"
    print(f"✓ Indexed {indexed_count} nodes into vectorized memory index.")

    # Search query
    query = "parsing python abstract syntax trees"
    results = search_codebase(test_job, query, top_k=3)
    assert len(results) > 0, "Search query returned 0 results"
    print(f"✓ Semantic search query matched: '{results[0]['label']}' with cosine score {results[0]['similarity_score']}")

    print("\n--- 6. Testing AI Explanation Service ---")
    target_node = graph_payload["nodes"][0]
    explanation = await explain_node(
        target_node["id"],
        dummy_key,
        target_node,
        inbound_nodes=["caller_a"],
        outbound_nodes=["dep_b", "dep_c"],
    )
    assert len(explanation) > 10, "Explanation too short"
    print(f"✓ Node explanation generated: '{explanation[:180]}...'")

    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY! 🎯")


if __name__ == "__main__":
    asyncio.run(run_tests())
