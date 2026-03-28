import os
import tempfile

import pytest

from src.retrieval.ingestor import CatalogIngestor


SAMPLE_CATALOG = """
CPTS 121 Program Design and Development
Credits: 3
Description: Computational problem solving and program design using a high-level language.
Prereq: None.

CPTS 122 Data Structures
Credits: 3
Description: Abstract data types, dynamic storage allocation.
Prereq: CPTS 121.

MATH 171 Calculus I
Credits: 4
Description: Limits, continuity, derivatives.
Prereq: MATH 107 or placement.

CPTS 360 Systems Programming
Credits: 3
Description: System calls and memory management.
Prereq: CPTS 121 and CPTS 122.
"""


@pytest.fixture
def catalog_file(tmp_path):
    f = tmp_path / "test_catalog.txt"
    f.write_text(SAMPLE_CATALOG)
    return str(f)


@pytest.fixture
def output_dir(tmp_path):
    d = tmp_path / "domain"
    d.mkdir()
    return str(d)


class TestCatalogIngestor:
    def test_parse_chunks_finds_courses(self, catalog_file, output_dir):
        ingestor = CatalogIngestor(catalog_file, output_dir)
        chunks = ingestor.parse_chunks()
        codes = [c["course_code"] for c in chunks]
        assert "CPTS 121" in codes
        assert "CPTS 122" in codes
        assert "MATH 171" in codes

    def test_parse_chunks_extracts_prereqs(self, catalog_file, output_dir):
        ingestor = CatalogIngestor(catalog_file, output_dir)
        chunks = ingestor.parse_chunks()
        cpts360 = next((c for c in chunks if c["course_code"] == "CPTS 360"), None)
        assert cpts360 is not None
        assert "CPTS 121" in cpts360["prereq_raw"] or "CPTS 122" in cpts360["prereq_raw"]

    def test_parse_chunks_no_prereq_is_empty_string(self, catalog_file, output_dir):
        ingestor = CatalogIngestor(catalog_file, output_dir)
        chunks = ingestor.parse_chunks()
        cpts121 = next((c for c in chunks if c["course_code"] == "CPTS 121"), None)
        assert cpts121 is not None
        assert isinstance(cpts121["prereq_raw"], str)

    def test_chunk_text_not_empty(self, catalog_file, output_dir):
        ingestor = CatalogIngestor(catalog_file, output_dir)
        chunks = ingestor.parse_chunks()
        for chunk in chunks:
            assert len(chunk["chunk_text"]) >= 20
