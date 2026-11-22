import { create } from 'zustand'
import { Icon } from './Icon'

const useToast = create<{ text: string | null }>(() => ({ text: null }))
let timer: ReturnType<typeof setTimeout> | undefined

export function toast(text: string, ms = 4500) {
  useToast.setState({ text })
  clearTimeout(timer)
  timer = setTimeout(() => useToast.setState({ text: null }), ms)
}

export function ToastHost() {
  const text = useToast((s) => s.text)
  if (!text) return null
  return (
    <button className="toast" onClick={() => useToast.setState({ text: null })}>
      <span className="ibox" style={{ width: 28, height: 28, borderRadius: 9 }}><Icon n="check" size="xs" /></span>
      <span className="grow" style={{ textAlign: 'left' }}>{text}</span>
    </button>
  )
}
