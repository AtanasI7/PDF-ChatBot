from __future__ import annotations

from pathlib import Path
from typing import Any

from django.conf import settings

from apps.agent.rag.chat import build_history_aware_rag_chain
from apps.agent.rag.chunking import split_docs
from apps.agent.rag.history import build_langchain_history
from apps.agent.rag.indexing import build_faiss_index, load_faiss_index, save_faiss_index
from apps.agent.rag.ingestion import load_pdf
from apps.agent.rag.qa import answer_question

class AgentServiceDBMemory:
    @staticmethod
    def get_index_dir(document_id: int) -> Path:
        return Path(settings.MEDIA_ROOT) / "indexes" / f"doc_{document_id}"

    @classmethod
    def build_document_index(cls, document) -> str:
        pdf_path = document.file.path
        index_dir = cls.get_index_dir(document.id)

        docs = load_pdf(pdf_path)
        chunks = split_docs(docs, chunk_size=1000, chunk_overlap=150)
        vectorstore = build_faiss_index(
            chunks,
            embedding_model="text-embedding-3-small",
        )
        save_faiss_index(vectorstore, index_dir)

        return str(index_dir)

    @classmethod
    def ask(
        cls,
        *,
        document_id: int,
        pdf_path: str,
        question: str,
        chat_history: list[Any],
        k: int = 4,
        llm_model: str = "gpt-4o-mini",
    ) -> tuple[str, dict]:
        index_dir = cls.get_index_dir(document_id)

        if not index_dir.exists():
            raise FileNotFoundError(f"Index directory not found for document {document_id}")

        vectorstore = load_faiss_index(
            index_dir=index_dir,
            embedding_model="text-embedding-3-small",
        )

        rag_chain = build_history_aware_rag_chain(
            vectorstore=vectorstore,
            llm_model=llm_model,
            k=k,
        )

        lc_history = build_langchain_history(chat_history)

        result = rag_chain.invoke(
            {
                "input": question,
                "chat_history": lc_history,
            }
        )

        answer_text = result.get("answer", "")
        source_docs = result.get("context", [])

        sources_payload = [
            {
                "source": doc.metadata.get("source"),
                "page": doc.metadata.get("page"),
                "excerpt": doc.page_content[:500],
            }
            for doc in source_docs
        ]

        metadata = {
            "sources": sources_payload,
        }

        return answer_text, metadata


class AgentServiceInMemory:
    @staticmethod
    def get_index_dir(document_id: int) -> Path:
        return Path(settings.MEDIA_ROOT) / "indexes" / f"doc_{document_id}"

    @classmethod
    def build_document_index(cls, document) -> str:
        """
        Build and save a FAISS index for a document.
        Returns the absolute path to the index directory.
        """
        pdf_path = document.file.path
        index_dir = cls.get_index_dir(document.id)

        docs = load_pdf(pdf_path)
        chunks = split_docs(docs, chunk_size=1000, chunk_overlap=150)
        vectorstore = build_faiss_index(
            chunks,
            embedding_model="text-embedding-3-small",
        )
        save_faiss_index(vectorstore, index_dir)

        return str(index_dir)

    @classmethod
    def ask(
        cls,
        *,
        document_id: int,
        pdf_path: str,
        question: str,
        chat_history: list[dict[str, Any]],
        k: int = 4,
        llm_model: str = "gpt-4o-mini",
    ) -> tuple[str, dict]:
        """
        Answer a question using the saved FAISS index.
        chat_history is kept in the signature because we'll use it in the next step.
        """
        index_dir = cls.get_index_dir(document_id)

        if not index_dir.exists():
            raise FileNotFoundError(f"Index directory not found for document {document_id}")

        vectorstore = load_faiss_index(
            index_dir=index_dir,
            embedding_model="text-embedding-3-small",
        )

        answer = answer_question(
            vectorstore=vectorstore,
            question=question,
            k=k,
            llm_model=llm_model,
        )

        sources_payload = [
            {
                "source": doc.metadata.get("source"),
                "page": doc.metadata.get("page"),
                "excerpt": doc.page_content[:500],
            }
            for doc in answer.sources
        ]

        metadata = {
            "sources": sources_payload,
        }

        return answer.text, metadata