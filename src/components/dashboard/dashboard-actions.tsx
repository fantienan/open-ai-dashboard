import { Button, ButtonProps } from '@/components/ui/button'

import { Copy2Clipboard } from '@/components/copy-2-clipboard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useArtifact } from '@/hooks/use-artifact'
import { ChevronDown, CircleCheck, Download, Gauge, Link, UserLock, Users } from 'lucide-react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useChatbar } from '../chat/chat-provider'

type Option = {
  key: string
  label: string
  icon: React.ReactNode
  show?: boolean
  action: ButtonProps['onClick']
  renderItem?: (params: { option: Option; node: React.ReactNode }) => React.ReactNode
}

type ShareOption = {
  label: string
  icon: React.ReactNode
  value: 'public' | 'private'
  description: string
}

const shareOptions: ShareOption[] = [
  { label: '公开', description: '知道该链接的任何人都可以访问', icon: <Users className="size-3" />, value: 'public' },
  { label: '私密', description: '只有您可以查看', icon: <UserLock className="size-3" />, value: 'private' },
]

const ShareContent = ({ title, shareUrl }: { title: string; shareUrl?: string }) => {
  const [shareType, setShareType] = useState<'public' | 'private'>('private')
  const shareInfo = useMemo(() => shareOptions.find((item) => item.value === shareType)!, [shareType])
  const urlRef = useRef<HTMLDivElement>(null)

  const selectText = () => {
    if (urlRef.current) {
      const range = document.createRange()
      range.selectNodeContents(urlRef.current)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }

  useEffect(() => {
    selectText()
  }, [])
  return (
    <>
      <h1 className="font-medium leading-none">共享'{title}'</h1>
      <div className="flex items-center justify-between border-gray-300 border rounded-full p-1 ps-4 gap-2">
        <div ref={urlRef} onClick={selectText} className="relative overflow-hidden whitespace-nowrap flex-1">
          {shareUrl ?? 'https://www.baidu.com'}
          <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-r from-transparent to-background pointer-events-none" />
        </div>

        <Copy2Clipboard className="flex items-center gap-1 cursor-default" text={shareUrl ?? 'ssss'}>
          {(copied) => (
            <Button size="sm" disabled={copied} className="rounded-full">
              {copied ? '已复制' : '复制链接'}
            </Button>
          )}
        </Copy2Clipboard>
      </div>
      <div className="flex gap-2 items-center justify-between">
        <p className="text-sm text-muted-foreground">{shareInfo.description}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              {shareInfo.icon}
              {shareInfo.label}
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {shareOptions.map((option) => (
              <DropdownMenuItem key={option.value} onSelect={() => setShareType(option.value)} className="gap-2">
                <div>
                  <div>{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
                {shareType === option.value && (
                  <DropdownMenuShortcut>
                    <CircleCheck className="text-primary" />
                  </DropdownMenuShortcut>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

const PureDashboardActions = ({
  chatId,
  messageId,
  showDownload,
  showPreview,
  showShare,
  type,
  title,
}: {
  chatId: string
  messageId: string
  showShare?: boolean
  showPreview?: boolean
  showDownload?: boolean
  type?: 'label-icon' | 'icon'
  title?: string
}) => {
  const { onDownloadCode } = useChatbar()
  const { setArtifact } = useArtifact()

  if (!showDownload && !showPreview && !showShare) return null
  const options: Option[] = [
    {
      key: 'share-link',
      label: '共享链接',
      icon: <Link />,
      show: showShare,
      action: () => {},
      renderItem: ({ node }) => {
        return (
          <Popover>
            <PopoverTrigger asChild>{node}</PopoverTrigger>
            <PopoverContent side="bottom" align="end" sideOffset={8} className="w-110 gap-3 flex flex-col">
              <ShareContent title={title ?? ''} />
            </PopoverContent>
          </Popover>
        )
      },
    },
    {
      key: 'preview',
      label: '预览',
      icon: <Gauge />,
      show: showPreview,
      action: (event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        setArtifact({
          kind: 'dashboard',
          title: '仪表盘',
          isVisible: true,
          status: 'idle',
          boundingBox: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
          paramater: { chatId, messageId },
        })
      },
    },
    {
      key: 'download',
      label: '下载',
      show: showDownload,
      icon: <Download />,
      action: async () => {
        const download = onDownloadCode({ chatId, messageId })
        toast.promise(download, {
          loading: '下载...',
          success: () => '下载成功！',
          error: (e) => (e instanceof Error ? e.message : typeof e === 'string' ? e : '下载失败'),
        })
      },
    },
  ]

  const render = (option: Option) => {
    if (!option.show) return null
    if (type === 'label-icon') {
      const node = (
        <Button className="gap-1" data-testid={option.key} onClick={option.action}>
          {option.icon}
          <span className="ml-1">{option.label}</span>
        </Button>
      )
      return option.renderItem?.({ option, node }) ?? node
    }
    return (
      <Tooltip key={option.key}>
        <TooltipTrigger asChild>
          <Button data-testid={option.key} variant="ghost" size="icon" onClick={option.action}>
            {option.icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{option.label}</TooltipContent>
      </Tooltip>
    )
  }

  return <div className="flex gap-1 justify-end">{options.map(render)}</div>
}

export const DashboardActions = memo(PureDashboardActions, (prevProps, nextProps) => {
  if (prevProps.chatId !== nextProps.chatId) return false
  if (prevProps.messageId !== nextProps.messageId) return false
  if (prevProps.showDownload !== nextProps.showDownload) return false
  if (prevProps.showPreview !== nextProps.showPreview) return false
  if (prevProps.showShare !== nextProps.showShare) return false
  if (prevProps.type !== nextProps.type) return false

  return true
})
