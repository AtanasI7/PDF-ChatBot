/**
 * Global TanStack Query (React Query) клиент.
 *
 * QueryClient-ът е "мозъкът" на React Query - той държи:
 * - кеша с всички заявени данни (key -> value)
 * - конфигурацията за refetching, retry, stale time
 * - mutation history-то
 *
 * Един единствен QueryClient инстанс се ползва от цялото приложение,
 * подаден чрез <QueryClientProvider> в App.tsx.
 *
 * Защо отделен файл (не inline в App.tsx)?
 * 1. По-чисто - конфигурацията е в едно ясно място.
 * 2. Достъпен от utility функции (напр. за programmatic invalidation
 *    извън React дървото).
 * 3. По-лесен за тестване (mocking).
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * staleTime: колко време данните се считат за "пресни".
       *
       * Докато са пресни, React Query НЕ refetch-ва автоматично, дори при:
       * - re-mount на компонент
       * - повторно ползване на същия queryKey
       *
       * Default-ът на React Query е 0 (всичко винаги е stale). За learning
       * app-а ползваме 1 минута - balance между свежест и производителност.
       */
      staleTime: 1000 * 60,

      /**
       * retry: брой опити при неуспешна заявка.
       *
       * Default-ът е 3, което е добре за production (мрежови glitch-ове),
       * но дразнещо в dev (изчакваш 3 опита преди да видиш грешката).
       */
      retry: 1,

      /**
       * refetchOnWindowFocus: автоматичен refetch при връщане на tab-а.
       *
       * Default-ът е true - идеално за "живи" data (Twitter feed, etc).
       * За нашия app малко е досадно - изключваме.
       *
       * Note: специфични queries (напр. съобщенията в чат) могат да го
       * override-нат при нужда.
       */
      refetchOnWindowFocus: false,
    },
  },
})
