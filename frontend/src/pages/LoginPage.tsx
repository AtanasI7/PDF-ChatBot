/**
 * LoginPage - публична страница за вход в приложението.
 *
 * Pattern-и, които ползваме тук:
 *
 * 1. react-hook-form + zod:
 *    Schema-та (zod) описва формата на данните и правилата за валидация.
 *    zodResolver "превежда" zod грешките към react-hook-form формат.
 *    Така валидацията е декларативна и type-safe (FormValues се извежда
 *    автоматично от schema-та чрез z.infer).
 *
 * 2. "Return to original URL" pattern:
 *    Ако потребителят е дошъл тук през ProtectedRoute (опитал да отвори
 *    защитена страница без login), в `location.state.from` имаме оригиналния
 *    URL. След login го връщаме там, вместо на dashboard-а.
 *
 * 3. Server error handling:
 *    Backend-ът може да върне грешки в няколко формата
 *    (`{detail: "..."}` или `{non_field_errors: [...]}` или
 *    `{email: [...]}`). Опитваме всеки по ред.
 *
 * 4. isSubmitting от react-hook-form:
 *    Автоматично се вдига на true докато `onSubmit` Promise-ът не resolve-не.
 *    Ползваме го за да деактивираме бутона.
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import { loginApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'

const schema = z.object({
  email: z.string().email('Невалиден email адрес'),
  password: z.string().min(1, 'Паролата е задължителна'),
})

type FormValues = z.infer<typeof schema>

interface LocationState {
  from?: { pathname: string }
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from?.pathname || '/'
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: FormValues) => {
    setServerError(null)
    try {
      const result = await loginApi(data.email, data.password)
      login(result.access, result.refresh, result.user)
      navigate(from, { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data
        const msg =
          data?.detail ||
          data?.non_field_errors?.[0] ||
          data?.email?.[0] ||
          data?.password?.[0] ||
          'Грешен email или парола'
        setServerError(msg)
      } else {
        setServerError('Неочаквана грешка. Опитай пак.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Влез в профила си</h1>
        <p className="text-sm text-gray-500 mb-6">
          Качвай и чати с твоите PDF документи.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Парола
            </label>
            <input
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Зареждане...' : 'Влез'}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-600 text-center">
          Нямаш профил?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Регистрирай се
          </Link>
        </p>
      </div>
    </div>
  )
}
