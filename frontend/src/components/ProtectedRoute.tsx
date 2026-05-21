/**
 * ProtectedRoute - route guard за защита на страници, изискващи login.
 *
 * Принципът:
 * Това е "layout route" компонент - в App.tsx се ползва без `path` атрибут.
 * Когато react-router иска да render-ва някоя от вложените routes, той
 * първо render-ва този компонент. Ние решаваме:
 * - Ако още зареждаме auth state (от localStorage) -> показваме spinner.
 * - Ако няма user -> redirect към /login (със запомнен оригинален URL).
 * - Иначе -> <Outlet /> render-ва child route-а (Documents, Chat и т.н.).
 *
 * Какво е <Outlet />?
 * Това е placeholder от react-router, на който мястото се render-ват
 * вложените routes. Все едно `{children}` в обикновен компонент.
 *
 * Защо state={{ from: location }}?
 * За да можем след login да върнем потребителя там, където искаше да
 * отиде първоначално. Например ако някой влезе на /chats/5 без да е
 * логнат, го пращаме на /login с from=/chats/5, и LoginPage след
 * успешен login го връща обратно на /chats/5.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  // Първоначално зареждане - четем localStorage в AuthContext.useEffect.
  // Без този check би имало "flash" - за момент потребителят би видял
  // login screen-а преди да заредим неговия запазен профил.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Зарежда...</div>
      </div>
    )
  }

  // Няма логнат потребител - редирект към login. `replace: true` (чрез
  // Navigate replace prop) означава "не добавяй в browser history",
  // така че бутонът "Назад" не връща към защитена страница.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Имаме потребител - render-ваме вложения route (Documents, Chat и т.н.)
  return <Outlet />
}
