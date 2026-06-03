import Auth from "./screens/Auth"
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <Auth />
      <Toaster />
    </div>
  )
}

export default App
