import { CrossIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCcw } from 'lucide-react'
import { memo, useState } from 'react'
import { Separator } from '../ui/separator'
import { useChatbar } from './chat-provider'

const PureChatSetting = () => {
  const { onSignOut, onChatSetting, chatSettingVisible, user } = useChatbar()
  const [loadingDetectionVersion, setLoadingDetectionVersion] = useState(false)

  return (
    <AnimatePresence>
      {chatSettingVisible && (
        <motion.div
          className="flex flex-col gap-1 absolute top-0 left-0 w-full h-full bg-background"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.2 } }}
        >
          <div className="flex items-center justify-between border-b  dark:border-zinc-700 p-4">
            <div className="">
              <h1 className="leading-none font-semibold">设置</h1>
              <div className="text-muted-foreground text-sm mt-1">所有设置项</div>
            </div>
            <Button
              data-testid="chat-setting-close-button"
              variant="outline"
              size="icon"
              className="dark:hover:bg-zinc-700"
              onClick={() => onChatSetting?.({ visible: false })}
            >
              <CrossIcon size={18} />
            </Button>
          </div>
          <div className="p-4 flex-1 gap-4 flex flex-col overflow-auto">
            <Card className="py-4">
              <CardContent className="px-4 flex items-center justify-between">
                <div className="font-semibold text-sm">当前版本</div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setLoadingDetectionVersion((p) => !p)
                  }}
                >
                  <RefreshCcw
                    className={classNames({ 'animate-spin [animation-direction:reverse]': loadingDetectionVersion })}
                  />
                  检测版本
                </Button>
              </CardContent>
            </Card>
            <Card className="py-4">
              <CardContent className="px-4 flex items-center justify-between">
                <div className="font-semibold text-sm">默认对话模型</div>
                <Select value="cmr">
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="请选择对话模型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>deepseek</SelectLabel>
                      <SelectItem value="cmr">chat-model-reasoning</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="gap-0 py-4">
              <CardContent className="px-4">
                <div>
                  <div className="font-semibold text-sm">用户名</div>
                  {!!user && <div className="text-muted-foreground text-xs">{user.email}</div>}
                </div>
                <div></div>
              </CardContent>
              <Separator className="my-4" />
              <CardContent className="px-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-sm">退出登录</div>
                  {!!user && <div className="text-muted-foreground text-xs">当前用户: {user.email}</div>}
                </div>
                <Button variant="destructive" onClick={onSignOut}>
                  退出登录
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const ChatSetting = memo(PureChatSetting, () => {
  return true
})
