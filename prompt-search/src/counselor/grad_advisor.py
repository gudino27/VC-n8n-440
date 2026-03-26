import re

COURSE_CODE_RE = re.compile(r'\b([A-Z]{2,6}\s+\d{3,4})\b')


class GradAdvisor:
    def __init__(self, retriever):
        self.retriever = retriever

    def get_remaining(self, degree_program: str, completed_courses: list) -> dict:
        completed = {c.upper().strip() for c in completed_courses}

        query = f"requirements for {degree_program} degree graduation courses"
        chunks = self.retriever.search(query, top_k=10)

        required_codes = set()
        for chunk in chunks:
            found = COURSE_CODE_RE.findall(chunk["chunk_text"].upper())
            required_codes.update(found)

        completed_matches = sorted(required_codes & completed)
        remaining = sorted(required_codes - completed)

        return {
            "degree_program": degree_program,
            "required_found": sorted(required_codes),
            "completed_matches": completed_matches,
            "remaining": remaining,
            "chunks_used": len(chunks),
        }
