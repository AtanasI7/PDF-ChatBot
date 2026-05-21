/**
 * ChatPage - страницата за чат с PDF документ.
 *
 * Във Фаза 4 страницата стана SPLIT VIEW:
 * - Ляво: PDFViewer (само на десктоп - lg:flex)
 * - Дясно: списък със съобщения + input
 *
 * Главни концепции:
 *
 * 1. State lifting за currentPage:
 *    ChatPage държи currentPage state-а. Подава го към PDFViewer като
 *    controlled prop + setCurrentPage като onCitationClick за съобщенията.
 *    Така клик върху citation в чата сменя страницата в PDF-а.
 *
 * 2. Responsive design:
 *    На мобилно (< lg) виждаме само чата. PDF panel-ът е hidden.
 *    На десктоп - 50/50 split.
 *
 * 3. Optimistic UI (от Фаза 3):
 *    pendingQuestion показва user съобщението веднага, докато чакаме отговор.
 *
 * 4. Auto-scroll (от Фаза 3):
 *    bottomRef + scrollIntoView в useEffect.
 */

import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  useAskQuestion,
  useChat,
  useMessages,
} from '../hooks/useChat'
import { MessageBubble } from '../components/MessageBubble'
import { ChatInput } from '../components/ChatInput'
import { PDFViewer } from '../components/PDFViewer'
import { getMediaUrl } from '../lib/media'
import type { Message } from '../types/api'

export function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const chatId = Number(id)

  const { data: chat, isLoading: chatLoading } = useChat(chatId)
  const {
    data: messagesData,
    isLoading: messagesLoading,
    isError: messagesError,
  } = useMessages(chatId)
  const askMutation = useAskQuestion(chatId)

  // State за чат-а
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  // State за PDF навигацията - 1-индексиран (PDF.js и react-pdf са 1-based)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const bottomRef = useRef<HTMLDivElement>(null)
  const messages = messagesData?.results ?? []

  // Auto-scroll до дъното при нови съобщения
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, pendingQuestion, askMutation.isPending])

  const handleSend = async (question: string) => {
    setSendError(null)
    setPendingQuestion(question)
    try {
      await askMutation.mutateAsync(question)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data
        setSendError(
          data?.detail || 'Грешка при изпращане на въпрос. Опитай пак.'
        )
      } else {
        setSendError('Неочаквана грешка.')
      }
    } finally {
      setPendingQuestion(null)
    }
  }

  // Защита срещу невалидни URL-и
  if (isNaN(chatId) || chatId <= 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Невалиден chat ID.{' '}
        <Link to="/" className="text-blue-600 underline">
          Към документите
        </Link>
      </div>
    )
  }

  // Build PDF URL от document_file полето
  const pdfUrl = chat?.document_file ? getMediaUrl(chat.document_file) : null

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-9rem)] min-h-[500px]">
      {/*
        ЛЯВО: PDF viewer
        - Скрит на мобилно (hidden lg:flex)
        - 50% ширина на десктоп (lg:w-1/2)
      */}
      <div className="hidden lg:flex lg:w-1/2 flex-col">
        {chatLoading && (
          <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200 text-gray-500 text-sm">
            Зареждане на чата...
          </div>
        )}
        {!chatLoading && !pdfUrl && (
          <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200 text-gray-500 text-sm">
            Няма наличен PDF файл
          </div>
        )}
        {!chatLoading && pdfUrl && (
          <PDFViewer
            url={pdfUrl}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/*
        ДЯСНО: Chat panel
        - Винаги видимо
        - На десктоп - 50%, на мобилно - пълна ширина
      */}
      <div className="flex flex-col flex-1 lg:w-1/2 min-h-0">
        {/* Header на чата */}
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 mb-3 flex-shrink-0">
          <Link
            to="/"
            className="p-1.5 -ml-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Назад към документите"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {chatLoading
                ? 'Зареждане...'
                : chat?.document_title || 'Без заглавие'}
            </h1>
            {chat?.messages_count !== undefined && (
              <p className="text-xs text-gray-500">
                {chat.messages_count} съобщения
              </p>
            )}
          </div>
        </div>

        {/* Скролируем списък със съобщения */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2 min-h-0">
          {messagesLoading && (
            <p className="text-center text-gray-500 py-8 text-sm">
              Зареждане на съобщенията...
            </p>
          )}

          {messagesError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              Грешка при зареждане на съобщенията.
            </div>
          )}

          {!messagesLoading &&
            messages.length === 0 &&
            !pendingQuestion &&
            !askMutation.isPending && (
              <div className="text-center text-gray-500 py-12">
                <p className="font-medium mb-1">Здравей!</p>
                <p className="text-sm">
                  Задай първия си въпрос върху съдържанието на PDF-а отдолу.
                </p>
              </div>
            )}

          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              onCitationClick={setCurrentPage}
            />
          ))}

          {pendingQuestion && (
            <MessageBubble
              message={
                {
                  id: -1,
                  role: 'user',
                  content: pendingQuestion,
                  metadata: {},
                  created_at: new Date().toISOString(),
                } as Message
              }
            />
          )}

          {askMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
                <span className="inline-flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </span>
              </div>
            </div>
          )}

          {sendError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {sendError}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input box - винаги долу */}
        <div className="flex-shrink-0">
          <ChatInput onSend={handleSend} isLoading={askMutation.isPending} />
        </div>
      </div>
    </div>
  )
}
