
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Book, BarChart, BookOpen, Home, LogOut, User } from "lucide-react";
import { useState } from "react";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-card border-r border-border shadow-sm transition-all duration-300 flex flex-col h-screen sticky top-0`}
    >
      <div className={`p-4 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && <h1 className="font-bold text-xl text-primary">SelfSight</h1>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-full"
        >
          {collapsed ? "→" : "←"}
        </Button>
      </div>

      <Separator />

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <NavItem
            icon={<Home size={20} />}
            label="Dashboard"
            path="/"
            collapsed={collapsed}
          />
          <NavItem
            icon={<Book size={20} />}
            label="Journal"
            path="/journal"
            collapsed={collapsed}
          />
          <NavItem
            icon={<BarChart size={20} />}
            label="Insights"
            path="/insights"
            collapsed={collapsed}
          />
          <NavItem
            icon={<BookOpen size={20} />}
            label="Resources"
            path="/resources"
            collapsed={collapsed}
          />
          <NavItem
            icon={<User size={20} />}
            label="Profile"
            path="/profile"
            collapsed={collapsed}
          />
        </ul>
      </nav>

      <div className="p-4">
        <Button
          variant="ghost"
          className={`w-full justify-${collapsed ? "center" : "start"} text-muted-foreground hover:text-foreground`}
          onClick={handleLogout}
        >
          <LogOut size={20} className="mr-2" />
          {!collapsed && "Log Out"}
        </Button>
      </div>

      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="text-sm">
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  collapsed: boolean;
}

const NavItem = ({ icon, label, path, collapsed }: NavItemProps) => {
  const navigate = useNavigate();
  const isActive = window.location.pathname === path;

  return (
    <li>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={`w-full justify-${collapsed ? "center" : "start"} ${
          isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={() => navigate(path)}
      >
        <span className={collapsed ? "" : "mr-2"}>{icon}</span>
        {!collapsed && label}
      </Button>
    </li>
  );
};

export default Sidebar;
