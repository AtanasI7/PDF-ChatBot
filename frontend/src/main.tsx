/**
 * main.tsx - entry point на цялото React приложение.
 *
 * Това е първият JavaScript код, който се изпълнява, когато браузърът
 * зареди index.html. Vite автоматично инжектира <script type="module"
 * src="/src/main.tsx"> в HTML-а.
 *
 * Какво прави:
 * 1. Импортва глобалните стилове (index.css с Tailwind).
 * 2. Намира DOM елемента <div id="root"> в index.html.
 * 3. Render-ва App компонента вътре в него.
 * 4. Обвива всичко в <StrictMode> за по-добро откриване на проблеми.
 *
 * Какво е StrictMode?
 * Това е "режим за разработка". Той кара React да:
 * - Render-ва компонентите ДВА пъти (за откриване на side-effects).
 * - Логва deprecation warnings.
 * - Помага да хванеш проблеми, преди да отидат в production.
 * В production build (npm run build) ефектите на StrictMode изчезват
 * автоматично - няма performance penalty.
 *
 * Защо `document.getElementById('root')!` (с удивителна)?
 * TypeScript не знае със сигурност, че елементът съществува (getElementById
 * връща `HTMLElement | null`). Удивителната (non-null assertion) казва на
 * TS "довери ми се, не е null". В нашия случай това е безопасно, защото
 * index.html гарантира съществуването на <div id="root">.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
