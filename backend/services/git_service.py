"""
Git Service: Safely acquires a public GitHub repository or local directory,
enforcing a depth=1 clone, 200MB size limit, and 60-second execution timeout.
Cleans up temporary directories upon exit.
"""

import os
import shutil
import tempfile
import hashlib
import asyncio
import subprocess
from typing import AsyncGenerator, Tuple
from contextlib import asynccontextmanager

MAX_CLONE_TIMEOUT_SECONDS = 60
MAX_REPO_SIZE_MB = 200
MAX_REPO_SIZE_BYTES = MAX_REPO_SIZE_MB * 1024 * 1024


def compute_repo_key(url_or_path: str, commit_hash: str = "") -> str:
    """Deterministic hash identifier for SQLite caching."""
    clean = url_or_path.strip().lower().rstrip("/")
    content = f"{clean}::{commit_hash}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()[:16]


def get_dir_size_bytes(directory: str) -> int:
    """Calculate total disk space utilized by a directory."""
    total = 0
    for dirpath, _, filenames in os.walk(directory):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            try:
                if not os.path.islink(fp):
                    total += os.path.getsize(fp)
            except (OSError, FileNotFoundError):
                continue
    return total


@asynccontextmanager
async def acquire_repository(url_or_path: str) -> AsyncGenerator[Tuple[str, str, bool], None]:
    """
    Context manager yielding (local_path, repo_key, is_temp).
    If url_or_path is already a local directory, uses it directly.
    Otherwise clones shallow (depth=1) into a temporary directory with size and timeout guards.
    """
    url_or_path = url_or_path.strip()

    # Case 1: Local directory path
    if os.path.isdir(url_or_path):
        key = compute_repo_key(os.path.abspath(url_or_path), "local")
        yield (os.path.abspath(url_or_path), key, False)
        return

    # Case 2: Shorthand owner/repo -> https://github.com/owner/repo
    if not url_or_path.startswith("http://") and not url_or_path.startswith("https://"):
        if "/" in url_or_path and not os.path.exists(url_or_path):
            url_or_path = f"https://github.com/{url_or_path}.git"

    # Normalize github URL
    if url_or_path.endswith(".git"):
        clone_url = url_or_path
    else:
        clone_url = f"{url_or_path}.git"

    temp_dir = tempfile.mkdtemp(prefix="codeatlas_clone_")
    try:
        # Clone depth=1 with 60s timeout
        cmd = [
            "git", "clone",
            "--depth", "1",
            "--single-branch",
            "--quiet",
            clone_url,
            temp_dir
        ]

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        try:
            _, stderr = await asyncio.wait_for(proc.communicate(), timeout=MAX_CLONE_TIMEOUT_SECONDS)
        except asyncio.TimeoutError:
            proc.kill()
            raise TimeoutError(f"Git clone exceeded timeout of {MAX_CLONE_TIMEOUT_SECONDS}s")

        if proc.returncode != 0:
            err_msg = stderr.decode("utf-8", errors="replace")
            raise RuntimeError(f"Git clone failed (exit code {proc.returncode}): {err_msg}")

        # Check repository size limit
        actual_size = get_dir_size_bytes(temp_dir)
        if actual_size > MAX_REPO_SIZE_BYTES:
            raise ValueError(f"Repository size ({actual_size / (1024*1024):.1f}MB) exceeds 200MB limit.")

        # Extract head commit hash for deterministic caching
        commit_proc = await asyncio.create_subprocess_exec(
            "git", "-C", temp_dir, "rev-parse", "HEAD",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, _ = await commit_proc.communicate()
        commit_hash = stdout.decode("utf-8").strip() if commit_proc.returncode == 0 else ""

        repo_key = compute_repo_key(url_or_path, commit_hash)

        yield (temp_dir, repo_key, True)

    finally:
        # Guarantee cleanup of temporary directory
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
