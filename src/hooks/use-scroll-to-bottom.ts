import { UseChatHelpers } from '@ai-sdk/react'
import { type RefObject, useEffect, useRef } from 'react'

export function useScrollToBottom<T extends HTMLElement>({
  status,
}: Pick<UseChatHelpers, 'status'>): [RefObject<T | null>, RefObject<T | null>] {
  const containerRef = useRef<T>(null)
  const endRef = useRef<T>(null)
  const isScrolledThroughRef = useRef(false)
  const isMouseleaveRef = useRef(false)

  useEffect(() => {
    const container = containerRef.current
    const end = endRef.current

    if (container && end) {
      const observer = new MutationObserver(() => {
        if (isMouseleaveRef.current || isScrolledThroughRef.current) return
        end.scrollIntoView({ behavior: 'instant', block: 'end' })
      })

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      })
      const onWheel = () => {
        isScrolledThroughRef.current = true
      }
      const onMouseleave = () => {
        isMouseleaveRef.current = true
        container.addEventListener('mouseout', onMouseout)
      }
      const onMouseout = () => {
        isMouseleaveRef.current = false
        container.removeEventListener('mouseout', onMouseout)
      }
      container.addEventListener('wheel', onWheel)
      container.addEventListener('mouseleave', onMouseleave)
      return () => {
        observer.disconnect()
        isScrolledThroughRef.current = false
        isMouseleaveRef.current = false
        container.removeEventListener('wheel', onWheel)
        container.removeEventListener('mouseleave', onMouseleave)
        container.removeEventListener('mouseout', onMouseout)
      }
    }
  }, [status === 'streaming'])

  return [containerRef, endRef]
}
