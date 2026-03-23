from __future__ import annotations

from pathlib import Path
from typing import List

from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings


def build_faiss_index(
    chunks: List[Document],
    embedding_model: str = "text-embedding-3-small",
) -> FAISS:
    embeddings = OpenAIEmbeddings(model=embedding_model)
    vs = FAISS.from_documents(chunks, embeddings)
    return vs


def save_faiss_index(vs: FAISS, index_dir: str | Path) -> None:
    index_dir = Path(index_dir)
    index_dir.mkdir(parents=True, exist_ok=True)
    vs.save_local(str(index_dir))


def load_faiss_index(
    index_dir: str | Path,
    embedding_model: str = "text-embedding-3-small",
) -> FAISS:
    index_dir = Path(index_dir)
    if not index_dir.exists():
        raise FileNotFoundError(f"Index dir not found: {index_dir}")

    embeddings = OpenAIEmbeddings(model=embedding_model)

    # allow_dangerous_deserialization=True is required because FAISS load uses pickle internally
    vs = FAISS.load_local(
        str(index_dir),
        embeddings,
        allow_dangerous_deserialization=True,
    )
    return vs