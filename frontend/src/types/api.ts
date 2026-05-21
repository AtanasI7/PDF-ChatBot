/**
 * TypeScript типове, които съответстват на Django REST API serializer-ите.
 *
 * Тези типове НЕ съществуват в runtime - TypeScript ги изтрива при компилация.
 * Целта им е:
 * 1. Autocomplete в IDE-то (виждаш кои полета съществуват в обект).
 * 2. Compile-time проверки (грешка, ако пишеш `user.firstName` вместо `user.username`).
 * 3. Документация (новият developer вижда формата на данните без да чете backend кода).
 *
 * ВАЖНО: Тези типове трябва ръчно да се поддържат синхронизирани с
 * Django serializers (виж backend/apps/*/serializers.py). Ако backend-ът
 * добави ново поле, ние трябва да го добавим и тук.
 *
 * Бъдеще: бихме могли да генерираме типовете автоматично от OpenAPI
 * schema чрез drf-spectacular + openapi-typescript-codegen.
 */

// ============================================================================
// Auth (виж dj-rest-auth)
// ============================================================================

/**
 * Профилът на логнатия потребител.
 *
 * `pk` е Django's primary key - същото като `id`, но dj-rest-auth го
 * връща под името "pk" поради историческа причина.
 */
export interface AuthUser {
  pk: number
  email: string
  username: string
}

/**
 * Отговорът на POST /api/auth/login/ и POST /api/auth/registration/.
 *
 * - `access`: JWT token за authentication, валиден 120 минути (виж settings.py).
 * - `refresh`: дългоживущ token за подновяване на access token-а. Валиден 7 дни.
 * - `user`: профилът на логнатия потребител.
 */
export interface LoginResponse {
  access: string
  refresh: string
  user: AuthUser
}

// ============================================================================
// Documents (виж apps/documents/models.py и serializers.py)
// ============================================================================

/**
 * Възможните статуси на документ.
 *
 * Жизнен цикъл (виж backend perform_create):
 * uploaded -> processing -> ready (или failed)
 *
 * - `uploaded`:   току-що качен, още не е започнало индексиране.
 * - `processing`: backend-ът извлича текст и строи FAISS индекс.
 * - `ready`:      готов за чат. Индексът е записан в /media/indexes/.
 * - `failed`:     грешка при индексиране (например невалиден PDF).
 */
export type DocumentStatus = 'uploaded' | 'processing' | 'ready' | 'failed'

/**
 * Пълни детайли на документ (DocumentSerializer в backend-а).
 *
 * - `file`: relative path към PDF-а (напр. "documents/abc.pdf"). Трябва
 *   да се превърне в пълен URL чрез getMediaUrl() от lib/media.ts.
 * - `index_dir`: път към FAISS индекса. Не се ползва във frontend-а,
 *   ползва се само за вътрешна логика на backend-а.
 * - `created_at` / `updated_at`: ISO 8601 timestamp strings (напр.
 *   "2026-05-19T14:30:00Z"). Превръщат се в Date обекти с `new Date(str)`.
 */
export interface Document {
  id: number
  title: string
  file: string
  status: DocumentStatus
  index_dir: string
  created_at: string
  updated_at: string
}

/**
 * "Slim" версия за списъка с документи (DocumentListSerializer).
 *
 * Не съдържа `file` и `index_dir` за да е по-малко payload при list.
 * Когато трябват тези полета - чете се със getDocument(id).
 */
export interface DocumentListItem {
  id: number
  title: string
  status: DocumentStatus
  created_at: string
  updated_at: string
}

// ============================================================================
// Chat & Messages (виж apps/chats/models.py и serializers.py)
// ============================================================================

/**
 * Ролите в чата.
 *
 * - `system`:    системни съобщения (rare, обикновено промптове).
 * - `user`:      съобщения от потребителя.
 * - `assistant`: отговори от LLM-а.
 */
export type MessageRole = 'system' | 'user' | 'assistant'

/**
 * Цитат към PDF документа в отговора на LLM-а.
 *
 * Идва от RAG системата - всеки чат-отговор се базира на конкретни chunks
 * от PDF-а. Този обект описва откъде идва информацията.
 *
 * - `id`:           пореден номер в текущия отговор (1, 2, 3...).
 * - `source`:       пълният път към PDF-а (например "/media/documents/x.pdf").
 * - `source_name`:  само името на файла (например "x.pdf").
 * - `page`:         номер на страницата (0-индексиран! PyPDFLoader convention).
 *                   Когато показваме на потребителя, добавяме +1.
 * - `chunk_index`:  индекс на chunk-а в общия индекс. За debug.
 * - `excerpt`:      първите 500 символа от chunk-а. Показва се като tooltip.
 */
export interface Citation {
  id: number
  source: string | null
  source_name: string | null
  page: number | null
  chunk_index: number | null
  excerpt: string
}

/**
 * Метаданни към съобщение.
 *
 * Опционално - user съобщенията обикновено имат празен metadata,
 * assistant съобщенията имат citations + sources count.
 */
export interface MessageMetadata {
  citations?: Citation[]
  sources?: number
}

/**
 * Едно съобщение в чат.
 *
 * Чатовете в нашия проект са линейни - няма threading, replies към
 * конкретно съобщение или редактиране.
 */
export interface Message {
  id: number
  role: MessageRole
  content: string
  metadata: MessageMetadata
  created_at: string
}

/**
 * Чат сесия - 1:1 връзка с документ.
 *
 * Един потребител има точно един чат за всеки негов документ
 * (backend-ът налага това чрез OneToOneField).
 *
 * - `document_file`: relative path към PDF-а (както в Document.file).
 *                    Идва от ChatSessionDetailSerializer.
 * - `messages_count`: брой съобщения в този чат (може да липсва в list view).
 */
export interface ChatSession {
  id: number
  title: string
  document_id: number
  document_title: string
  document_file?: string
  messages_count?: number
  created_at: string
  updated_at: string
}

/**
 * Отговор на POST /api/chats/<id>/ask/.
 *
 * Backend-ът ВЕЧЕ е записал и user, и assistant съобщенията в DB.
 * Този отговор е "ехо" на assistant съобщението + метаданни.
 */
export interface AskResponse {
  answer: string
  metadata: MessageMetadata
  message_id: number
  session_id: number
}

// ============================================================================
// Общи типове
// ============================================================================

/**
 * Generic тип за DRF paginated отговор.
 *
 * Всички list endpoints в Django REST Framework връщат този формат
 * (когато pagination е настроен, което е true за нас - виж settings.py
 * REST_FRAMEWORK.DEFAULT_PAGINATION_CLASS).
 *
 * Generic-ът <T> позволява един и същ тип да описва всички list responses:
 *   PaginatedResponse<DocumentListItem>
 *   PaginatedResponse<Message>
 *   PaginatedResponse<ChatSession>
 */
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
