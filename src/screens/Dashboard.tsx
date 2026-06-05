import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/api";

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const handleLogoutClick = () => {
    logoutUser();
    onLogout();
  };
  return (
    <div>
      <h1>Dashboard</h1>
      <Button onClick={handleLogoutClick}>Logout</Button>
    </div>
  )
}

export default Dashboard