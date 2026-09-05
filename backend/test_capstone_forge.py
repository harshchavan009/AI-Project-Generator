import asyncio
from httpx import AsyncClient, ASGITransport
from backend.main import app

async def run_tests():
    print("===========================================================")
    print("Running Comprehensive CapstoneForge Test Suite")
    print("===========================================================")

    from backend.database import init_db
    await init_db()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        health_data = res.json()
        print(f"✓ Health Check OK: {health_data['service']} (Embedding: {health_data['embedding_model']})")

        # 2. Taxonomy endpoint
        res = await client.get("/api/taxonomy")
        assert res.status_code == 200, f"Taxonomy failed: {res.text}"
        tax = res.json()
        assert len(tax.get("categories", [])) == 7, "Taxonomy should have 7 categories"
        total_skills = sum(len(c.get("skills", [])) for c in tax["categories"])
        print(f"✓ Skill Taxonomy OK: {len(tax['categories'])} categories, {total_skills} named skills.")

        # 3. Student Profile save
        sample_profile = {
            "id": "std-test-01",
            "name": "Dev Test Student",
            "branch": "Computer Science & Engineering",
            "team_size": 2,
            "timeframe_weeks": 16,
            "hardware_constraint": "CPU-only",
            "interest_domains": ["Healthcare & Biomedical AI", "Edge AI & TinyML / IoT"],
            "skills": {
                "python": 4,
                "pytorch": 3,
                "onnx_runtime": 2,
                "fastapi": 3,
                "sql": 3
            }
        }
        res = await client.post("/api/profile", json=sample_profile)
        assert res.status_code == 200, f"Profile save failed: {res.text}"
        print(f"✓ Student Profile Save OK: {res.json()['profile']['name']}")

        # 4. Skill-to-Idea Matching Engine (GET /match?student_id=...)
        res = await client.get("/match?student_id=std-test-01&limit=5")
        assert res.status_code == 200, f"Matching failed: {res.text}"
        matches = res.json()
        assert len(matches["ideas"]) > 0, "Should return matched ideas"
        top_idea = matches["ideas"][0]
        print(f"✓ Matching Engine OK: Top idea '{top_idea['title']}' (Combined Score: {top_idea['combined_score']})")
        print(f"   - Relevance: {top_idea['relevance_score']} | Skill Coverage: {top_idea['skill_coverage']['coverage_percentage']}%")
        print(f"   - Feasibility: {top_idea['feasibility']['feasibility_score']} | Novelty: {top_idea['novelty']['novelty_score']}")
        print(f"   - Hireability: {top_idea['hireability']['hireability_score']} ({top_idea['hireability']['top_market_driver']})")
        print(f"   - Topological Gap Weeks: {top_idea['skill_coverage']['estimated_bridging_weeks']} wks")

        # 5. Novelty / Uniqueness Checker
        novelty_payload = {
            "title": "EdgeMed: Real-Time Chest Radiograph Triage with INT8 Quantization",
            "description": "Hospital triage pipeline classifying thoracic pathologies from DICOM images on CPU using INT8 ONNX models with Grad-CAM overlays.",
            "top_k": 3,
            "threshold": 0.72
        }
        res = await client.post("/novelty-check", json=novelty_payload)
        assert res.status_code == 200, f"Novelty check failed: {res.text}"
        nov_res = res.json()["result"]
        print(f"✓ Novelty Checker OK: Score = {nov_res['novelty_score']}/100, Closest Match = '{nov_res['top_matches'][0]['title']}' ({nov_res['top_matches'][0]['similarity_percentage']}%)")

        # 6. RAG Grounded Proposal Generation
        ground_payload = {
            "idea": top_idea,
            "profile": sample_profile
        }
        res = await client.post("/api/ideas/ground", json=ground_payload)
        assert res.status_code == 200, f"RAG Grounding failed: {res.text}"
        proposal = res.json()["proposal"]
        print(f"✓ RAG Grounding OK: Cites {len(proposal['citations'])} sources. First citation: '{proposal['citations'][0]['title']}' ({proposal['citations'][0]['year']})")

        # 7. Static Code Analysis for Targeted Viva Questions (AST)
        sample_code = """
import asyncio
from fastapi import FastAPI
import onnxruntime as ort
import numpy as np

app = FastAPI()

class InferencePipeline:
    def __init__(self, model_path: str):
        self.session = ort.InferenceSession(model_path)

    async def predict(self, tensor_data: list):
        try:
            arr = np.array(tensor_data, dtype=np.float32)
            inputs = {self.session.get_inputs()[0].name: arr}
            return self.session.run(None, inputs)
        except Exception as e:
            return {"error": str(e)}
"""
        res = await client.post("/mentor/viva-questions", json={"source_code": sample_code})
        assert res.status_code == 200, f"AST Viva failed: {res.text}"
        viva_data = res.json()["analysis"]
        assert viva_data["valid"] is True
        print(f"✓ AST Static Analysis OK: Detected {len(viva_data['stats']['detected_modules'])} modules, generated {len(viva_data['viva_questions'])} targeted viva questions.")
        print(f"   Sample question category: '{viva_data['viva_questions'][0]['category']}'")

        # 8. GitHub Commit Drift Tracker
        res = await client.get("/api/github/drift?repo=sample-student/capstone-repo&current_week=8&total_weeks=16")
        assert res.status_code == 200, f"GitHub drift failed: {res.text}"
        drift_data = res.json()["drift_analysis"]
        print(f"✓ GitHub Drift Tracker OK: Status = '{drift_data['drift_status']}' (Delta = {drift_data['drift_delta_days']} days)")

        # 9. Faculty Cohort Students Table
        res = await client.get("/cohort/students?cohort_id=cohort-cse-2026-a")
        assert res.status_code == 200, f"Cohort fetch failed: {res.text}"
        cohort_students = res.json()["students"]
        assert len(cohort_students) >= 5, "Should have seeded cohort students"
        print(f"✓ Faculty Cohort Table OK: {len(cohort_students)} enrolled students retrieved.")

        # 10. Faculty Duplicate Idea Clustering (GET /cohort/duplicates)
        res = await client.get("/cohort/duplicates?cohort_id=cohort-cse-2026-a&similarity_threshold=0.65")
        assert res.status_code == 200, f"Duplicates cluster failed: {res.text}"
        dup_data = res.json()
        print(f"✓ Duplicate Idea Clustering OK: Flagged {dup_data['duplicate_clusters_count']} overlapping clusters in cohort.")
        if dup_data['duplicate_clusters']:
            cluster = dup_data['duplicate_clusters'][0]
            student_names = [s['student_name'] for s in cluster['students']]
            print(f"   Overlapping Cluster: {student_names} (Avg Similarity: {cluster['average_similarity_percentage']}%)")

        # 11. Faculty Difficulty Distribution Histogram (GET /cohort/difficulty-distribution)
        res = await client.get("/cohort/difficulty-distribution?cohort_id=cohort-cse-2026-a")
        assert res.status_code == 200, f"Difficulty distribution failed: {res.text}"
        dist_data = res.json()
        print(f"✓ Difficulty Distribution OK: Feasibility Mean = {dist_data['feasibility_mean']}, Novelty Mean = {dist_data['novelty_mean']}")
        print(f"   Assessment: '{dist_data['batch_skew_assessment']}'")

        print("===========================================================")
        print("ALL 11 BACKEND TESTS PASSED WITH 100% SUCCESS! 🚀")
        print("===========================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
