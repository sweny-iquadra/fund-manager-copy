import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { ChartLine, Home, Trophy, TrendingUp, Users, Menu, LogOut } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Contests", href: "/contests", icon: Trophy },
    { name: "Portfolio", href: "/portfolio", icon: TrendingUp },
    { name: "Leaderboard", href: "/leaderboard", icon: Users },
  ];

  const isActive = (href: string) => {
    return location === href;
  };

  const NavItems = ({ mobile = false }) => (
    <div className={`flex ${mobile ? 'flex-col space-y-2' : 'space-x-8'}`}>
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
              className={`${mobile ? 'w-full justify-start' : ''} ${
                isActive(item.href) ? 'text-white' : 'text-gray-700 hover:text-primary'
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
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <ChartLine className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-primary">FinanceFantasy</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex">
            <NavItems />
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-500">{user?.email}</p>
              </div>
              {user?.profileImageUrl && (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover"
                />
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/api/logout'}
              className="hidden md:flex"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>

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
                      <span className="text-lg font-bold text-primary">FinanceFantasy</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {user?.profileImageUrl && (
                        <img
                          src={user.profileImageUrl}
                          alt="Profile"
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      )}
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-gray-500">{user?.email}</p>
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
                      onClick={() => window.location.href = '/api/logout'}
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
