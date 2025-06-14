// import '@wooorm/starry-night/style/both.css'
import 'github-markdown-css/github-markdown.css'
import { Copy2Clipboard } from '@/components/copy-2-clipboard'
import { cn } from '@/lib/utils'
import { common } from '@wooorm/starry-night'
import tsx from '@wooorm/starry-night/source.tsx'
import { Check } from 'lucide-react'
import { createRef, memo } from 'react'
import { MarkdownHooks } from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStarryNight from 'rehype-starry-night' // 使用 rehype-starry-night 插件
import remarkGfm from 'remark-gfm'
import { CopyIcon } from '../icons'

const remarkPlugins = [remarkGfm]

const rehypePlugins = [
  rehypeSanitize,
  () => rehypeStarryNight({ grammars: [...common, tsx], allowMissingScopes: true }),
]

const NonMemoizedMarkdown = ({
  children,
  inline,
  className: propClassName,
}: { children: string; inline?: boolean; className?: string }) => {
  if (inline) return <pre>{children}</pre>

  return (
    <div className={cn('markdown-body', propClassName)}>
      <MarkdownHooks
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={{
          pre: ({ children: c, node, className, ...props }) => {
            const ref = createRef<HTMLPreElement>()
            const code = node?.children[0] as any
            let language = 'text'
            if (code?.properties?.className) {
              const codeClassName = code.properties.className.find((v: string) => /language-(\w+)/.exec(v))
              const match = /language-(\w+)/.exec(codeClassName || '')
              language = match ? match[1] : 'text'
            }

            return (
              <pre
                {...props}
                ref={ref}
                className={cn(
                  className,
                  'border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 my-4 overflow-x-auto',
                )}
              >
                <span className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {language && <span>{language}</span>}
                  <Copy2Clipboard
                    className="flex items-center gap-1 cursor-default"
                    text={() => {
                      if (!ref.current) return ''
                      return ref.current.querySelector('code')?.textContent || ''
                    }}
                  >
                    {(copied) => (
                      <>
                        {copied ? <Check size={14} /> : <CopyIcon size={14} />}
                        复制
                      </>
                    )}
                  </Copy2Clipboard>
                </span>
                {c}
              </pre>
            )
          },
        }}
      >
        {children}
      </MarkdownHooks>
    </div>
  )
}

export const Markdown = memo(NonMemoizedMarkdown, (prevProps, nextProps) => {
  if (prevProps.children !== nextProps.children) return false
  if (prevProps.className !== nextProps.className) return false
  if (prevProps.inline !== nextProps.inline) return false
  return true
})
