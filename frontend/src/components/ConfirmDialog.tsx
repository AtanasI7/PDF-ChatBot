/**
 * ConfirmDialog - просто потвърждение преди опасно действие (напр. изтриване).
 *
 * Имплементирано е като "controlled" компонент - родителят му казва дали да
 * е отворен (isOpen) и какво да прави при потвърждение (onConfirm).
 *
 * За production app бихме ползвали по-сложна модална библиотека (radix-ui,
 * headless-ui) с фокус trap, ESC за затваряне, accessibility и т.н.
 * За learning-а сме достатъчни и тези прости 30 реда.
 */

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Потвърди',
  cancelLabel = 'Отказ',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Ако диалогът не е отворен - не рендерираме нищо. Това е по-чисто от
  // винаги да рендерираме и да крием с CSS.
  if (!isOpen) return null

  return (
    // Backdrop - полупрозрачен черен слой върху цялата страница.
    // onClick на backdrop затваря диалога (но не и кликове върху самия диалог
    // благодарение на e.stopPropagation()).
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
          >
            {isLoading ? 'Зарежда...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
