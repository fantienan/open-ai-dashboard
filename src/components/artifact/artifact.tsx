import { useSidebar } from '@/components/ui/sidebar'
import { useArtifact } from '@/hooks/use-artifact'
import { useIsMobile } from '@/hooks/use-mobile'
import { Vote } from '@/types'
import { UseChatHelpers } from '@ai-sdk/react'
import { Attachment, UIMessage } from 'ai'
import equal from 'fast-deep-equal'
import { AnimatePresence, motion } from 'framer-motion'
import { memo } from 'react'
import { useWindowSize } from 'usehooks-ts'
import { Dashboard } from '../dashboard'
import { MultimodalInput } from '../multimodal-input'
import { ArtifactCloseButton } from './artifact-close-button'
import { ArtifactMessages } from './artifact-messages'

const panelWidth = 420

export type UIArtifact = {
  title: string
  kind: string
  isVisible: boolean
  status: 'streaming' | 'idle'
  boundingBox: {
    top: number
    left: number
    width: number
    height: number
  }
} & (
  | {
      kind: 'dashboard'
      paramater: {
        chatId: string
        messageId: string
      }
    }
  | {
      kind: 'document'
      paramater: {
        documentId: string
      }
    }
  | {
      kind: 'text'
    }
)

function PureArtifact({
  chatId,
  input,
  setInput,
  handleSubmit,
  status,
  stop,
  attachments,
  setAttachments,
  append,
  messages,
  setMessages,
  reload,
  votes,
  isReadonly,
}: {
  chatId: string
  input: string
  setInput: UseChatHelpers['setInput']
  status: UseChatHelpers['status']
  stop: UseChatHelpers['stop']
  attachments: Array<Attachment>
  setAttachments: React.Dispatch<React.SetStateAction<Array<Attachment>>>
  messages: Array<UIMessage>
  setMessages: UseChatHelpers['setMessages']
  votes: Array<Vote> | undefined
  append: UseChatHelpers['append']
  handleSubmit: UseChatHelpers['handleSubmit']
  reload: UseChatHelpers['reload']
  isReadonly: boolean
}) {
  const { artifact } = useArtifact()
  const { width: windowWidth, height: windowHeight } = useWindowSize()
  const isMobile = useIsMobile()
  const { open: isSidebarOpen } = useSidebar()
  return (
    <AnimatePresence>
      {artifact.isVisible && (
        <motion.div
          data-testid="artifact"
          className="flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.4 } }}
        >
          {!isMobile && (
            <motion.div
              className="fixed bg-background h-dvh"
              initial={{
                width: isSidebarOpen ? windowWidth - 256 : windowWidth,
                right: 0,
              }}
              animate={{ width: windowWidth, right: 0 }}
              exit={{
                width: isSidebarOpen ? windowWidth - 256 : windowWidth,
                right: 0,
              }}
            />
          )}

          {!isMobile && (
            <div style={{ width: panelWidth }}>
              <motion.div
                className="relative w-full bg-muted dark:bg-background h-dvh shrink-0"
                initial={{ opacity: 0, x: 10, scale: 1 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                  transition: {
                    delay: 0.2,
                    type: 'spring',
                    stiffness: 200,
                    damping: 30,
                  },
                }}
                exit={{
                  opacity: 0,
                  x: 0,
                  scale: 1,
                  transition: { duration: 0 },
                }}
              >
                <div className="flex flex-col h-full justify-between items-center gap-4">
                  <ArtifactMessages
                    chatId={chatId}
                    status={status}
                    votes={votes}
                    messages={messages}
                    setMessages={setMessages}
                    reload={reload}
                    isReadonly={isReadonly}
                    artifactStatus={artifact.status}
                    stop={stop}
                  />

                  <form className="flex flex-row gap-2 relative items-end w-full px-4 pb-4">
                    <MultimodalInput
                      chatId={chatId}
                      input={input}
                      setInput={setInput}
                      handleSubmit={handleSubmit}
                      status={status}
                      stop={stop}
                      attachments={attachments}
                      setAttachments={setAttachments}
                      messages={messages}
                      append={append}
                      className="bg-background dark:bg-muted"
                      setMessages={setMessages}
                    />
                  </form>
                </div>
              </motion.div>
            </div>
          )}

          <motion.div
            className="fixed dark:bg-muted bg-background h-dvh flex flex-col overflow-y-auto md:border-l dark:border-zinc-700 border-zinc-200"
            initial={
              isMobile
                ? {
                    opacity: 1,
                    x: artifact.boundingBox.left,
                    y: artifact.boundingBox.top,
                    height: artifact.boundingBox.height,
                    width: artifact.boundingBox.width,
                    borderRadius: 50,
                  }
                : {
                    opacity: 1,
                    x: artifact.boundingBox.left,
                    y: artifact.boundingBox.top,
                    height: artifact.boundingBox.height,
                    width: artifact.boundingBox.width,
                    borderRadius: 50,
                  }
            }
            animate={
              isMobile
                ? {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth ? windowWidth : 'calc(100dvw)',
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: 'spring',
                      stiffness: 200,
                      damping: 30,
                      duration: 1000,
                    },
                  }
                : {
                    opacity: 1,
                    x: panelWidth,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth ? windowWidth - panelWidth : `calc(100dvw - ${panelWidth}px)`,
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: 'spring',
                      stiffness: 200,
                      damping: 30,
                      duration: 1000,
                    },
                  }
            }
            exit={{
              opacity: 0,
              scale: 0.5,
              transition: {
                delay: 0.1,
                type: 'spring',
                stiffness: 600,
                damping: 30,
              },
            }}
          >
            {artifact.kind === 'dashboard' && (
              <Dashboard {...artifact.paramater} prefixNode={<ArtifactCloseButton />} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const Artifact = memo(PureArtifact, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false
  if (!equal(prevProps.votes, nextProps.votes)) return false
  if (prevProps.input !== nextProps.input) return false
  if (!equal(prevProps.messages, nextProps.messages.length)) return false
  return true
})
