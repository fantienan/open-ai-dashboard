import { AppSidebar } from '@/components/app-sidebar'
import { Chat, ChatProps } from '@/components/chat'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { SidebarInset, SidebarProvider, type SidebarProviderProps } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import classNames from 'classnames'
import { ChatbarProvider, ChatbarProviderProps } from './chat-provider'

export type ChatbarProps = ChatProps &
  Pick<SidebarProviderProps, 'className' | 'defaultOpen' | 'showFooter'> &
  ChatbarProviderProps & {
    resizeable?: boolean
  }

export const Chatbar = ({
  className,
  showFooter,
  defaultOpen,
  id,
  initialMessages,
  isReadonly,
  resizeable,
  ...chatbarProviderProps
}: ChatbarProps) => {
  return (
    <ChatbarProvider chatId={id} {...chatbarProviderProps}>
      <SidebarProvider
        style={resizeable ? ({ '--sidebar-width': '100%' } as React.CSSProperties) : undefined}
        showFooter={showFooter}
        defaultOpen={defaultOpen}
        className={cn(className)}
      >
        {!resizeable ? (
          <>
            <AppSidebar />
            <SidebarInset>
              <Chat initialMessages={initialMessages} isReadonly={isReadonly} id={id} key={id} />
            </SidebarInset>
          </>
        ) : (
          <ResizablePanelGroup direction="horizontal" id={id}>
            <ResizablePanel className="min-w-[256px]" defaultSize={15} order={1}>
              <AppSidebar className={classNames({ relative: resizeable })} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel order={2} className="min-w-[50%]">
              <SidebarInset>
                <Chat initialMessages={initialMessages} isReadonly={isReadonly} id={id} key={id} />
              </SidebarInset>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </SidebarProvider>
    </ChatbarProvider>
  )
}
