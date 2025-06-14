import { PlusIcon } from '@/components/icons'
import { SidebarToggle } from '@/components/sidebar-toggle'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { memo } from 'react'
import { useWindowSize } from 'usehooks-ts'
import { useChatbar } from './chat-provider'

function PureChatHeader() {
  const { open } = useSidebar()
  const { onNewChat } = useChatbar()
  const { width: windowWidth } = useWindowSize()

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={onNewChat}
            >
              <PlusIcon />
              <span className="md:sr-only">新聊天</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>新聊天</TooltipContent>
        </Tooltip>
      )}
    </header>
  )
}

export const ChatHeader = memo(PureChatHeader)
