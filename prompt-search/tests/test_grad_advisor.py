from unittest.mock import MagicMock

from src.counselor.grad_advisor import GradAdvisor


def _make_retriever(chunks):
    retriever = MagicMock()
    retriever.search.return_value = chunks
    return retriever


class TestGradAdvisor:
    def test_all_remaining(self):
        chunks = [{"chunk_text": "CPTS 121 CPTS 122 MATH 171 required for degree"}]
        advisor = GradAdvisor(_make_retriever(chunks))
        result = advisor.get_remaining("Computer Science", [])
        assert "CPTS 121" in result["remaining"]
        assert "MATH 171" in result["remaining"]
        assert result["completed_matches"] == []

    def test_some_completed(self):
        chunks = [{"chunk_text": "CPTS 121 CPTS 122 MATH 171 required for degree"}]
        advisor = GradAdvisor(_make_retriever(chunks))
        result = advisor.get_remaining("Computer Science", ["CPTS 121", "MATH 171"])
        assert "CPTS 121" not in result["remaining"]
        assert "MATH 171" not in result["remaining"]
        assert "CPTS 122" in result["remaining"]
        assert "CPTS 121" in result["completed_matches"]

    def test_all_completed(self):
        chunks = [{"chunk_text": "CPTS 121 required"}]
        advisor = GradAdvisor(_make_retriever(chunks))
        result = advisor.get_remaining("Computer Science", ["CPTS 121"])
        assert result["remaining"] == []
        assert "CPTS 121" in result["completed_matches"]

    def test_no_chunks_found(self):
        advisor = GradAdvisor(_make_retriever([]))
        result = advisor.get_remaining("Unknown Degree", ["CPTS 121"])
        assert result["required_found"] == []
        assert result["remaining"] == []
        assert result["chunks_used"] == 0

    def test_chunks_used_count(self):
        chunks = [
            {"chunk_text": "CPTS 121"},
            {"chunk_text": "MATH 171"},
        ]
        advisor = GradAdvisor(_make_retriever(chunks))
        result = advisor.get_remaining("Computer Science", [])
        assert result["chunks_used"] == 2

    def test_case_insensitive_completed(self):
        chunks = [{"chunk_text": "CPTS 121 required"}]
        advisor = GradAdvisor(_make_retriever(chunks))
        result = advisor.get_remaining("Computer Science", ["cpts 121"])
        assert result["remaining"] == []
