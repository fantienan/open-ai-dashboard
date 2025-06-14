import { Markdown } from '@/components/markdown'
import { AnimatePresence, motion } from 'framer-motion'
import { memo } from 'react'

interface CodeBlockProps {
  className?: string
  children: string
}

export function PureCodeBlock(props: CodeBlockProps) {
  return (
    <AnimatePresence>
      {}
      <motion.div animate={{ opacity: 1 }} initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { delay: 0.4 } }}>
        <Markdown {...props} />
      </motion.div>
    </AnimatePresence>
  )
}

export const CodeBlock = memo(PureCodeBlock, (prevProps, nextProps) => {
  if (prevProps.className !== nextProps.className) return false
  if (prevProps.children !== nextProps.children) return false

  return true
})
