# PDF ChatBot — Frontend

React 19 приложение, което позволява на потребителите да качват PDF документи и да задават въпроси върху съдържанието им чрез RAG (Retrieval-Augmented Generation).

## Stack

| Слой | Технология | Защо |
|---|---|---|
| Framework | **React 19** + **TypeScript** | Type safety + ecosystem |
| Build tool | **Vite 8** | Изключително бърз dev server и HMR |
| Styling | **Tailwind CSS v4** | Utility-first, бърз prototyping |
| Routing | **react-router v7** | De-facto стандарт за React routing |
| Server state | **TanStack Query** (React Query) | Cache, refetch, optimistic UI |
| Client state | **React Context** | За auth state (малък scope) |
| Forms | **react-hook-form** + **zod** | Performance + schema validation |
| HTTP client | **axios** | Interceptors за JWT refresh |
| Markdown | **react-markdown** + **remark-gfm** | За LLM отговорите |
| PDF viewer | **react-pdf** (PDF.js) | Side-by-side преглед |

## Структура на папките

```
frontend/
├── public/                 — статични файлове (favicon, и т.н.)
├── src/
│   ├── api/                — функции за HTTP заявки към backend-а
│   │   ├── auth.ts             — login, register, logout, refresh
│   │   ├── axios.ts            — DEPRECATED re-export
│   │   ├── chats.ts            — chats, messages, ask
│   │   └── documents.ts        — list, upload, delete, get-chat
│   │
│   ├── components/         — преизползваеми UI компоненти
│   │   ├── ChatInput.tsx       — input box с auto-resize, Enter to send
│   │   ├── Citations.tsx       — chips с номера на страници (clickable)
│   │   ├── ConfirmDialog.tsx   — модално потвърждение
│   │   ├── DocumentCard.tsx    — единичен документ в списъка
│   │   ├── DocumentUpload.tsx  — drag-and-drop форма за upload
│   │   ├── Layout.tsx          — header + outlet за authenticated routes
│   │   ├── MessageBubble.tsx   — съобщение в чата + markdown rendering
│   │   ├── PDFViewer.tsx       — react-pdf wrapper с navigation/zoom
│   │   ├── ProtectedRoute.tsx  — auth guard
│   │   └── StatusBadge.tsx     — цветен значoк за document status
│   │
│   ├── context/            — React Context providers
│   │   └── AuthContext.tsx     — глобален auth state
│   │
│   ├── hooks/              — custom React Query hooks
│   │   ├── useChat.ts          — useChat, useMessages, useAskQuestion
│   │   └── useDocuments.ts     — useDocuments, useUpload, useDelete
│   │
│   ├── lib/                — споделена инфраструктура
│   │   ├── axios.ts            — axios instance + JWT interceptors
│   │   ├── media.ts            — helper за пълни URL-и
│   │   └── queryClient.ts      — TanStack Query config
│   │
│   ├── pages/              — page компоненти (по един на route)
│   │   ├── ChatPage.tsx        — split-view: PDF + чат
│   │   ├── DashboardPage.tsx   — DEPRECATED, заместен от DocumentsPage
│   │   ├── DocumentsPage.tsx   — главна страница, списък PDF-и
│   │   ├── LoginPage.tsx       — вход
│   │   └── RegisterPage.tsx    — регистрация
│   │
│   ├── types/              — TypeScript типове
│   │   └── api.ts              — съответствие с Django serializers
│   │
│   ├── App.tsx             — root компонент: providers + routes
│   ├── App.css             — празен, стилове в index.css
│   ├── index.css           — глобална основа + Tailwind import
│   └── main.tsx            — Vite entry point
│
├── .env                    — environment variables (НЕ се commit-ва)
├── .env.example            — template
├── eslint.config.js        — ESLint правила
├── index.html              — HTML entry point
├── package.json            — dependencies + scripts
├── tsconfig.json           — TypeScript root config
├── tsconfig.app.json       — TS config за src/ (browser)
├── tsconfig.node.json      — TS config за vite.config.ts (node)
└── vite.config.ts          — Vite + plugins config
```

