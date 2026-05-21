/**
 * API функции за работа с чатове и съобщения.
 *
 * Backend endpoints (виж backend/apps/chats/views.py):
 * - GET    /api/chats/                 - списък със всички мои чатове
 * - GET    /api/chats/<id>/            - детайл за чат (title, document_title и т.н.)
 * - GET    /api/chats/<id>/messages/   - paginated списък със съобщения
 * - POST   /api/chats/<id>/ask/        - задаване на въпрос -> отговор от LLM
 *
 * Забележка: ask endpoint-ът блокира заявката докато OpenAI отговори
 * (5-15 секунди обикновено). Това е по-късно нещо за оптимизация
 * (streaming responses или Celery + WebSockets).
 */

import { api } from '../lib/axios'
import type {
  AskResponse,
  ChatSession,
  Message,
  PaginatedResponse,
} from '../types/api'

/**
 * Зарежда детайли за един чат сесия.
 */
export async function getChat(chatId: number) {
  const { data } = await api.get<ChatSession>(`/api/chats/${chatId}/`)
  return data
}

/**
 * Зарежда списъка със съобщения за чат.
 * Backend сортира по created_at ASC (най-стари първи).
 */
export async function listMessages(chatId: number) {
  const { data } = await api.get<PaginatedResponse<Message>>(
    `/api/chats/${chatId}/messages/`
  )
  return data
}

/**
 * Задава въпрос. Backend:
 * 1. Записва user message в DB.
 * 2. Извиква RAG chain (FAISS retrieval + OpenAI LLM).
 * 3. Записва assistant message с citations в metadata.
 * 4. Връща и двете със meta-данни.
 *
 * Заявката може да отнеме 5-30 секунди заради OpenAI call-а.
 */
export async function askQuestion(chatId: number, question: string) {
  const { data } = await api.post<AskResponse>(`/api/chats/${chatId}/ask/`, {
    question,
  })
  return data
}
