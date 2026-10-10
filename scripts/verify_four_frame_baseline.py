#!/usr/bin/env python3
"""Check that the user's four approved cinematic frames were not modified.

Frame 05 and later changes must use independent versioned source folders.
The immutable reference branch and exact original Git blob IDs are verified.
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
LOCK=ROOT/"design-system/four-frame-gallery-approved-v1.json"

def git(*args):
    return subprocess.run(["git",*args],cwd=ROOT,text=True,check=True,
                          capture_output=True).stdout.strip()

def main():
    data=json.loads(LOCK.read_text())
    problems=[]
    if data.get("version")!="four-frame-gallery-approved-v1":
        problems.append("Wrong approved four-frame version")
    for path,sha in data["locked_blobs"].items():
        raw=git("ls-tree","-r","--full-tree","HEAD","--",path)
        if not raw:
            problems.append("MISSING "+path);continue
        left,found=raw.split("\t",1)
        actual=left.split()[2]
        if found!=path or actual!=sha:
            problems.append(f"CHANGED {path}: approved {sha}; found {actual}")
    for folder in ("concepts/frame-one-live/","concepts/frame-two-portal/",
                   "concepts/frame-three-journey/","concepts/frame-four-gallery/"):
        current=set(git("ls-tree","-r","--name-only","HEAD","--",folder).splitlines())
        allowed={p for p in data["locked_blobs"] if p.startswith(folder)}
        for path in sorted(current-allowed):
            problems.append("NEW FILE IN APPROVED FRAME: "+path)
    reference=git("ls-remote","origin","refs/heads/"+data["reference_branch"]).split()
    if not reference or reference[0]!=data["reference_commit"]:
        problems.append("APPROVED FOUR-FRAME BRANCH WAS MOVED")
    if problems:
        print("FAIL: changes to approved four-frame design")
        for item in problems:print(" -",item)
        return 1
    print(f"PASS: all {len(data['locked_blobs'])} approved four-frame source assets are unchanged.")
    print("Baseline:",data["reference_branch"],data["reference_commit"])
    return 0

if __name__=="__main__":sys.exit(main())
