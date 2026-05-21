/**
 * DocumentCard - единичен документ в списъка.
 *
 * "Dumb" компонент - получава документа като prop и емитва събития
 * (onDelete, onOpenChat) към родителя. Цялата business логика стои в
 * DocumentsPage. Този pattern се нарича "lifting state up".
 *
 * Защо така? Защото ако този компонент сам си викаше delete mutation-а,
 * нямаше да можем лесно да покажем confirm dialog с правилния документ
 * (трябваше всеки card да си има свой dialog state). С този pattern
 * родителят централизирано контролира state-а.
 */

import type { DocumentListItem } from '../types/api'
import { StatusBadge } from './StatusBadge'

interface DocumentCardProps {
  document: DocumentListItem
  onDelete: (doc: DocumentListItem) => void
  onOpenChat: (doc: DocumentListItem) => void
  isDeletingId?: number | null
}

/**
 * Помощна функция за форматиране на дата на български.
 * Intl.DateTimeFormat е стандартния browser API за i18n - не ни трябва
 * допълнителна библиотека като moment или date-fns за прости случаи.
 */
function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('bg-BG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString))
}

export function DocumentCard({
  document,
  onDelete,
  onOpenChat,
  isDeletingId,
}: DocumentCardProps) {
  const isReady = document.status === 'ready'
  const isBeingDeleted = isDeletingId === document.id

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      {/* PDF иконка - inline SVG, без външен пакет */}
      <div className="flex-shrink-0 w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      {/* Заглавие и метаданни */}
      <div className="flex-1 min-w-0">
        <h3
          className="font-medium text-gray-900 truncate"
          title={document.title}
        >
          {document.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <StatusBadge status={document.status} />
          <span className="text-xs text-gray-500">
            {formatDate(document.created_at)}
          </span>
        </div>
      </div>

      {/* Бутони за действие */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onOpenChat(document)}
          disabled={!isReady}
          title={
            isReady
              ? 'Отвори чат'
              : 'Документът трябва да е готов преди да можеш да чатиш'
          }
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Чат
        </button>
        <button
          type="button"
          onClick={() => onDelete(document)}
          disabled={isBeingDeleted}
          title="Изтрий"
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
