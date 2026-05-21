/**
 * App.tsx - root компонент на приложението.
 *
 * Структура на routes:
 *
 * /login                      - публична (login форма)
 * /register                   - публична (registration форма)
 * /                           - защитена, показва DocumentsPage (списък PDF-и)
 * /chats/:id                  - защитена, показва ChatPage (чат с конкретен PDF)
 *
 * Йерархия на provider-ите (отвън навътре):
 * QueryClientProvider -> AuthProvider -> BrowserRouter -> Routes
 *
 * Защо този ред: По-долните в дървото могат да ползват по-горните.
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { ChatPage } from './pages/ChatPage'
import { queryClient } from './lib/queryClient'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Публични маршрути - без header, без auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Защитени маршрути - изискват логнат потребител и имат Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DocumentsPage />} />
                <Route path="/chats/:id" element={<ChatPage />} />
              </Route>
            </Route>

            {/* Catch-all: непознат URL -> редирект към home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      {/* Devtools само за development - в production build-а не се включват */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
