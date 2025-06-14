import { useChatVisibility } from '@/hooks/use-chat-visibility'
import { Chat } from '@/types'
import { memo } from 'react'
import { useChatbar } from './chat/chat-provider'
import { CheckCircleFillIcon, GlobeIcon, LockIcon, MoreHorizontalIcon, ShareIcon, TrashIcon } from './icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from './ui/sidebar'

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat
  isActive: boolean
  onDelete: (chatId: string) => void
  setOpenMobile: (open: boolean) => void
}) => {
  const { onOpenHistoryChat } = useChatbar()
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibility: chat.visibility,
  })

  const historyChat = () => {
    setOpenMobile(false)
    onOpenHistoryChat?.({ chatId: chat.id })
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton className="overflow-hidden" isActive={isActive} onClick={historyChat}>
        <div className="truncate">{chat.title}</div>
      </SidebarMenuButton>
      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer flex-row justify-between">
              <div className="flex flex-row gap-2 items-center">
                <ShareIcon />
                <span>分享</span>
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => setVisibilityType('private')}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <LockIcon size={12} />
                    <span>私有</span>
                  </div>
                  {visibilityType === 'private' ? <CheckCircleFillIcon /> : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => setVisibilityType('public')}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <GlobeIcon />
                    <span>公有</span>
                  </div>
                  {visibilityType === 'public' ? <CheckCircleFillIcon /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => onDelete(chat.id)}
          >
            <TrashIcon />
            <span>删除</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false
  return true
})
