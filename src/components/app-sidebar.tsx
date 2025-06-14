import { PlusIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, useSidebar } from '@/components/ui/sidebar'
import classNames from 'classnames'
import { Bolt } from 'lucide-react'
import { useChatbar } from './chat/chat-provider'
import { SidebarHistory } from './sidebar-history'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export function AppSidebar({ className }: { className?: string }) {
  const { setOpenMobile } = useSidebar()
  const { onNewChat: contextOnNewChat, onChatSetting } = useChatbar()

  const onNewChat = () => {
    setOpenMobile(false)
    contextOnNewChat?.()
  }

  return (
    <Sidebar className={classNames('group-data-[side=left]:border-r-0', className)}>
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <div onClick={onNewChat} className="flex flex-row gap-3 items-center">
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">Ai Dashboard</span>
            </div>
            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" type="button" className="p-2 h-fit" onClick={onNewChat}>
                    <PlusIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end">新聊天</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onChatSetting?.({ visible: true })}>
                    <Bolt />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end">设置</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory />
      </SidebarContent>
    </Sidebar>
  )
}
