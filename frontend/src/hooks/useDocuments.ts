/**
 * React Query hooks за документи.
 *
 * Това е "server state" слоят. Тук компонентите вземат данни от сървъра,
 * без да се занимават с loading/error/cache логиката - тя е в React Query.
 *
 * Основни концепции:
 * - useQuery       => за ЧЕТЕНЕ (GET заявки), с автоматично кеширане
 * - useMutation    => за ПРОМЯНА (POST/PUT/DELETE), с callback при успех
 * - queryKey       => уникален идентификатор на cache записа (масив!)
 * - invalidateQueries => казваме на React Query "този cache е стар, refetch-ни"
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  deleteDocument,
  getOrCreateChat,
  listDocuments,
  uploadDocument,
  type UploadDocumentInput,
} from '../api/documents'

/**
 * queryKeys обектът е централизирано място за всичките query keys.
 *
 * Защо? Защото когато във useMutation викаме invalidateQueries(['documents']),
 * key-ът трябва ТОЧНО да съвпада с този в useQuery. Ако някъде пишеш
 * 'document' (без s) - кеша няма да се инвалидира и UI ще показва стари
 * данни. С този обект имаш autocomplete и не правиш typo-та.
 */
export const documentKeys = {
  all: ['documents'] as const,
  detail: (id: number) => ['documents', id] as const,
}

/**
 * Зарежда списъка с документи.
 *
 * refetchInterval е "trick"-ът, който поллва статуса:
 * - Ако нито един документ не е в "processing" - return false (без polling).
 * - Ако има поне един "processing" - return 3000 (refetch на всеки 3 секунди).
 *
 * Това спестява заявки - не поллваме безсмислено когато всичко е готово.
 */
export function useDocuments() {
  return useQuery({
    queryKey: documentKeys.all,
    queryFn: listDocuments,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return false
      const hasProcessing = data.results.some(
        (d) => d.status === 'processing'
      )
      return hasProcessing ? 3000 : false
    },
  })
}

/**
 * Mutation за качване на нов документ.
 *
 * useMutation НЕ извиква функцията автоматично (за разлика от useQuery).
 * Връща обект с .mutate() / .mutateAsync() - ти ги викаш ръчно (при submit).
 *
 * onSuccess се изпълнява след успешен upload и инвалидира кеша на списъка,
 * което кара useDocuments() автоматично да refetch-не и да покаже новия документ.
 */
export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UploadDocumentInput) => uploadDocument(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all })
    },
  })
}

/**
 * Mutation за изтриване на документ.
 *
 * След успешен delete инвалидираме списъка, за да изчезне UI-вно.
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all })
    },
  })
}

/**
 * Mutation за отваряне на чат към документ.
 * Ще го ползваме във Фаза 3 за бутона "Чат".
 */
export function useGetOrCreateChat() {
  return useMutation({
    mutationFn: (documentId: number) => getOrCreateChat(documentId),
  })
}
