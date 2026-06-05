import { useState } from "react"
import Login from "@/components/auth/Login"
import SignUp from "@/components/auth/Signup"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AuthProps {
  onLoginSuccess: () => void;
}

const Auth = ({ onLoginSuccess }: AuthProps) => {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-sm px-2">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="signup">Signup</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Login onLoginSuccess={onLoginSuccess} />
      </TabsContent>
      <TabsContent value="signup">
        <SignUp onRegisterSuccess={() => setActiveTab("login")} />
      </TabsContent>
    </Tabs>
  );
};

export default Auth;