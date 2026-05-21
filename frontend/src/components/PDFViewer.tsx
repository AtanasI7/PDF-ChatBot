/**
 * PDFViewer - визуализация на PDF документ с навигация и zoom.
 *
 * Built on top of react-pdf (което вътрешно ползва Mozilla pdf.js).
 *
 * Главни моменти:
 *
 * 1. Worker setup:
 *    pdf.js работи с Web Worker за рендериране без да блокира main thread-а.
 *    Vite разпознава import.meta.url pattern-а и автоматично bundleва
 *    worker файла, така че всичко работи offline.
 *
 * 2. CSS:
 *    AnnotationLayer.css и TextLayer.css трябва да са импортнати, за да
 *    работят links в PDF-а и selection на текст.
 *
 * 3. Responsive width:
 *    ResizeObserver следи container-а и динамично преизчислява width-а на
 *    Page компонента, така че PDF-ът винаги fit-ва.
 *
 * 4. Controlled vs uncontrolled current page:
 *    Тук държим currentPage като controlled prop, защото родителят
 *    (ChatPage) трябва да може да сменя страницата при клик върху citation.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Setup на pdf.js worker-а. Това трябва да стане ВЕДНЪЖ преди да се
// използва Document компонента.
//
// Защо CDN с `pdfjs.version`?
// react-pdf носи СОБСТВЕНА вътрешна версия на pdf.js (API-то). Ако ползваме
// worker-а от нашия node_modules/pdfjs-dist, може да получим версионен
// mismatch (грешка: "The API version X does not match the Worker version Y").
// Като ползваме `pdfjs.version`, винаги дърпаме worker файла, който ТОЧНО
// съвпада с API-то на react-pdf - без значение от локални версии.
//
// Downside: иска интернет връзка. За production бихме сложили worker-а в
// /public/ папката и пинвали версията ръчно.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  url: string
  currentPage: number
  onPageChange: (page: number) => void
}

const MIN_SCALE = 0.5
const MAX_SCALE = 2.5
const SCALE_STEP = 0.25

export function PDFViewer({ url, currentPage, onPageChange }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>(600)
  const [scale, setScale] = useState<number>(1.0)
  const [loadError, setLoadError] = useState<string | null>(null)

  /**
   * Измерване на container width-а с ResizeObserver.
   *
   * Защо не просто `window.addEventListener('resize', ...)?
   * - resize event-ите се триггват само при resize на window-а.
   * - Ако split panel-ите промененат размер (drag, sidebar toggle и т.н.),
   *   container-ът се променя без window да рестриграва.
   * ResizeObserver слухе за промени директно върху DOM елемента.
   */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateWidth = () => {
      if (el) {
        // -32px за padding и safety
        setContainerWidth(Math.max(el.offsetWidth - 32, 200))
      }
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  /**
   * Извиква се когато PDF-ът се зареди успешно.
   * react-pdf ни подава {numPages} и още метаданни.
   */
  const handleDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages)
      setLoadError(null)
      // Ако currentPage е извън range-а, корекция към valid стойност
      if (currentPage < 1) onPageChange(1)
      if (currentPage > numPages) onPageChange(numPages)
    },
    [currentPage, onPageChange]
  )

  const handleDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error)
    setLoadError(error.message || 'Грешка при зареждане на PDF-а')
  }, [])

  const goToPage = (page: number) => {
    if (numPages === null) return
    const clamped = Math.max(1, Math.min(page, numPages))
    onPageChange(clamped)
  }

  const zoomIn = () =>
    setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)))
  const zoomOut = () =>
    setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)))
  const resetZoom = () => setScale(1.0)

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
      {/* Toolbar: page nav + zoom */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white border-b border-gray-200 text-sm flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={!numPages || currentPage <= 1}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Предишна страница"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <input
            type="number"
            value={currentPage}
            min={1}
            max={numPages ?? undefined}
            onChange={(e) => {
              const val = Number(e.target.value)
              if (!isNaN(val)) goToPage(val)
            }}
            className="w-12 px-1 py-0.5 text-center border border-gray-300 rounded text-sm"
          />
          <span className="text-gray-500">/ {numPages ?? '...'}</span>

          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={!numPages || currentPage >= numPages}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Следваща страница"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
            title="Намали"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="px-2 py-1 text-xs rounded hover:bg-gray-100 transition-colors min-w-[44px]"
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
            title="Увеличи"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* PDF render area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-200 p-4 flex items-start justify-center"
      >
        {loadError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 max-w-md">
            <p className="font-medium mb-1">Грешка при зареждане на PDF-а</p>
            <p className="text-xs">{loadError}</p>
          </div>
        ) : (
          <Document
            file={url}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
            loading={
              <div className="text-center text-gray-500 py-12 text-sm">
                Зареждане на PDF...
              </div>
            }
            error={
              <div className="text-red-600 text-sm">
                Не може да се зареди PDF-ът.
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              width={containerWidth * scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              loading={
                <div className="text-center text-gray-500 py-12 text-sm">
                  Зареждане на страницата...
                </div>
              }
              className="shadow-lg bg-white"
            />
          </Document>
        )}
      </div>
    </div>
  )
}
