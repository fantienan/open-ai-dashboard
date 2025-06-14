import { useState } from 'react'
import { useCopyToClipboard, useTimeout } from 'usehooks-ts'

export type Copy2ClipboardProps = {
  text: string | (() => string)
  onCopy?: (text: string, result: boolean) => void
  children?: (copied?: boolean) => React.ReactNode
  className?: string
}

export const Copy2Clipboard = ({ className, children, text, onCopy }: Copy2ClipboardProps) => {
  const [copied, setCopied] = useState(false)
  const [, copy] = useCopyToClipboard()

  const handleCopy = async () => {
    if (copied) return
    const value = typeof text === 'function' ? text() : text
    const res = await copy(value)
    setCopied(res)
    onCopy?.(value, res)
  }
  useTimeout(
    () => {
      setCopied(false)
    },
    copied ? 2000 : null,
  )
  return (
    <div onClick={() => handleCopy()} className={className}>
      {children?.(copied) ?? null}
    </div>
  )
}
