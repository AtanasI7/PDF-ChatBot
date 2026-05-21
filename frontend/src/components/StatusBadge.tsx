/**
 * StatusBadge - визуален индикатор за статуса на документ.
 *
 * Малък "presentational" компонент - не държи state, само получава props
 * и рендерира съответната визуализация. Това е добра практика - такива
 * компоненти са лесни за тестване и преизползване.
 */

import type { DocumentStatus } from '../types/api'

interface StatusBadgeProps {
  status: DocumentStatus
}

/**
 * Мапваме всеки статус към:
 * - human-readable label на български
 * - Tailwind класове за цвета
 * - дали да показваме spinner (само при "processing")
 */
const statusConfig: Record<
  DocumentStatus,
  { label: string; className: string; spinning: boolean }
> = {
  uploaded: {
    label: 'Качен',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    spinning: false,
  },
  processing: {
    label: 'Обработва се...',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    spinning: true,
  },
  ready: {
    label: 'Готов',
    className: 'bg-green-50 text-green-700 border-green-200',
    spinning: false,
  },
  failed: {
    label: 'Грешка',
    className: 'bg-red-50 text-red-700 border-red-200',
    spinning: false,
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${config.className}`}
    >
      {config.spinning && (
        <span
          className="w-2 h-2 rounded-full bg-current animate-pulse"
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  )
}
