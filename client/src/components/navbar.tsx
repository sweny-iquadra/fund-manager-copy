import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { tokenManager } from "@/lib/queryClient";
import {
  ChartLine,
  Home,
  Trophy,
  TrendingUp,
  Users,
  Menu,
  LogOut,
  Settings,
  User,
  Upload,
} from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { isSuperAdmin } = useSuperAdmin();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/home", icon: Home },
    { name: "Contests", href: "/contests", icon: Trophy },
    { name: "Portfolio", href: "/portfolio", icon: TrendingUp },
    { name: "Leaderboard", href: "/leaderboard", icon: Users },
    { name: "Account", href: "/account", icon: User },
    { name: "Upload Demo", href: "/upload-demo", icon: Upload },
    ...(isSuperAdmin
      ? [{ name: "Admin", href: "/admin/contest-requests", icon: Settings }]
      : []),
  ];

  const isActive = (href: string) => {
    return location === href;
  };

  const handleLogout = () => {
    tokenManager.clearTokens();
    window.location.href = "/";
  };

  const NavItems = ({ mobile = false }) => (
    <div className={`flex ${mobile ? "flex-col space-y-2" : "space-x-6"}`}>
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => mobile && setIsOpen(false)}
          >
            <Button
              variant={isActive(item.href) ? "default" : "ghost"}
              className={`${mobile ? "w-full justify-start" : ""} ${
                isActive(item.href)
                  ? "text-white"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {item.name}
            </Button>
          </Link>
        );
      })}
    </div>
  );

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo */}
          <div className="flex items-center min-w-0 flex-shrink-0">
            <Link href="/home">
              <div className="flex items-center cursor-pointer">
                <ChartLine className="h-8 w-8 text-primary mr-3" />
                <span className="text-xl font-bold text-primary">
                  FinanceFantasy
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-1 justify-center px-8">
            <NavItems />
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-6 min-w-0 flex-shrink-0">
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-sm text-right">
                <p className="font-medium text-gray-900">
                  {(user as any)?.firstName
                    ? `${(user as any).firstName} ${
                        (user as any).lastName || ""
                      }`.trim()
                    : (user as any)?.email}
                </p>
                <p className="text-gray-500">{(user as any)?.email}</p>
              </div>
              <div className="flex items-center space-x-3">
                {(user as any)?.profileImageUrl && (
                  <img
                    src={(user as any).profileImageUrl}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col h-full">
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <ChartLine className="h-6 w-6 text-primary mr-2" />
                      <span className="text-lg font-bold text-primary">
                        FinanceFantasy
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {(user as any)?.profileImageUrl && (
                        <img
                          src={(user as any).profileImageUrl}
                          alt="Profile"
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      )}
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {(user as any)?.firstName
                            ? `${(user as any).firstName} ${
                                (user as any).lastName || ""
                              }`.trim()
                            : (user as any)?.email}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {(user as any)?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <nav className="flex-1">
                    <NavItems mobile />
                  </nav>

                  <div className="mt-auto">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
