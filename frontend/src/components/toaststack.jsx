import { CheckCircle2, XCircle, Info } from 'lucide-react'

const ICONS = { success: CheckCircle2, error: XCircle, info: Info }

export default function ToastStack({ toasts }) {
  if (!toasts.length) return null
  return (
    <div className="toast-stack">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info
        return (
          <div key={t.id} className={`toast ${t.type}`}>
            <Icon size={16} />
            {t.message}
          </div>
        )
      })}
    </div>
  )
}