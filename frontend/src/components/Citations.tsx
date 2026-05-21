/**
 * Citations - показва източниците (page references) под assistant съобщение.
 *
 * Backend изпраща citations в Message.metadata.citations:
 * [
 *   { id: 1, source: "...", page: 2, chunk_index: 5, excerpt: "..." },
 *   { id: 2, source: "...", page: 7, chunk_index: 12, excerpt: "..." },
 * ]
 *
 * Във Фаза 4 чиповете станаха бутони - клик навигира PDF viewer-а
 * до съответната страница чрез onCitationClick prop-а.
 *
 * ВАЖНО за номерата на страници:
 * PyPDFLoader в backend-а индексира от 0. Тук показваме 1-индексирано
 * за потребителя и за PDF viewer-а (react-pdf също е 1-индексиран).
 */

import type { Citation } from '../types/api'

interface CitationsProps {
  citations: Citation[]
  /**
   * Когато е подаден, чиповете стават кликабелни и викат този callback
   * с 1-индексираната страница. Ако липсва - чиповете са само за showing.
   */
  onCitationClick?: (page: number) => void
}

export function Citations({ citations, onCitationClick }: CitationsProps) {
  if (!citations || citations.length === 0) return null

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <p className="text-xs font-medium text-gray-500 mb-1.5">Източници:</p>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((c) => {
          const displayPage = c.page !== null ? c.page + 1 : null
          const label = displayPage !== null ? `стр. ${displayPage}` : '?'
          const isClickable =
            onCitationClick !== undefined && displayPage !== null

          const baseClasses =
            'inline-flex items-center px-2 py-0.5 rounded text-xs transition-colors'
          const clickableClasses = isClickable
            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer'
            : 'bg-gray-100 text-gray-700 cursor-help'

          return (
            <button
              key={c.id}
              type="button"
              title={c.excerpt || 'Без preview'}
              disabled={!isClickable}
              onClick={() => {
                if (isClickable && displayPage !== null) {
                  onCitationClick(displayPage)
                }
              }}
              className={`${baseClasses} ${clickableClasses}`}
            >
              [{c.id}] {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
