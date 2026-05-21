/**
 * ChatInput - input box-ът долу за нови съобщения.
 *
 * Pattern-и:
 * - Auto-resize textarea: расте като пишеш повече редове, до max 160px.
 * - Enter за изпращане, Shift+Enter за нов ред (стандарт за чат UX-ове).
 * - Disabled state-ове докато върви заявка или ако чатът не е наличен.
 *
 * Защо useRef за textarea?
 * За да можем програматично да четем scrollHeight и да задаваме height.
 * Auto-resize не може да се направи само с CSS - трябва JS защото
 * textarea-ите имат фиксирана височина по дефолт.
 */

import { useRef, useState } from 'react'

interface ChatInputProps {
  onSend: (question: string) => void
  isLoading: boolean
  disabled?: boolean
  placeholder?: string
}

const MIN_HEIGHT = 44 // px - 1 ред
const MAX_HEIGHT = 160 // px - около 6 реда

export function ChatInput({
  onSend,
  isLoading,
  disabled = false,
  placeholder,
}: ChatInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isDisabled = disabled || isLoading
  const canSend = text.trim().length > 0 && !isDisabled

  /**
   * Auto-resize logic-ата:
   * 1. Първо resetваме височината до 'auto' - иначе scrollHeight ще е равен
   *    на текущата височина и няма да можем да я СВИЕМ когато потребителят трие.
   * 2. После взимаме scrollHeight (реалната височина на текста).
   * 3. Клампваме между MIN_HEIGHT и MAX_HEIGHT.
   */
  const adjustHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.min(Math.max(el.scrollHeight, MIN_HEIGHT), MAX_HEIGHT)
    el.style.height = `${newHeight}px`
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    adjustHeight()
  }

  const submit = () => {
    if (!canSend) return
    onSend(text.trim())
    setText('')
    // Връщаме textarea-та към 1 ред след изпращане
    if (textareaRef.current) {
      textareaRef.current.style.height = `${MIN_HEIGHT}px`
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submit()
  }

  /**
   * Enter без Shift -> изпрати.
   * Shift+Enter -> позволи нов ред (default textarea behaviour).
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 bg-white pt-3 pb-1 px-1"
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder={
            placeholder ||
            (isDisabled
              ? 'Чатът не е наличен в момента'
              : 'Задай въпрос... (Enter за изпращане, Shift+Enter за нов ред)')
          }
          rows={1}
          style={{ height: `${MIN_HEIGHT}px` }}
          className="flex-1 resize-none px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm leading-relaxed"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center justify-center min-w-[80px]"
        >
          {isLoading ? (
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
              <span
                className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </span>
          ) : (
            'Изпрати'
          )}
        </button>
      </div>
    </form>
  )
}
