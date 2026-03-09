from __future__ import annotations

from typing import Dict, Callable

from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains.history_aware_retriever import create_history_aware_retriever
from langchain_classic.chains.retrieval import create_retrieval_chain
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory


def build_chat_rag_chain(
    vectorstore,
    llm_model: str = "gpt-4o-mini",
    k: int = 4,
) -> RunnableWithMessageHistory:
    """
    Creates a history-aware RAG chain:
    - Uses chat history to reformulate the user's question into a standalone query
    - Retrieves top-k docs from vectorstore
    - Answers using ONLY retrieved context
    - Keeps chat history in memory via RunnableWithMessageHistory
    """
    llm = ChatOpenAI(model=llm_model, temperature=0)

    # 1) Retriever
    base_retriever = vectorstore.as_retriever(search_kwargs={"k": k})

    # 2) Prompt to turn follow-up questions into standalone questions
    qa_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
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
            MessagesPlaceholder("chat_history"),
            (
                "user",
                "Question:\n{input}\n\n"
                "Document Context:\n{context}"
            ),
        ]
    )

    history_aware_retriever = create_history_aware_retriever(
        llm,
        base_retriever,
        qa_prompt,
    )

    # 3) Prompt for answering using retrieved docs
    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system",
             "You are a helpful assistant. Answer the user's question using ONLY the provided context. "
             "If the answer is not in the context, say you don't know. Keep the answer concise."),
            MessagesPlaceholder("chat_history"),
            ("user", "Question: {input}\n\nContext:\n{context}"),
        ]
    )

    combine_docs_chain = create_stuff_documents_chain(llm, qa_prompt)

    rag_chain = create_retrieval_chain(history_aware_retriever, combine_docs_chain)
    # rag_chain output is typically: {"answer": "...", "context": [Document, ...]}

    # 4) In-memory message history store (per session)
    store: Dict[str, ChatMessageHistory] = {}

    def get_history(session_id: str) -> ChatMessageHistory:
        if session_id not in store:
            store[session_id] = ChatMessageHistory()
        return store[session_id]

    chain_with_memory = RunnableWithMessageHistory(
        rag_chain,
        get_session_history=get_history,
        input_messages_key="input",
        history_messages_key="chat_history",
        output_messages_key="answer",
    )

    return chain_with_memory