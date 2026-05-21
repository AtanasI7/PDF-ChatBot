/**
 * AuthContext - глобален state за authentication.
 *
 * Какво държи:
 * - текущ потребител (`user`)
 * - дали се зарежда от localStorage (`isLoading`)
 * - функции за login / logout
 *
 * Защо Context (а не Zustand, Redux, и т.н.)?
 * Защото state-ът е малък (само user обект) и не се променя често.
 * Context-ите имат един недостатък - всеки consumer re-renderва при
 * промяна на value-то. За малък state като нашия това не е проблем.
 *
 * Защо НЕ ползваме React Query за auth state?
 * Auth state е "client state" (живее в localStorage), а React Query
 * е за "server state" (живее на сървъра). Context е по-подходящ.
 * Но fetchCurrentUser() в api/auth.ts може да се ползва с React Query
 * за освежаване на user обекта от сървъра.
 *
 * Persistance:
 * При login - записваме access token, refresh token и user в localStorage.
 * При app load - четем ги обратно (useEffect със []) и възстановяваме state-а.
 * При logout - изтриваме всичко.
 *
 * Security note:
 * localStorage е уязвим към XSS атаки. За production app по-сигурен подход
 * е httpOnly cookies (изисква backend конфигурация). За learning - OK.
 */

import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from 'react'
import type { AuthUser } from '../types/api'

interface AuthContextValue {
	user: AuthUser | null
	isLoading: boolean
	login: (access: string, refresh: string, user: AuthUser) => void
	logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USER_KEY = 'user'
const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	// При зареждане на app-а проверяваме дали имаме запазен потребител
	useEffect(() => {
		const stored = localStorage.getItem(USER_KEY)
		const access = localStorage.getItem(ACCESS_KEY)
		if (stored && access) {
			try {
				setUser(JSON.parse(stored))
			} catch {
				localStorage.removeItem(USER_KEY)
			}
		}
		setIsLoading(false)
	}, [])

	const login = (access: string, refresh: string, user: AuthUser) => {
		localStorage.setItem(ACCESS_KEY, access)
		localStorage.setItem(REFRESH_KEY, refresh)
		localStorage.setItem(USER_KEY, JSON.stringify(user))
		setUser(user)
	}

	const logout = () => {
		localStorage.removeItem(ACCESS_KEY)
		localStorage.removeItem(REFRESH_KEY)
		localStorage.removeItem(USER_KEY)
		setUser(null)
	}

	return (
		<AuthContext.Provider value={{ user, isLoading, login, logout }}>
			{children}
		</AuthContext.Provider>
	)
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
	const ctx = useContext(AuthContext)
	if (!ctx) {
		throw new Error('useAuth трябва да се вика вътре в <AuthProvider>')
	}
	return ctx
}
