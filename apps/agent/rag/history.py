from langchain_core.messages import HumanMessage, AIMessage, SystemMessage


def build_langchain_history(messages):
    """
    Convert Message model instances into LangChain message objects.
    Expects messages ordered chronologically.
    """
    history = []

    for msg in messages:
        if msg.role == "user":
            history.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            history.append(AIMessage(content=msg.content))
        elif msg.role == "system":
            history.append(SystemMessage(content=msg.content))

    return history