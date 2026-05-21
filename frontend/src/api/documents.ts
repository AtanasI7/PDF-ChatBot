/**
 * API функции за работа с документи.
 *
 * Всички функции тук са тънка обвивка около axios. Целта им е:
 * 1. Да има едно място, където са URL-ите към backend-а.
 * 2. Да типизират входа и изхода с TypeScript.
 * 3. Да са лесни за мокване в тестове.
 *
 * Тези функции НЕ управляват loading/error state - това го прави React Query
 * чрез useQuery / useMutation хуковете в src/hooks/useDocuments.ts
 */

import { api } from '../lib/axios'
import type {
  Document,
  DocumentListItem,
  PaginatedResponse,
} from '../types/api'

/**
 * Зарежда списъка с документи на текущия потребител.
 * Backend-ът връща paginated response (по 20 на страница).
 */
export async function listDocuments() {
  const { data } = await api.get<PaginatedResponse<DocumentListItem>>(
    '/api/documents/'
  )
  return data
}

/**
 * Зарежда един документ по id.
 * Полезно е за detail страница и за проверка на статуса.
 */
export async function getDocument(id: number) {
  const { data } = await api.get<Document>(`/api/documents/${id}/`)
  return data
}

export interface UploadDocumentInput {
  title: string
  file: File
}

/**
 * Качва нов PDF документ.
 *
 * ВАЖНО: тук НЕ изпращаме JSON, а multipart/form-data, защото имаме файл.
 * FormData автоматично кара axios да сложи правилния Content-Type header
 * (с boundary за multipart-а), затова не трябва ръчно да го задаваме.
 */
export async function uploadDocument(input: UploadDocumentInput) {
  const formData = new FormData()
  formData.append('title', input.title)
  formData.append('file', input.file)

  const { data } = await api.post<Document>('/api/documents/', formData)
  return data
}

/**
 * Изтрива документ. Backend-ът автоматично трие и:
 * - физическия PDF файл от /media/documents/
 * - FAISS индекса от /media/indexes/doc_<id>/
 * - всички chat sessions и messages (CASCADE)
 */
export async function deleteDocument(id: number) {
  await api.delete(`/api/documents/${id}/`)
}

/**
 * Създава (или връща съществуващ) чат за дадения документ.
 * Backend-ът е идемпотентен - вика се много пъти, връща един и същ чат.
 */
export async function getOrCreateChat(documentId: number) {
  const { data } = await api.post<{
    chat_id: number
    document_id: number
    created: boolean
    title: string
  }>(`/api/documents/${documentId}/chat/`)
  return data
}
