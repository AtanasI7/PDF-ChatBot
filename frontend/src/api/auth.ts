/**
 * API функции за authentication.
 *
 * Endpoints от dj-rest-auth (виж backend urls.py):
 * - POST /api/auth/login/             - email + password -> JWT tokens + user
 * - POST /api/auth/registration/      - регистрация + auto-login
 * - POST /api/auth/logout/            - blacklist на refresh token
 * - GET  /api/auth/user/              - детайли за текущия потребител
 * - POST /api/auth/token/refresh/     - подновяване на access token (ползва се
 *                                       автоматично от axios interceptor-а)
 *
 * Функциите тук са тънка обвивка над axios. Не държат state - state-ът
 * за логнатия потребител е в AuthContext (виж context/AuthContext.tsx).
 *
 * Грешките не се hand-led тук - бубват нагоре с обвивката Promise.reject().
 * Викащите компоненти ги хващат с try/catch и показват подходящ UI.
 */

import { api } from '../lib/axios'
import type { AuthUser, LoginResponse } from '../types/api'

export async function loginApi(email: string, password: string) {
	const { data } = await api.post<LoginResponse>('/api/auth/login/', {
		email,
		password,
	})
	return data
}

export interface RegisterInput {
	email: string
	username: string
	password1: string
	password2: string
}

export async function registerApi(input: RegisterInput) {
	const { data } = await api.post<LoginResponse>(
		'/api/auth/registration/',
		input
	)
	return data
}

export async function logoutApi() {
	// dj-rest-auth logout - blacklist на refresh token-а
	const refresh = localStorage.getItem('refresh_token')
	try {
		await api.post('/api/auth/logout/', refresh ? { refresh } : {})
	} catch {
		// Дори да гръмне на сървъра - не блокираме UI logout
	}
}

export async function fetchCurrentUser() {
	const { data } = await api.get<AuthUser>('/api/auth/user/')
	return data
}
