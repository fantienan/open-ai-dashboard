import { UseChatHelpers } from '@ai-sdk/react'
import { motion } from 'framer-motion'
import { memo } from 'react'
import { Button } from './ui/button'

interface SuggestedActionsProps {
  chatId: string
  append: UseChatHelpers['append']
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: '销售量最高的前5个产品',
      label: '查看销售排行榜',
      action: '使用数据分析工具分析销售量最高的前5个产品',
    },
    {
      title: 'Dashboard',
      label: '据数据库中的数据生成Dashboard',
      action: '请根据数据库中的数据生成Dashboard页面',
    },

    {
      title: '更新元数据表',
      label: '更新所有表的元数据信息',
      action: '请更新所有表的元数据信息',
    },
  ]

  return (
    <div data-testid="suggested-actions" className="grid sm:grid-cols-2 gap-2 w-full">
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`)

              append({
                role: 'user',
                content: suggestedAction.action,
              })
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">{suggestedAction.label}</span>
          </Button>
        </motion.div>
      ))}
    </div>
  )
}

export const SuggestedActions = memo(PureSuggestedActions, () => true)
