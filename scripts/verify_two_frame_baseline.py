#!/usr/bin/env python3
"""Prevent accidental edits to the user-approved clean cinematic Frames 01–02.

This guard checks the EXACT approved Git blob IDs and the frozen reference ref.
Future frames may be added separately, but the approved shell, film and motion
logic cannot be changed silently.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCK = ROOT / "design-system/two-frame-clean-approved-v1.json"

def git(*args: str) -> str:
    result = subprocess.run(
        ["git", *args], cwd=ROOT, text=True, check=True,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    return result.stdout.strip()

def main() -> int:
    manifest = json.loads(LOCK.read_text(encoding="utf-8"))
    if manifest.get("version") != "two-frame-clean-v1":
        print("FAIL: unknown approved two-frame version.")
        return 1

    errors = []
    expected = manifest["locked_blobs"]
    for path, expected_sha in expected.items():
        entry = git("ls-tree", "-r", "--full-tree", "HEAD", "--", path)
        if not entry:
            errors.append("REMOVED " + path)
            continue
        info, found = entry.split("\t", 1)
        actual_sha = info.split()[2]
        if found != path or actual_sha != expected_sha:
            errors.append(f"CHANGED {path} (approved {expected_sha}, found {actual_sha})")

    # Stop files quietly being added to an approved frame, too.
    for directory in ("concepts/frame-two-portal/", "concepts/frame-one-live/"):
        found_paths = set(
            git("ls-tree", "-r", "--name-only", "HEAD", "--", directory).splitlines()
        )
        expected_paths = {p for p in expected if p.startswith(directory)}
        for path in sorted(found_paths - expected_paths):
            errors.append("ADDED " + path)

    branch = manifest["reference_branch"]
    actual_ref = git("ls-remote", "origin", f"refs/heads/{branch}").split()
    if not actual_ref or actual_ref[0] != manifest["reference_commit"]:
        errors.append(
            f"APPROVED SNAPSHOT MOVED: {branch} "
            f"(expected {manifest['reference_commit']})"
        )

    if errors:
        print("FAIL: approved two-frame design must remain unchanged.")
        for error in errors:
            print(" -", error)
        print("Create a new version for owner approval rather than editing V1.")
        return 1

    print("PASS: approved clean Frames 01–02 match their frozen Git snapshot.")
    print(f"Baseline: {branch} @ {manifest['reference_commit']}")
    print(f"Checked {len(expected)} source and media blobs.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
