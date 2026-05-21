/**
 * DashboardPage - DEPRECATED / неизползван.
 *
 * Този компонент беше създаден във Фаза 1 като placeholder за главната
 * страница след login. Във Фаза 2 беше заместен от DocumentsPage, която
 * показва списъка с PDF документи на потребителя.
 *
 * Файлът се пази за reference (за случай че по-късно искаме отделна
 * dashboard / overview страница). Може да бъде изтрит безопасно.
 *
 * Виж: src/pages/DocumentsPage.tsx - текущата home страница.
 */

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logoutApi } from '../api/auth'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logoutApi()
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">PDF ChatBot</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Изход
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Здравей, {user?.username}!
          </h2>
          <p className="text-gray-600">
            Авторизацията работи. Списъкът с документи и чатът ще дойдат във Фаза 2 и Фаза 3.
          </p>
        </div>
      </main>
    </div>
  )
}
