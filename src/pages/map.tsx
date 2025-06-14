import { Chatbar } from '@/components/chat/chat-bar'
import { Map } from '@/components/map-ui'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useChatbarLoader } from '@/hooks/use-chatbar-loader'
import { useAppStore } from '@/stores'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { X } from 'lucide-react'
import { Bot } from 'lucide-react'

export default function Page() {
  const currentChatId = useAppStore().currentChatId
  const setCurrentChatId = useAppStore().setCurrentChatId
  const { error, ...chatbarLoaderData } = useChatbarLoader({ chatId: currentChatId })
  const setMap = useAppStore().setMap

  return (
    <div className="flex min-h-svh w-full">
      <Map dispatch={({ map }) => setMap(map)} />
      <Drawer direction="right" modal={false}>
        <DrawerTrigger asChild>
          <Button variant="secondary" size="icon" className="absolute bottom-10 right-10 rounded-full shadow-md">
            <Bot className="h-5 w-5" />
          </Button>
        </DrawerTrigger>
        <DrawerContent
          className="overflow-hidden  outline-none data-[vaul-drawer-direction=right]:sm:max-w-[30vw]"
          style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}
        >
          <VisuallyHidden>
            <DrawerTitle>聊天</DrawerTitle>
            <DrawerDescription>聊天</DrawerDescription>
          </VisuallyHidden>
          <Chatbar
            defaultOpen={false}
            onDeleteChat={({ chatId }) => currentChatId === chatId && setCurrentChatId('')}
            onNewChat={() => setCurrentChatId('')}
            onOpenHistoryChat={({ chatId }) => setCurrentChatId(chatId)}
            {...chatbarLoaderData}
          />
          <DrawerClose asChild>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 rounded-full shadow-md hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
