import Layout, { layoutLoader } from '@/layout'
import MapPage from '@/pages/map'
import { Link, RouterProvider, createBrowserRouter, useRouteError } from 'react-router'
import { Toaster } from 'sonner'
import { SWRConfig } from 'swr'

function RootErrorBoundary() {
  let error = useRouteError() as Error
  return (
    <div>
      <h1>Uh oh, something went terribly wrong 😩</h1>
      <pre>{error.message || JSON.stringify(error)}</pre>
      <button onClick={() => (window.location.href = '/')}>Click here to reload the app</button>
    </div>
  )
}

function NoMatch() {
  return (
    <div>
      <h1>404 未找到</h1>
      <p>抱歉，您要查找的页面不存在</p>
      <Link to="/">单击此处重新加载应用程序</Link>
    </div>
  )
}
const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <RootErrorBoundary />,
    Component: Layout,
    loader: layoutLoader,
    children: [
      { path: 'map', element: <MapPage /> },
      {
        path: 'chat',
        lazy: async () => ({ Component: (await import('@/pages/chat')).default }),
      },
      {
        path: 'chat/:id',
        lazy: async () => ({ Component: (await import('@/pages/chat')).default }),
      },
    ],
  },
  {
    path: '/login',
    lazy: async () => ({ Component: (await import('@/pages/login')).default }),
  },
  {
    path: '*',
    element: <NoMatch />,
  },
])

if (import.meta.hot) {
  import.meta.hot.dispose(() => router.dispose())
}

export const createRouter = () => (
  <SWRConfig
    value={{
      provider: () => new Map(),
      // fetcher: (i, ii) => {
      //   return fetcher(i, ii)
      // },
    }}
  >
    <RouterProvider router={router} />
    <Toaster position="top-center" />
  </SWRConfig>
)
