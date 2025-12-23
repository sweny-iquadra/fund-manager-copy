import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Contests from "@/pages/contests";
import CreateContest from "@/pages/create-contest";
import ContestDetail from "@/pages/contest-detail";
import Portfolio from "@/pages/portfolio";
import Leaderboard from "@/pages/leaderboard";
import AuthCallback from "@/pages/auth-callback";
import AuthError from "@/pages/auth-error";
import ContestRequests from "@/pages/admin/contest-requests";
import Account from "@/pages/Account";
import UploadDemo from "@/pages/UploadDemo";
import Navbar from "@/components/navbar";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const hasTokens = !!localStorage.getItem("accessToken");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navbar />}
      <Switch>
        {/* Auth callback routes (always available) */}
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/auth/error" component={AuthError} />

        {/* Authenticated routes - available if user is authenticated OR has tokens (during transition) */}
        {(isAuthenticated || hasTokens) && (
          <>
            <Route path="/home" component={Home} />
            <Route path="/contests" component={Contests} />
            <Route path="/contests/create" component={CreateContest} />
            <Route path="/contests/:id" component={ContestDetail} />
            <Route path="/contests/:id/portfolio" component={Portfolio} />
            <Route path="/portfolio" component={Portfolio} />
            <Route path="/leaderboard" component={Leaderboard} />
            <Route path="/account" component={Account} />
            <Route path="/upload-demo" component={UploadDemo} />
            <Route path="/admin/contest-requests" component={ContestRequests} />
          </>
        )}

        {/* Unauthenticated routes - login/register always available, landing only without tokens */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        {/* Root route handling */}
        {!hasTokens && <Route path="/" component={Landing} />}
        {hasTokens && (
          <Route
            path="/"
            component={() => {
              window.location.href = "/home";
              return null;
            }}
          />
        )}

        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
