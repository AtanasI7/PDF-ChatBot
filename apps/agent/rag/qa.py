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
             """
                You are an expert document assistant.
            
                Your task is to answer the user's question using ONLY the provided context extracted from a PDF document.
            
                Rules:
                1. Use ONLY the provided context. Do NOT use external knowledge.
                2. If the context clearly contains the answer:
                   - Provide a concise and clear answer (3–6 sentences max).
                   - Base your reasoning strictly on the context.
                3. If the context does NOT contain enough information to answer:
                   - Do NOT hallucinate.
                   - Explicitly state that the answer cannot be found in the provided document excerpts.
                   - Ask 2–3 specific clarifying questions that would help narrow down the search.
                   - Suggest how the user could reformulate the question (e.g., include section name, keywords, timeframe, etc.).
            
                Style guidelines:
                - Be precise and professional.
                - Avoid generic answers.
                - Do not mention "the model" or "the prompt".
                - Do not invent missing facts.
            """
             ),
            ("user", "Question: {question}\n\nContext:\n{context}"),
        ]
    )

    llm = ChatOpenAI(model=llm_model, temperature=0)
    chain = prompt | llm | StrOutputParser()

    text = chain.invoke({"question": question, "context": context})
    return Answer(text=text, sources=docs)