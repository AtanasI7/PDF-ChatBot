/**
 * DocumentUpload - форма за качване на нов PDF.
 *
 * Защо тук НЕ ползваме react-hook-form?
 * Защото имаме файл (File обект), който не се валидира с обикновени правила,
 * и формата е много малка (2 полета). За такива случаи useState е по-прост
 * и по-малко boilerplate. RHF блести при големи форми с много правила.
 *
 * Pattern-ите тук:
 * - Auto-fill title от името на файла при избор.
 * - Drag-and-drop + класически file input - и двете работят.
 * - useMutation от React Query, който държи loading/error state-а.
 */

import { useRef, useState } from 'react'
import axios from 'axios'
import { useUploadDocument } from '../hooks/useDocuments'

export function DocumentUpload() {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // useRef ни дава достъп до DOM input-а, за да можем програматично да го
  // отворим при click върху drop зоната.
  const inputRef = useRef<HTMLInputElement>(null)

  // React Query mutation - връща .mutateAsync() (Promise) и isPending.
  const uploadMutation = useUploadDocument()

  /**
   * Обработва избор/drop на файл.
   * - Проверява дали е PDF.
   * - Auto-fill-ва title от името на файла, ако е празен.
   */
  const handleFile = (selectedFile: File) => {
    setError(null)

    if (selectedFile.type !== 'application/pdf') {
      setError('Файлът трябва да е PDF.')
      return
    }

    // Backend-ът има 20MB лимит (виж DATA_UPLOAD_MAX_MEMORY_SIZE в settings.py)
    const MAX_SIZE = 20 * 1024 * 1024
    if (selectedFile.size > MAX_SIZE) {
      setError('Файлът е твърде голям (макс. 20MB).')
      return
    }

    setFile(selectedFile)

    // Auto-fill title ако още няма зададен такъв
    if (!title) {
      const filename = selectedFile.name.replace(/\.pdf$/i, '')
      setTitle(filename)
    }
  }

  /**
   * Submit на формата.
   *
   * mutateAsync хвърля грешка при failure - ползваме try/catch да я хванем
   * и да я покажем в UI-то.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!file) {
      setError('Моля избери PDF файл.')
      return
    }
    if (!title.trim()) {
      setError('Моля въведи заглавие.')
      return
    }

    try {
      await uploadMutation.mutateAsync({ title: title.trim(), file })
      // При успех - чистим формата
      setTitle('')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data
        setError(
          data?.detail ||
            data?.file?.[0] ||
            data?.title?.[0] ||
            'Грешка при качване на документа.'
        )
      } else {
        setError('Неочаквана грешка.')
      }
    }
  }

  /**
   * Drag-and-drop handlers.
   *
   * preventDefault() в onDragOver е КРИТИЧНО - без него browser-ът отказва
   * да позволи drop изобщо (default behaviour е "не позволявай drop").
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFile(droppedFile)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-2xl p-6 mb-6"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Качи нов документ
      </h2>

      {/* Drop zone - кликва се за file dialog, или drag-and-drop */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
          className="hidden"
        />

        {file ? (
          <p className="text-sm text-gray-700">
            <strong>{file.name}</strong> ({(file.size / 1024 / 1024).toFixed(2)}{' '}
            MB)
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-700 font-medium mb-1">
              Влачи PDF файл тук или кликни за избор
            </p>
            <p className="text-xs text-gray-500">Максимум 20MB</p>
          </>
        )}
      </div>

      {/* Title input - показва се само след като има избран файл */}
      {file && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Заглавие
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="напр. Договор 2026"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null)
              setTitle('')
              setError(null)
              if (inputRef.current) inputRef.current.value = ''
            }}
            disabled={uploadMutation.isPending}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Откажи
          </button>
        )}
        <button
          type="submit"
          disabled={!file || uploadMutation.isPending}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
        >
          {uploadMutation.isPending ? 'Качва се...' : 'Качи и индексирай'}
        </button>
      </div>
    </form>
  )
}
