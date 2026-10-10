#!/usr/bin/env python3
"""Protect the user-approved first-frame Git tree against accidental edits.

The baseline is a dedicated reference branch and a locked Git-blob manifest.
No runtime website behavior is altered by this script.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
MANIFEST = REPO / "design-system/frame-one-approved-v1.json"

def git(*args: str) -> str:
    result = subprocess.run(
        ["git", *args], cwd=REPO, text=True, check=True,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    return result.stdout.strip()

def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if manifest.get("version") != "frame-one-live-v1":
        print("ERROR: approved baseline identifier changed.")
        return 1

    issues = []
    expected = manifest["locked_blobs"]
    for path, sha in expected.items():
        out = git("ls-tree", "-r", "--full-tree", "HEAD", "--", path)
        if not out:
            issues.append(f"MISSING  {path}")
            continue
        try:
            left, found_path = out.split("\t", 1)
            found = left.split()[2]
        except (IndexError, ValueError):
            issues.append(f"INVALID git tree entry: {path}")
            continue
        if found_path != path or found != sha:
            issues.append(f"CHANGED  {path} — approved {sha}; current {found}")

    approved_folder = "concepts/frame-one-live/"
    found_paths = set(
        git("ls-tree", "-r", "--name-only", "HEAD", "--", approved_folder).splitlines()
    )
    expected_paths = {path for path in expected if path.startswith(approved_folder)}
    for path in sorted(found_paths - expected_paths):
        issues.append(f"ADDED     {path} — Frame 01 is frozen; use a new version.")

    # The reference branch must still point to the originally approved commit.
    reference = manifest["reference_branch"]
    ref_info = git("ls-remote", "origin", f"refs/heads/{reference}").split()
    if not ref_info or ref_info[0] != manifest["reference_commit"]:
        issues.append(
            f"BASELINE MOVED: {reference}. Expected {manifest['reference_commit']}."
        )

    if issues:
        print("FRAME 01 BASELINE CHECK FAILED:")
        for issue in issues:
            print(" -", issue)
        print("Create a new explicitly approved version rather than overwriting V1.")
        return 1

    print("PASS: Frame 01 matches the user-approved version.")
    print(f"Reference: {reference} @ {manifest['reference_commit']}")
    print(f"Locked source/media blobs: {len(expected)}")
    print("New frames may be built separately without modifying Frame 01.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
