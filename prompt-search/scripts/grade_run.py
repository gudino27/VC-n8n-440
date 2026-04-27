"""
Grade a run produced by run_tests.py and emit pass/partial/fail verdicts.

Logic mirrors the original analysis.json:

- prerequisite_validation, schedule_feasibility (when routed can_take):
    deterministic compare of checker.can_take vs Yes/No in expected_answer.
- prerequisite_chain_discovery:
    count how many courses named in expected_answer appear in actual_answer.
    full match = pass, partial = some, none = fail.
- credit_calculations:
    extract numbers from expected & actual; pass if all expected nums present.
- ucore_planning, degree_progress (freeform/graduation_check):
    keyword overlap heuristic — at least 60% of distinct course codes /
    important tokens from expected appear in actual.
- anything else: heuristic above.
"""
import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

CODE_RE = re.compile(r"\b([A-Z]{2,8}\s*\d{3,4})\b")
NUM_RE  = re.compile(r"\b(\d{1,3})\b")
YESNO_RE = re.compile(r"^\s*(yes|no|cannot|can not|you can|you cannot|eligible|not eligible)", re.I)

def norm_code(c):
    return re.sub(r"\s+", " ", c.upper()).strip().replace("CPTS", "CPT S")

def expected_yes(text):
    t = text.strip().lower()
    if t.startswith("yes"): return True
    if t.startswith("no"):  return False
    if "cannot" in t.split(".")[0] or "not eligible" in t.split(".")[0]:
        return False
    if "can take" in t.split(".")[0] or "eligible" in t.split(".")[0]:
        return True
    return None

def actual_yes(case):
    # use the deterministic checker result if present
    checks = case.get("checks") or []
    if checks:
        # all_can: every target course passes
        return all(c.get("can_take") for c in checks if c.get("found"))
    # otherwise sniff the answer prose
    ans = (case.get("actual_answer") or "").strip().lower()
    m = YESNO_RE.match(ans)
    if not m: return None
    tok = m.group(1).lower()
    return tok in ("yes", "you can", "eligible")

def grade_can_take(case):
    exp = expected_yes(case["expected_answer"])
    act = actual_yes(case)
    if exp is None or act is None:
        return ("partial", "expected/actual yes-no not parseable")
    if exp == act:
        return ("pass", f"deterministic {act}=={exp}")
    return ("fail", f"deterministic {act} vs expected {exp}")

def grade_chain(case):
    exp_codes = {norm_code(c) for c in CODE_RE.findall(case["expected_answer"])}
    act_codes = {norm_code(c) for c in CODE_RE.findall(case.get("actual_answer", ""))}
    if not exp_codes:
        return ("partial", "no codes in expected")
    hit = exp_codes & act_codes
    ratio = len(hit) / len(exp_codes)
    if ratio >= 0.999:
        return ("pass", f"{len(hit)}/{len(exp_codes)} courses named")
    if ratio >= 0.5:
        return ("partial", f"{len(hit)}/{len(exp_codes)} courses named")
    return ("fail", f"{len(hit)}/{len(exp_codes)} courses; missing {sorted(exp_codes - act_codes)[:3]}")

def grade_credits(case):
    exp = case["expected_answer"]
    act = case.get("actual_answer", "")
    exp_nums = set(NUM_RE.findall(exp))
    act_nums = set(NUM_RE.findall(act))
    if not exp_nums:
        return ("partial", "no numbers in expected")
    hit = exp_nums & act_nums
    ratio = len(hit) / len(exp_nums)
    if ratio >= 0.999:
        return ("pass", f"{len(hit)} numbers match")
    if ratio >= 0.5:
        return ("partial", f"{len(hit)}/{len(exp_nums)} numbers match")
    return ("fail", f"{len(hit)}/{len(exp_nums)} numbers match")

def grade_freeform(case):
    exp = case["expected_answer"]
    act = case.get("actual_answer", "")
    exp_codes = {norm_code(c) for c in CODE_RE.findall(exp)}
    act_codes = {norm_code(c) for c in CODE_RE.findall(act)}
    if exp_codes:
        hit = exp_codes & act_codes
        ratio = len(hit) / len(exp_codes)
        if ratio >= 0.999:
            return ("pass", f"{len(hit)}/{len(exp_codes)} codes named")
        if ratio >= 0.5:
            return ("partial", f"{len(hit)}/{len(exp_codes)} codes named")
        return ("fail", f"{len(hit)}/{len(exp_codes)} codes; missing {sorted(exp_codes-act_codes)[:3]}")
    # fallback: token overlap on capitalized phrases / numbers
    exp_nums = set(NUM_RE.findall(exp))
    act_nums = set(NUM_RE.findall(act))
    if exp_nums:
        hit = exp_nums & act_nums
        ratio = len(hit) / len(exp_nums)
        if ratio >= 0.999: return ("pass", f"{len(hit)} numbers match")
        if ratio >= 0.5:   return ("partial", f"{len(hit)}/{len(exp_nums)} numbers match")
        return ("fail", f"{len(hit)}/{len(exp_nums)} numbers match")
    return ("partial", "no codes or numbers in expected — manual review")

GRADERS = {
    "prerequisite_validation":      grade_can_take,
    "schedule_feasibility":         grade_can_take,
    "prerequisite_chain_discovery": grade_chain,
    "credit_calculations":          grade_credits,
    "ucore_planning":               grade_freeform,
    "degree_progress":              grade_freeform,
}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input", help="path to run_*.json from run_tests.py")
    ap.add_argument("--out", default=None, help="output analysis path")
    args = ap.parse_args()

    data = json.load(open(args.input))
    results = data["results"]

    by_cat = defaultdict(Counter)
    overall = Counter()
    details = []

    for r in results:
        if "error" in r:
            verdict = "fail"
            reason  = f"runtime error: {r['error'][:60]}"
        else:
            cat = r["category"]
            grader = GRADERS.get(cat, grade_freeform)
            # schedule_feasibility may route to free-form if no proposed courses
            if cat == "schedule_feasibility" and not r.get("checks"):
                verdict, reason = grade_freeform(r)
            else:
                verdict, reason = grader(r)
        by_cat[r["category"]][verdict] += 1
        overall[verdict] += 1
        details.append({
            "id": r["id"], "cat": r["category"],
            "verdict": verdict, "reason": reason,
            "q": r["question"], "exp": r["expected_answer"][:140],
        })

    out = {
        "overall": dict(overall),
        "by_category": {k: dict(v) for k, v in by_cat.items()},
        "details": details,
        "input": args.input,
    }
    out_path = args.out or str(Path(args.input).with_suffix("")) + "_analysis.json"
    Path(out_path).write_text(json.dumps(out, indent=2))

    total = sum(overall.values())
    print(f"\nGraded {total} cases")
    print(f"  pass    {overall['pass']:3d}")
    print(f"  partial {overall['partial']:3d}")
    print(f"  fail    {overall['fail']:3d}")
    print(f"  pass+partial = {overall['pass']+overall['partial']} / {total}")
    print(f"\nBy category:")
    for cat in sorted(by_cat):
        c = by_cat[cat]
        n = sum(c.values())
        print(f"  {cat:32s} {c['pass']:2d} pass · {c['partial']:2d} partial · {c['fail']:2d} fail  (of {n})")
    print(f"\nWrote {out_path}")

if __name__ == "__main__":
    main()
