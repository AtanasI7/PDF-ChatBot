from __future__ import annotations

from typing import List

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


def split_docs(
    docs: List[Document],
    chunk_size: int = 1000,
    chunk_overlap: int = 150,
) -> List[Document]:
    """
    Split Documents into smaller chunks for embeddings.
    Metadata is preserved per chunk (including page number).
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""],
    )

    chunks = splitter.split_documents(docs)

    for idx, chunk in enumerate(chunks):
        chunk.metadata.setdefault("source", chunk.metadata.get("source"))
        chunk.metadata.setdefault("page", chunk.metadata.get("page"))
        chunk.metadata["chunk_index"] = idx
        chunk.metadata["source_name"] = str(chunk.metadata.get("source", "")).split("/")[-1]

    return chunks