import { Button, ButtonProps } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { WEB_SERVER_ROOT_PATH } from '@/lib/constant'
import { useAppStore } from '@/stores'
import { User } from '@/types'
import { fetcher } from '@/utils/fetcher'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useCountdown } from 'usehooks-ts'
import { z } from 'zod'

const formSchema = z.object({
  email: z.string().nonempty({ message: '邮箱不能为空' }).email({ message: '请输入有效的邮箱地址' }),
  code: z.string().nonempty({ message: '验证码不能为空' }).length(6, { message: '验证码长度应为6位' }),
})

type FormSchema = z.infer<typeof formSchema>

const CountdownButton = ({
  onClick,
  children,
  disabled,
  ...buttonProps
}: Omit<ButtonProps, 'onClick'> & {
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => Promise<void>
}) => {
  const [count, { startCountdown, stopCountdown, resetCountdown }] = useCountdown({ countStart: 60 })
  const [isCounting, setIsCounting] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isCounting && count === 0) {
      setIsCounting(false)
      resetCountdown()
    }
  }, [count])

  useEffect(() => {
    return () => {
      stopCountdown()
    }
  }, [])

  return (
    <Button
      {...buttonProps}
      disabled={disabled || isCounting || loading}
      onClick={async (e) => {
        setLoading(true)
        await onClick(e)
          .catch((err) => {
            setLoading(true)
            return Promise.reject(err)
          })
          .finally(() => {
            setLoading(false)
          })
        setIsCounting(true)
        startCountdown()
      }}
    >
      {loading ? <Loader2 className="animate-spin" /> : isCounting ? `${count}秒后重发` : children}
    </Button>
  )
}

export default function LoginPage() {
  const form = useForm<FormSchema>({
    mode: 'onBlur',
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      code: '',
    },
  })

  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const setUserInfo = useAppStore().setUserInfo

  const onSubmit = async (data: FormSchema) => {
    try {
      setLoading(true)
      const res = await fetcher<User>(`${WEB_SERVER_ROOT_PATH}/login`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (!res.success || !res.data) {
        toast.error('登录失败: ' + res.message)
        return
      }
      setUserInfo(res.data)
      navigate('/chat', { replace: true })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const sendVerificationCode = async () => {
    const email = form.getValues('email')

    // 验证邮箱格式
    if (!email || !z.string().email().safeParse(email).success) {
      form.setError('email', { message: '请输入有效的邮箱地址' })
      return Promise.reject()
    }

    const res = await fetcher(`${WEB_SERVER_ROOT_PATH}/email/send_code`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    })

    if (res.success) {
      toast.success('验证码已发送，请注意查收')
    } else {
      toast.error('验证码发送失败:' + res.message)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="flex gap-2 items-center mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Ai Dashboard
        </h1>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">嗨！我是Ai Dashboard</CardTitle>
          <CardDescription className="text-center">智绘AI可视化GIS平台</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="请输入您的邮箱地址" type="email" className="h-12 text-base px-4" {...field} />
                    </FormControl>
                    <FormMessage isToast />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex space-x-3">
                      <FormControl>
                        <Input placeholder="请输入6位验证码" maxLength={6} className="h-12 text-base px-4" {...field} />
                      </FormControl>
                      <CountdownButton
                        type="button"
                        className="h-12 text-base px-4 min-w-36"
                        onClick={sendVerificationCode}
                      >
                        获取验证码
                      </CountdownButton>
                    </div>
                    <FormMessage isToast />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12 text-base font-medium mt-4 rounded-[36px]">
                {loading ? <Loader2 className="animate-spin" /> : '登录'}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              登录即表示您同意我们的
              <a href="/privacy-policy" className="text-primary hover:underline mx-1">
                隐私策略
              </a>
              和
              <a href="/terms-of-service" className="text-primary hover:underline mx-1">
                服务条款
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
