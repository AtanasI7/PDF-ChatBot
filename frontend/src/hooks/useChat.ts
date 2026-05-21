/**
 * React Query hooks за чат функционалността.
 *
 * Note: за разлика от useDocuments, тук НЯМАМЕ polling. Чатът е "request-response"
 * взаимодействие - няма background промени, които да опресняваме автоматично.
 * Единственото нещо, което invalidate-ва кеша на съобщенията, е успешен askQuestion.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { askQuestion, getChat, listMessages } from '../api/chats'

/**
 * Централизирани query keys (виж обяснението в useDocuments.ts).
 *
 * Йерархията тук е важна:
 * - ['chats']            => всички chat-related queries
 * - ['chats', id]        => детайли за един чат
 * - ['chats', id, 'messages'] => съобщенията на този чат
 *
 * Това позволява "scope-вани" invalidations. Например може да направим
 * invalidateQueries(['chats', 5]) и това ще invalidate-не И chat-а И
 * съобщенията му, понеже и двете имат ['chats', 5, ...] като prefix.
 */
export const chatKeys = {
  all: ['chats'] as const,
  detail: (id: number) => ['chats', id] as const,
  messages: (id: number) => ['chats', id, 'messages'] as const,
}

/**
 * Зарежда детайли за чат.
 *
 * `enabled` опцията спира query-то да тръгва, ако chatId е невалидно
 * (NaN при грешен URL). Без това React Query би пуснал заявка с NaN
 * и backend-ът би върнал 404.
 */
export function useChat(chatId: number) {
  return useQuery({
    queryKey: chatKeys.detail(chatId),
    queryFn: () => getChat(chatId),
    enabled: !isNaN(chatId) && chatId > 0,
  })
}

/**
 * Зарежда съобщенията на чат.
 */
export function useMessages(chatId: number) {
  return useQuery({
    queryKey: chatKeys.messages(chatId),
    queryFn: () => listMessages(chatId),
    enabled: !isNaN(chatId) && chatId > 0,
  })
}

/**
 * Mutation за задаване на въпрос.
 *
 * onSuccess инвалидира кеша на съобщенията, което triggerва refetch.
 * Refetch-ът връща съобщенията с РЕАЛНИТЕ id-та от DB (а не временни),
 * което гарантира че по-късно изтриване/редакция работят правилно.
 */
export function useAskQuestion(chatId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (question: string) => askQuestion(chatId, question),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(chatId),
      })
    },
  })
}
