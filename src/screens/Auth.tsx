import Login from "@/components/auth/Login"
import SignUp from "@/components/auth/Signup"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const Auth = () => {

  return (
    <Tabs defaultValue="login" className="w-100">
      <TabsList>
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="signup">Signup</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Login />
      </TabsContent>
      <TabsContent value="signup">
        <SignUp />
      </TabsContent>
    </Tabs>
  )
}

export default Auth