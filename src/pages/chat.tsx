import { Chatbar } from '@/components/chat/chat-bar'
import { useChatbarLoader } from '@/hooks/use-chatbar-loader'
import { useAppStore } from '@/stores'
import { useNavigate, useParams } from 'react-router'

export default function Page() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppStore().dispatch
  const navigate = useNavigate()
  const { error, ...chatbarLoaderData } = useChatbarLoader({ chatId: id })

  //   if (error) return <Navigate replace to="/chat" />

  return (
    <Chatbar
      showFooter
      {...chatbarLoaderData}
      onDeleteChat={({ chatId }) => chatbarLoaderData.id === chatId && navigate('/chat')}
      onNewChat={() => navigate(`/chat`, { replace: true })}
      onOpenHistoryChat={({ chatId }) => navigate(`/chat/${chatId}`, { replace: true })}
      onSignOut={() => {
        navigate('/login', { replace: true })
        dispatch({ session: { user: undefined } })
      }}
      onCreateChat={async ({ chatId }) => {
        navigate(`/chat/${chatId}`, { replace: true })
      }}
    />
  )
}
