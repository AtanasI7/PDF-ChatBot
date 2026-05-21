/**
 * MessageBubble - визуализация на едно съобщение в чата.
 *
 * Дизайн решения:
 * - User съобщения: дясно подравнени, синя бубла, бял текст, без markdown.
 * - Assistant съобщения: ляво, бяла бубла, markdown rendering, citations отдолу.
 * - Max-width 85% за да не се "разтягат" буфтите на пълна ширина.
 *
 * Във Фаза 4: добавихме onCitationClick prop, който се предава към Citations.
 * Така когато потребителят кликне chip, PDF viewer-ът отдясно скача към
 * страницата. Това е "state lifting" pattern - state-ът за currentPage
 * стои в ChatPage и се подава надолу.
 */

import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '../types/api'
import { Citations } from './Citations'

interface MessageBubbleProps {
  message: Message
  /**
   * Callback за клик върху citation chip. Ако липсва - чиповете не са
   * кликабелни (например ако нямаме PDF viewer на страницата).
   */
  onCitationClick?: (page: number) => void
}

/**
 * Custom компоненти за всеки markdown element.
 * react-markdown ги ползва вместо default-ите.
 */
const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="list-disc list-outside ml-5 mb-2 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-5 mb-2 space-y-0.5">
      {children}
    </ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline hover:text-blue-700"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.startsWith('language-')
    if (isBlock) {
      return <code className={`${className} text-sm`}>{children}</code>
    }
    return (
      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto text-sm mb-2 font-mono">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-700 mb-2">
      {children}
    </blockquote>
  ),
  h1: ({ children }) => (
    <h1 className="text-xl font-bold mb-2 mt-1">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold mb-2 mt-1">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-bold mb-2 mt-1">{children}</h3>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="my-3 border-gray-200" />,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-2">
      <table className="border-collapse border border-gray-300 text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-gray-300 px-2 py-1 bg-gray-50 font-semibold text-left">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-300 px-2 py-1">{children}</td>
  ),
}

export function MessageBubble({ message, onCitationClick }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <>
            <div className="text-sm leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            {message.metadata?.citations &&
              message.metadata.citations.length > 0 && (
                <Citations
                  citations={message.metadata.citations}
                  onCitationClick={onCitationClick}
                />
              )}
          </>
        )}
      </div>
    </div>
  )
}
