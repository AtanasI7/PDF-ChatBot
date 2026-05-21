/**
 * DocumentsPage - главната страница след login.
 *
 * Отговорности:
 * 1. Зарежда списъка с документи (useDocuments).
 * 2. Качване на нов документ (DocumentUpload компонент).
 * 3. Изтриване с потвърждение (ConfirmDialog).
 * 4. Бутон "Чат" - засега само показва съобщение, във Фаза 3 ще навигира.
 *
 * Notice: тук НЕ ползваме useState за списъка с документи. React Query го
 * държи в своя кеш. Това е голяма промяна спрямо "класическия" React.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useDeleteDocument,
  useDocuments,
  useGetOrCreateChat,
} from '../hooks/useDocuments'
import { DocumentUpload } from '../components/DocumentUpload'
import { DocumentCard } from '../components/DocumentCard'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { DocumentListItem } from '../types/api'

export function DocumentsPage() {
  const navigate = useNavigate()

  // useQuery hook - връща { data, isLoading, isError, error, refetch, ... }
  // Тук deconstruction-ваме само нужните полета.
  const { data, isLoading, isError, error } = useDocuments()

  const deleteMutation = useDeleteDocument()
  const chatMutation = useGetOrCreateChat()

  // Локален state само за UI: кой документ е избран за изтриване.
  // Това НЕ е "server state" - не отива в React Query.
  const [toDelete, setToDelete] = useState<DocumentListItem | null>(null)

  const handleDelete = (doc: DocumentListItem) => {
    setToDelete(doc)
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await deleteMutation.mutateAsync(toDelete.id)
      setToDelete(null)
    } catch {
      // Грешката се показва в card-а или може да добавим toast notification
      // в по-късна фаза. За сега - просто оставяме dialog-а отворен.
    }
  }

  const handleOpenChat = async (doc: DocumentListItem) => {
    try {
      const { chat_id } = await chatMutation.mutateAsync(doc.id)
      // Phase 3: тук ще навигираме към /chats/:id страницата
      navigate(`/chats/${chat_id}`)
    } catch {
      alert('Грешка при отваряне на чата. Опитай пак.')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Моите документи</h1>
        <p className="text-sm text-gray-600 mt-1">
          Качи PDF и задавай въпроси върху съдържанието му.
        </p>
      </div>

      {/* Upload форма */}
      <DocumentUpload />

      {/* Списък с документи - три възможни състояния */}
      {isLoading && (
        <div className="text-center text-gray-500 py-8">
          Зареждане на документите...
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Грешка при зареждане: {error?.message || 'Неизвестна грешка'}
        </div>
      )}

      {data && data.results.length === 0 && (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500">
            Все още нямаш качени документи. Качи първия си PDF по-горе.
          </p>
        </div>
      )}

      {data && data.results.length > 0 && (
        <div className="space-y-3">
          {data.results.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDelete={handleDelete}
              onOpenChat={handleOpenChat}
              isDeletingId={
                deleteMutation.isPending ? deleteMutation.variables : null
              }
            />
          ))}
        </div>
      )}

      {/* Confirm dialog за изтриване */}
      <ConfirmDialog
        isOpen={toDelete !== null}
        title="Изтрий документа?"
        message={
          toDelete
            ? `Сигурен ли си, че искаш да изтриеш "${toDelete.title}"? Всички чатове и съобщения, свързани с него, ще бъдат изгубени.`
            : ''
        }
        confirmLabel="Изтрий"
        cancelLabel="Отказ"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
