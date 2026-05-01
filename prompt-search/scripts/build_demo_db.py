"""
Build a minimal demo courses.db for Colab / offline use.

Tables created:
  catalog_courses     — parsed from metadata.json (6 400+ courses)
  catalog_degrees     — CS BS (120 cr, 2024-25 catalog)
  degree_requirements — standard 4-year CS BS plan
  courses             — Fall 2025 sections for core CPTS / MATH courses

Run from prompt-search/:
    python scripts/build_demo_db.py
"""

import json
import os
import re
import sqlite3
from pathlib import Path

_HERE = Path(__file__).parent
_ROOT = _HERE.parent
_META = _ROOT / "data" / "domain" / "metadata.json"
_OUT  = _ROOT / "data" / "domain" / "courses.db"


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

def _parse_chunk(txt: str):
    """Return (ucore, title, credits_int_or_None) from a chunk_text string."""
    txt = re.sub(r"^\d+\w?\s+", "", txt)        # strip leading course number
    ucore = None
    m = re.match(r"^\[([A-Z/]+)\]\s+", txt)
    if m:
        ucore = m.group(1)
        txt = txt[m.end():]
    m2 = re.search(
        r"\s+(V|\d+(?:\.\d+)?)\s+(?:\(\d.*?\)\s+)?(?:Course Prerequisite|[A-Z])",
        txt,
    )
    credits = None
    title = txt.strip()
    if m2:
        raw = m2.group(1)
        title = txt[: m2.start()].strip()
        try:
            credits = int(float(raw))
        except ValueError:
            pass
    description = re.sub(r".*?Course Prerequisite:.*?\.", "", txt, count=1).strip()
    return ucore, title, credits, description


# ---------------------------------------------------------------------------
# Degree plan data
# ---------------------------------------------------------------------------

# (year, term, label, hours)  — term 1 = Fall, term 2 = Spring
_CS_BS_PLAN = [
    # Year 1
    (1, 1, "CPTS 121",   4),
    (1, 1, "MATH 171",   4),
    (1, 1, "ENGL 101",   3),
    (1, 1, "UCORE WRTG", 3),
    (1, 2, "CPTS 122",   4),
    (1, 2, "MATH 172",   4),
    (1, 2, "ENGL 201",   3),
    (1, 2, "UCORE GEN",  3),
    # Year 2
    (2, 1, "CPTS 223",   3),
    (2, 1, "CPTS 260",   3),
    (2, 1, "MATH 216",   3),
    (2, 1, "PHYSICS 201",4),
    (2, 1, "UCORE BSCI", 3),
    (2, 2, "CPTS 317",   3),
    (2, 2, "CPTS 322",   3),
    (2, 2, "STAT 360",   3),
    (2, 2, "PHYSICS 202",4),
    (2, 2, "UCORE QUAN", 3),
    # Year 3
    (3, 1, "CPTS 355",   3),
    (3, 1, "CPTS 360",   3),
    (3, 1, "Tech Elective I",  3),
    (3, 1, "UCORE HUM",  3),
    (3, 2, "CPTS 451",   3),
    (3, 2, "CPTS 350",   3),
    (3, 2, "Tech Elective II", 3),
    (3, 2, "UCORE SSCI", 3),
    # Year 4
    (4, 1, "CPTS 440",   3),
    (4, 1, "Tech Elective III",3),
    (4, 1, "Tech Elective IV", 3),
    (4, 1, "UCORE ARTS", 3),
    (4, 2, "CPTS 483",   3),
    (4, 2, "Tech Elective V",  3),
    (4, 2, "UCORE DIVR", 3),
    (4, 2, "UCORE CAPS", 3),
]


# ---------------------------------------------------------------------------
# Fall 2025 section data
# (prefix, number, section, dayTime, instructor, seats_avail, max, status, mode, isLab)
# ---------------------------------------------------------------------------

_SECTIONS = [
    # CPTS core
    ("CPT S", "121",  "01", "MWF 8:10-9:00",    "Holder, B.",      12, 30, "open",   "Face to Face", 0),
    ("CPT S", "121",  "02", "MWF 9:10-10:00",   "Holder, B.",       8, 30, "open",   "Face to Face", 0),
    ("CPT S", "121",  "L01","T 10:10-11:00",     "TA",               5, 20, "open",   "Face to Face", 1),
    ("CPT S", "122",  "01", "MWF 9:10-10:00",   "Baird, J.",        6, 30, "open",   "Face to Face", 0),
    ("CPT S", "122",  "L01","T 8:10-9:00",       "TA",               3, 20, "open",   "Face to Face", 1),
    ("CPT S", "223",  "01", "MWF 10:10-11:00",  "Kalyanaraman, A.", 4, 35, "open",   "Face to Face", 0),
    ("CPT S", "260",  "01", "TTh 8:05-9:20",    "Gu, J.",           7, 30, "open",   "Face to Face", 0),
    ("CPT S", "317",  "01", "MWF 11:10-12:00",  "Kim, H.",          3, 30, "open",   "Face to Face", 0),
    ("CPT S", "322",  "01", "TTh 9:35-10:50",   "Weisshaar, E.",    5, 30, "open",   "Face to Face", 0),
    ("CPT S", "350",  "01", "MWF 12:10-1:00",   "Ogle, D.",         9, 30, "open",   "Face to Face", 0),
    ("CPT S", "355",  "01", "TTh 10:35-11:50",  "Kim, H.",          2, 30, "open",   "Face to Face", 0),
    ("CPT S", "360",  "01", "MWF 1:10-2:00",    "Buell, C.",       11, 35, "open",   "Face to Face", 0),
    ("CPT S", "421",  "01", "TTh 1:25-2:40",    "Gu, J.",           6, 25, "open",   "Face to Face", 0),
    ("CPT S", "440",  "01", "TTh 2:55-4:10",    "Staff",            14, 30, "open",   "Face to Face", 0),
    ("CPT S", "451",  "01", "MWF 2:10-3:00",    "Kalyanaraman, A.", 3, 30, "open",   "Face to Face", 0),
    ("CPT S", "483",  "01", "TTh 10:35-11:50",  "Staff",            8, 25, "open",   "Face to Face", 0),
    # MATH
    ("MATH",  "171",  "01", "MWF 8:10-9:00",    "Staff",            5, 35, "open",   "Face to Face", 0),
    ("MATH",  "172",  "01", "MWF 9:10-10:00",   "Staff",            7, 35, "open",   "Face to Face", 0),
    ("MATH",  "216",  "01", "MWF 10:10-11:00",  "Staff",            4, 35, "open",   "Face to Face", 0),
    ("MATH",  "220",  "01", "TTh 8:05-9:20",    "Staff",            6, 35, "open",   "Face to Face", 0),
    # STAT
    ("STAT",  "360",  "01", "MWF 11:10-12:00",  "Staff",           10, 35, "open",   "Face to Face", 0),
    # PHYSICS
    ("PHYSICS","201", "01", "MWF 8:10-9:00",    "Staff",            3, 35, "open",   "Face to Face", 0),
    ("PHYSICS","202", "01", "MWF 9:10-10:00",   "Staff",            5, 35, "open",   "Face to Face", 0),
    # ENGL
    ("ENGL",  "101",  "01", "MWF 10:10-11:00",  "Staff",           12, 22, "open",   "Face to Face", 0),
    ("ENGL",  "402",  "01", "TTh 9:35-10:50",   "Staff",            4, 22, "open",   "Face to Face", 0),
]


