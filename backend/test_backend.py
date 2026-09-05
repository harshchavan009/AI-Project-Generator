import asyncio
import httpx
from backend.main import app
from backend.schemas import UserProfile, SkillLevel

async def test_full_pipeline():
    print("Testing ProjectPilot API endpoints in-memory...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("✓ Health check OK:", res.json())

        # 2. Check seeded projects
        res = await client.get("/api/projects")
        assert res.status_code == 200
        projects = res.json().get("projects", [])
        assert len(projects) > 0, "No seeded projects found"
        print(f"✓ Seeded projects OK: found {len(projects)} blueprints. First: '{projects[0]['title']}'")

        # 3. Generate ideas
        profile = UserProfile(
            name="Priya Patel",
            branch="Computer Science & Engineering",
            semester="Final Year",
            skills=[
                SkillLevel(name="Python", level="advanced"),
                SkillLevel(name="PyTorch", level="intermediate"),
                SkillLevel(name="React", level="intermediate")
            ],
            interests=["Edge AI", "Computer Vision"],
            timeframe_weeks=12,
            hardware_access="Standard Laptop (CPU only)"
        )
        res = await client.post("/api/ideas/generate", json={"profile": profile.model_dump()})
        assert res.status_code == 200
        ideas = res.json().get("ideas", [])
        assert len(ideas) >= 4, f"Expected at least 4 ideas, got {len(ideas)}"
        print(f"✓ Idea generation OK: produced {len(ideas)} distinct ideas. Top idea: '{ideas[0]['title']}'")

        # 4. Generate blueprint for first idea
        chosen_idea = ideas[0]
        res = await client.post("/api/blueprint/generate", json={
            "idea": chosen_idea,
            "profile": profile.model_dump()
        })
        assert res.status_code == 200
        bp = res.json().get("blueprint")
        assert bp is not None
        assert len(bp["architecture_nodes"]) >= 4
        assert len(bp["milestones"]) >= 3
        print(f"✓ Blueprint generation OK: '{bp['title']}' with {len(bp['architecture_nodes'])} architecture nodes, {len(bp['milestones'])} milestone sprints.")

        # 5. Mentor chat
        res = await client.post("/api/mentor/chat", json={
            "project_id": bp["id"],
            "message": "How should I structure the REST API endpoints in FastAPI for this project?",
            "blueprint": bp
        })
        assert res.status_code == 200
        chat_res = res.json()
        assert "response" in chat_res
        print("✓ Mentor chat OK. Response preview:\n", chat_res["response"][:120] + "...")

        # 6. Skill gap analysis
        res = await client.post("/api/skills/analyze", json={
            "profile": profile.model_dump(),
            "blueprint": bp
        })
        assert res.status_code == 200
        skills_data = res.json().get("analysis")
        assert len(skills_data["dimensions"]) == 6
        print(f"✓ Skill gap analysis OK: readiness={skills_data['overall_readiness_pct']}%, {len(skills_data['dimensions'])} radar dimensions evaluated.")

    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY! 🚀")

if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
