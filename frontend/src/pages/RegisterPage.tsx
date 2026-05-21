/**
 * RegisterPage - публична страница за регистрация.
 *
 * Особености спрямо LoginPage:
 *
 * 1. Cross-field валидация (потвърждение на паролата):
 *    z.object({...}).refine((data) => data.password1 === data.password2, ...)
 *    .refine() позволява валидация, която засяга НЯКОЛКО полета едновременно.
 *    `path: ['password2']` казва къде да се покаже грешката в UI-то.
 *
 * 2. Auto-login след успешна регистрация:
 *    dj-rest-auth registration endpoint-ът автоматично връща JWT tokens
 *    (защото USE_JWT=True в settings.py). Логваме потребителя веднага,
 *    без да го караме повторно през login screen.
 *
 * 3. Username полето:
 *    Backend-ът има `ACCOUNT_USERNAME_REQUIRED = True` и
 *    `REQUIRED_FIELDS = ["username"]` в User model-а. Затова го изпращаме.
 *
 * 4. Two password fields:
 *    dj-rest-auth очаква `password1` и `password2` (стандарт от Django
 *    UserCreationForm). Това е по-добра UX от едно поле с visibility toggle.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import { registerApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'

const schema = z
  .object({
    email: z.string().email('Невалиден email адрес'),
    username: z
      .string()
      .min(3, 'Потребителското име трябва да е поне 3 символа')
      .max(150, 'Прекалено дълго'),
    password1: z.string().min(8, 'Паролата трябва да е поне 8 символа'),
    password2: z.string(),
  })
  .refine((data) => data.password1 === data.password2, {
    message: 'Паролите не съвпадат',
    path: ['password2'],
  })

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', username: '', password1: '', password2: '' },
  })

  const onSubmit = async (data: FormValues) => {
    setServerError(null)
    try {
      const result = await registerApi(data)
      login(result.access, result.refresh, result.user)
      navigate('/', { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data
        // dj-rest-auth връща грешки като { email: [...], username: [...] }
        const firstFieldError =
          errorData?.email?.[0] ||
          errorData?.username?.[0] ||
          errorData?.password1?.[0] ||
          errorData?.password2?.[0] ||
          errorData?.non_field_errors?.[0] ||
          errorData?.detail
        setServerError(firstFieldError || 'Регистрацията не успя')
      } else {
        setServerError('Неочаквана грешка. Опитай пак.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Създай нов профил
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Регистрирай се за да започнеш да чатиш с PDF-и.
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
              Потребителско име
            </label>
            <input
              type="text"
              autoComplete="username"
              {...register('username')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Парола
            </label>
            <input
              type="password"
              autoComplete="new-password"
              {...register('password1')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password1 && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password1.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Повтори паролата
            </label>
            <input
              type="password"
              autoComplete="new-password"
              {...register('password2')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password2 && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password2.message}
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
            {isSubmitting ? 'Зареждане...' : 'Регистрирай се'}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-600 text-center">
          Вече имаш профил?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Влез
          </Link>
        </p>
      </div>
    </div>
  )
}
