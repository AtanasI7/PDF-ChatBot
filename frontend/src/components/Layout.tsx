/**
 * Layout компонент - споделен "chrome" около всички защитени страници.
 *
 * Какво е "layout route" в react-router:
 * Това е компонент, който се render-ва около деца. <Outlet /> е placeholder,
 * където react-router инжектира activната child страница.
 *
 * Като сложиш Layout около routes в App.tsx, header-ът се показва на всички
 * защитени страници без да трябва да го импортираш на всяка страница.
 */

import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logoutApi } from '../api/auth'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    // Първо казваме на сървъра да blacklist-не refresh token-а...
    await logoutApi()
    // ...после чистим localStorage и Context state-а.
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
          >
            PDF ChatBot
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Изход
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* <Outlet /> е мястото, където react-router инжектира текущата страница */}
        <Outlet />
      </main>
    </div>
  )
}
