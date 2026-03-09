from __future__ import annotations

from dataclasses import dataclass
from typing import List

from langchain_core.documents import Document
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser


@dataclass
class Answer:
    text: str
    sources: List[Document]


def answer_question(
    vectorstore,
    question: str,
    k: int = 4,
    llm_model: str = "gpt-4o-mini",
) -> Answer:
    """
    Basic RAG: retrieve top-k chunks and ask the LLM to answer using only that context.
    Returns answer text + source documents.
    """
    retriever = vectorstore.as_retriever(search_kwargs={"k": k})
    docs = retriever.invoke(question)

    context = "\n\n---\n\n".join(
        f"[source={d.metadata.get('source')} page={d.metadata.get('page')}]\n{d.page_content}"
        for d in docs
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system",
             "You are a helpful assistant. Answer the user's question using ONLY the provided context. "
             "If the answer is not in the context, say you don't know. Keep the answer concise."),
            ("user", "Question: {question}\n\nContext:\n{context}"),
        ]
    )

    llm = ChatOpenAI(model=llm_model, temperature=0)
    chain = prompt | llm | StrOutputParser()

    text = chain.invoke({"question": question, "context": context})
    return Answer(text=text, sources=docs)