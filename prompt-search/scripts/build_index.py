import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from retrieval.ingestor import CatalogIngestor

CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "pdf-archieved-catalog", "2024.txt")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "domain")

if __name__ == "__main__":
    ingestor = CatalogIngestor(
        catalog_path=os.path.abspath(CATALOG_PATH),
        output_dir=os.path.abspath(OUTPUT_DIR),
    )
    ingestor.save()
    print("Index built. Run scripts/query.py to start asking questions.")
