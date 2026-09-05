"""
AI Explanation service for CodeAtlas nodes.
Uses ANTHROPIC_API_KEY if provided to call Claude messages API with extracted structural data only.
Falls back to deterministic structural synthesis if API key is not present.
Caches explanations server-side in SQLite so it is called ONCE per node.
"""

import os
import httpx
from typing import Dict, Any, List
from database import get_cached_explanation, save_cached_explanation


async def explain_node(
    node_id: str,
    repo_key: str,
    node_data: Dict[str, Any],
    inbound_nodes: List[str],
    outbound_nodes: List[str],
) -> str:
    """
    Generates or retrieves cached 2-sentence plain-English summary of a node's architectural role
    using its extracted structural metadata (not raw source code).
    """
    # 1. Check server-side SQLite cache
    cached = await get_cached_explanation(node_id, repo_key)
    if cached:
        return cached

    label = node_data.get("label", node_id)
    ntype = node_data.get("type", "module")
    file_path = node_data.get("file", "")
    sig = node_data.get("signature", "")
    doc = node_data.get("docstring", "")
    in_deg = len(inbound_nodes)
    out_deg = len(outbound_nodes)
    in_cycle = node_data.get("in_cycle", False)

    # 2. Try Anthropic Claude API if key present in environment
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()

    if api_key:
        system_prompt = (
            "You are a principal software architect and static analysis expert. "
            "Write exactly a 2-sentence, technically rigorous plain-English summary of this component's "
            "architectural role in the codebase, based STRICTLY on the structural relationships and metadata provided."
        )

        user_prompt = (
            f"Component: {label} ({ntype})\n"
            f"File: {file_path}\n"
            f"Signature: {sig or 'N/A'}\n"
            f"Docstring: {doc or 'None'}\n"
            f"Inbound dependents ({in_deg}): {', '.join(inbound_nodes[:5]) or 'None'}\n"
            f"Outbound dependencies ({out_deg}): {', '.join(outbound_nodes[:5]) or 'None'}\n"
            f"Part of circular dependency loop: {'Yes' if in_cycle else 'No'}\n\n"
            "Provide exactly 2 sentences explaining its core responsibility and architectural positioning."
        )

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": "claude-3-5-sonnet-20241022",
                        "max_tokens": 150,
                        "temperature": 0.2,
                        "system": system_prompt,
                        "messages": [{"role": "user", "content": user_prompt}],
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    summary = data["content"][0]["text"].strip()
                    await save_cached_explanation(node_id, repo_key, summary)
                    return summary
        except Exception:
            pass  # Gracefully fall back to deterministic synthesis

    # 3. Deterministic high-precision structural synthesis
    cycle_note = " It participates in an active circular dependency cycle requiring architectural decoupling." if in_cycle else ""

    if in_deg > out_deg:
        role = "foundational utility service" if in_deg > 3 else "shared internal component"
        s1 = f"`{label}` functions as a {role} within `{file_path}`, referenced by {in_deg} callers across the codebase."
    elif out_deg > in_deg:
        role = "high-level orchestrator" if out_deg > 3 else "coordinator"
        s1 = f"`{label}` operates as a {role} located in `{file_path}`, dispatching logic across {out_deg} downstream dependencies."
    else:
        role = "mediator component"
        s1 = f"`{label}` operates as a {role} located in `{file_path}`, managing interactions across {out_deg} dependent components."

    if doc:
        # Extract first line of docstring
        first_doc = doc.splitlines()[0].strip().rstrip(".")
        s2 = f"Its documented responsibility is to {first_doc.lower() if not first_doc.lower().startswith('to') else first_doc[3:]}.{cycle_note}"
    elif sig:
        s2 = f"It exposes the interface `{sig}` for callers to execute operations.{cycle_note}"
    else:
        s2 = f"It receives {in_deg} inbound invocations, establishing its role as a key structural touchpoint.{cycle_note}"

    summary = f"{s1} {s2}".strip()
    await save_cached_explanation(node_id, repo_key, summary)
    return summary
