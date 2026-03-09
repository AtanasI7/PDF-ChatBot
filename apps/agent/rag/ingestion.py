from __future__ import annotations

from pathlib import Path
from typing import List

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document


def load_pdf(pdf_path: str | Path) -> List[Document]:
    """
    Loads a PDF and returns a list of Documents, typically one per page.
    Each Document has metadata including 'source' and 'page'.
    """
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    loader = PyPDFLoader(str(pdf_path))
    docs = loader.load()

    # Normalize / ensure metadata keys exist
    for d in docs:
        d.metadata.setdefault("source", str(pdf_path))
        # PyPDFLoader usually sets 'page' already; keep it
        if "page" not in d.metadata:
            d.metadata["page"] = None

    return docs