## Инсталация и стартиране

```bash
# Първоначално
cd frontend
cp .env.example .env       # после редактирай ако е нужно
npm install

# Development
npm run dev                # отваря на http://localhost:5173

# Build за production
npm run build              # output -> dist/

# Lint
npm run lint
```

**Изисквания:** Backend-ът трябва да върви на URL-а от `.env` (по default `http://localhost:8000`).

## Архитектурни pattern-и

### 1. Server state vs Client state

| Тип | Технология | Примери |
|---|---|---|
| Server state | **TanStack Query** | Списъци с документи, чатове, съобщения |
| Client state | **React Context + useState** | Логнат потребител, JWT tokens, UI state |

Server state живее на сървъра - кешираме копие при нас. Client state живее в браузъра.

### 2. Layered API access

```
Component (pages/, components/)
    ↓ ползва
Hook (hooks/useDocuments.ts)
    ↓ ползва
API function (api/documents.ts)
    ↓ ползва
axios instance (lib/axios.ts)
    ↓ ползва
Django REST API
```

Всеки слой има една отговорност:
- **API functions** - URL-и + типизация
- **Hooks** - caching, loading state, invalidation
- **Components** - UI и user interaction

### 3. JWT с автоматичен refresh

```
1. Request тръгва → interceptor закача Bearer <access_token>
2. Ако 401 → interceptor викa /api/auth/token/refresh/
3. Получаваме нов access token → retry original request
4. Ако refresh-ът фейлне → logout + redirect към /login
```

Цялата логика е в `src/lib/axios.ts`. Компонентите не знаят нищо за това.

### 4. Protected routes pattern

```tsx
<Route element={<ProtectedRoute />}>      {/* auth check */}
  <Route element={<Layout />}>            {/* header + main */}
    <Route path="/" element={<DocumentsPage />} />
    <Route path="/chats/:id" element={<ChatPage />} />
  </Route>
</Route>
```

Защитата + layout-ът се прилагат веднъж, automatic за всички вложени routes.

### 5. Optimistic UI в чата

Когато потребителят изпрати въпрос:
1. **Веднага** показваме user съобщението + thinking dots
2. **Във фон** заявката отива към backend (5-30 сек)
3. **Когато дойде** отговор - cache се invalidate-ва и refetch-ва, реалните съобщения от DB заместват временните

Потребителят НИКОГА не чака с празен екран.

## Environment variables

| Променлива | Default | Описание |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | URL на Django backend-а |

Само variables с префикс `VITE_` се експозват към client-side кода (security feature).

## Текущ статус по фази

- [x] **Фаза 0:** Scaffold + tooling (Tailwind, React Query, axios, react-router)
- [x] **Фаза 1:** Auth (login, register, logout, JWT с auto-refresh)
- [x] **Фаза 2:** Documents (списък, upload, delete, статус polling)
- [x] **Фаза 3:** Chat UI (markdown, citations, auto-scroll, optimistic UI)
- [x] **Фаза 4:** PDF preview side-by-side (react-pdf, citation navigation, zoom)
- [ ] **Фаза 5:** Polish (toasts, error boundaries, dark mode, mobile, тестове)

## Полезни команди

```bash
# Чисто инсталиране (ако нещо се счупи)
rm -rf node_modules package-lock.json
npm install

# Анализ на bundle size след build
npx vite-bundle-visualizer

# TypeScript check без билд
npx tsc --noEmit
```

## Известни ограничения

- **localStorage за JWT:** уязвимо към XSS. За production бихме ползвали httpOnly cookies.
- **Синхронен upload:** големи PDF-и блокират backend-а (виж backend TODO за Celery).
- **Без mobile support за PDF panel:** PDF viewer-ът е скрит на малки екрани. Phase 5 polish.
- **Без offline support:** няма Service Worker, всичко изисква интернет.
- **Pagination на съобщенията:** показваме само първите 20 (Phase 5 polish).
