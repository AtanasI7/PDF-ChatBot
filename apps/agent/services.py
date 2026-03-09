from __future__ import annotations
from pathlib import Path
from typing import Any

from django.conf import settings

from apps.agent.rag.ingestion import load_pdf
from apps.agent.rag.chunking import split_docs
from apps.agent.rag.indexing import build_faiss_index, save_faiss_index, load_faiss_index
from apps.agent.rag.qa import answer_question


class AgentService:
    """
    Django-facing service:
    - гарантира, че има FAISS индекс за документа
    - отговаря на въпрос
    - връща answer + metadata(sources)
    """

    @staticmethod
    def _index_dir_for_document(document_id: int) -> Path:
        return Path(settings.MEDIA_ROOT) / "indexes" / f"doc_{document_id}"

    @classmethod
    def ensure_index(cls, *, document_id: int, pdf_path: str) -> Path:
        """
        If index exists -> return.
        Else -> build and save.
        """
        index_dir = cls._index_dir_for_document(document_id)

        # FAISS save_local writes files inside the directory; existence check can be:
        if index_dir.exists() and any(index_dir.iterdir()):
            return index_dir

        # build index
        docs = load_pdf(pdf_path)
        chunks = split_docs(docs, chunk_size=1000, chunk_overlap=150)
        vs = build_faiss_index(chunks, embedding_model="text-embedding-3-small")
        save_faiss_index(vs, index_dir)
        return index_dir

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
        chat_history currently not used by qa.answer_question (basic RAG).
        We'll keep it in signature because later we can upgrade to history-aware chain.
        """
        index_dir = cls.ensure_index(document_id=document_id, pdf_path=pdf_path)
        vs = load_faiss_index(index_dir, embedding_model="text-embedding-3-small")

        ans = answer_question(vs, question=question, k=k, llm_model=llm_model)

        # serialize sources (min info)
        sources_payload = []
        for d in ans.sources:
            sources_payload.append({
                "source": d.metadata.get("source"),
                "page": d.metadata.get("page"),
                # chunk text може да е голям; по желание връщаме само кратък excerpt
                "excerpt": d.page_content[:500],
            })

        metadata = {"sources": sources_payload}
        return ans.text, metadata