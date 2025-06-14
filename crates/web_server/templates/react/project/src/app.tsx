import { SWRConfig } from 'swr'
import IndexPage from './pages'

function App() {
  return (
    <SWRConfig>
      <IndexPage />
    </SWRConfig>
  )
}

export default App
