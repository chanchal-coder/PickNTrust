"use client"

import React from "react"
import { createPortal } from "react-dom"

// Global overlay that replaces native browser title tooltips across the app.
// Detects any element with a `title` attribute on hover, removes it to suppress
// the native tooltip, and shows a styled tooltip near the cursor.
export default function GlobalTitleTooltip() {
  const [visible, setVisible] = React.useState(false)
  const [text, setText] = React.useState<string>("")
  const [pos, setPos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const currentElRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX + 12, y: e.clientY + 12 })
    }

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const el = target?.closest?.('[title]') as HTMLElement | null
      if (!el) return

      const t = el.getAttribute('title') || ''
      if (!t.trim()) return

      // Remove native tooltip and store original in dataset
      el.dataset.originalTitle = t
      el.removeAttribute('title')

      currentElRef.current = el
      setText(t)
      setVisible(true)
    }

    const onMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null
      // If leaving the element that had the title, restore it and hide
      const el = currentElRef.current
      if (el && (!related || !el.contains(related))) {
        if (el.dataset.originalTitle) {
          // Restore the attribute to keep semantics when not hovered
          el.setAttribute('title', el.dataset.originalTitle)
          delete el.dataset.originalTitle
        }
        currentElRef.current = null
        setVisible(false)
        setText("")
      }
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('mouseover', onMouseOver)
    window.addEventListener('mouseout', onMouseOut)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseover', onMouseOver)
      window.removeEventListener('mouseout', onMouseOut)
    }
  }, [])

  if (!visible || !text) return null

  const node = (
    <div
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999 }}
      className={
        [
          // Match TooltipContent visual style
          'pointer-events-none relative overflow-hidden rounded-xl bg-white/95 dark:bg-neutral-900/90 px-4 py-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 shadow-2xl border border-neutral-200/60 dark:border-neutral-800/60 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/5',
          'animate-in fade-in-0 zoom-in-95 duration-150',
        ].join(' ')
      }
    >
      {/* Decorative gradient accent */}
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      {text}
    </div>
  )

  return createPortal(node, document.body)
}