# ---------------------------------------------------------------------------
# Build DB
# ---------------------------------------------------------------------------

def build(out_path: Path = _OUT):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if out_path.exists():
        out_path.unlink()

    conn = sqlite3.connect(str(out_path))
    c = conn.cursor()

    # ── catalog_courses ────────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE catalog_courses (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            code            TEXT UNIQUE,
            title           TEXT,
            credits         INTEGER,
            ucore           TEXT,
            prerequisite_raw TEXT,
            description     TEXT,
            catalog_year    TEXT
        )
    """)

    with open(_META) as f:
        metadata = json.load(f)

    seen = set()
    rows = []
    for entry in metadata:
        code = entry["course_code"]
        if code in seen:
            continue
        seen.add(code)
        ucore, title, credits, desc = _parse_chunk(entry["chunk_text"])
        rows.append((code, title, credits, ucore, entry.get("prereq_raw", ""), desc, "2024-25"))

    c.executemany(
        "INSERT INTO catalog_courses (code, title, credits, ucore, prerequisite_raw, description, catalog_year)"
        " VALUES (?,?,?,?,?,?,?)",
        rows,
    )
    print(f"catalog_courses: {len(rows)} rows")

    # ── catalog_degrees ────────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE catalog_degrees (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            name         TEXT,
            credits      INTEGER,
            catalog_year TEXT
        )
    """)
    c.execute(
        "INSERT INTO catalog_degrees (name, credits, catalog_year) VALUES (?,?,?)",
        ("Computer Science BS", 120, "2024-25"),
    )
    deg_id = c.lastrowid

    # ── degree_requirements ────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE degree_requirements (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            degree_id   INTEGER,
            year        INTEGER,
            term        INTEGER,
            label       TEXT,
            hours       INTEGER,
            sort_order  INTEGER
        )
    """)
    req_rows = [
        (deg_id, yr, term, label, hrs, i)
        for i, (yr, term, label, hrs) in enumerate(_CS_BS_PLAN)
    ]
    c.executemany(
        "INSERT INTO degree_requirements (degree_id, year, term, label, hours, sort_order)"
        " VALUES (?,?,?,?,?,?)",
        req_rows,
    )
    print(f"degree_requirements: {len(req_rows)} rows")

    # ── courses (section schedule) ─────────────────────────────────────────
    c.execute("""
        CREATE TABLE courses (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            prefix          TEXT,
            courseNumber    TEXT,
            sectionNumber   TEXT,
            term            TEXT,
            year            INTEGER,
            dayTime         TEXT,
            instructor      TEXT,
            seatsAvailable  INTEGER,
            maxEnrollment   INTEGER,
            status          TEXT,
            instructionMode TEXT,
            isLab           INTEGER,
            title           TEXT,
            coursePrerequisite TEXT
        )
    """)

    # Resolve title + prereq from catalog_courses
    cat = {r[0]: (r[1], r[2]) for r in c.execute(
        "SELECT code, title, prerequisite_raw FROM catalog_courses"
    ).fetchall()}

    sec_rows = []
    for prefix, num, sec, daytime, instructor, avail, maxe, status, mode, islab in _SECTIONS:
        code_variants = [
            f"{prefix} {num}",
            f"{prefix.replace(' ', '')}{num}",
        ]
        title, prereq = "", ""
        for cv in code_variants:
            if cv in cat:
                title, prereq = cat[cv]
                break
        sec_rows.append((
            prefix, num, sec, "Fall", 2025, daytime, instructor,
            avail, maxe, status, mode, islab, title, prereq,
        ))

    c.executemany(
        "INSERT INTO courses (prefix, courseNumber, sectionNumber, term, year, dayTime,"
        " instructor, seatsAvailable, maxEnrollment, status, instructionMode, isLab, title, coursePrerequisite)"
        " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        sec_rows,
    )
    print(f"courses (sections): {len(sec_rows)} rows")

    conn.commit()
    conn.close()
    print(f"\nWrote {out_path}")


if __name__ == "__main__":
    build()
