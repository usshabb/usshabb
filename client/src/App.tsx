import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Desktop from "@/pages/Desktop";
import FolderView from "@/pages/FolderView";
import { PasscodeScreen, clearPasscode } from "@/components/PasscodeScreen";

function Router({ onLogout }: { onLogout: () => void }) {
  return (
    <Switch>
      <Route path="/" component={() => <Desktop onLogout={onLogout} />} />
      <Route path="/:name" component={FolderView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    // Check if user has already unlocked in this session
    const unlocked = sessionStorage.getItem("unlocked");
    if (unlocked === "true") {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = () => {
    sessionStorage.setItem("unlocked", "true");
    setIsUnlocked(true);
  };

  const handleLogout = () => {
    clearPasscode();
    setIsUnlocked(false);
  };

  if (!isUnlocked) {
    return <PasscodeScreen onUnlock={handleUnlock} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router onLogout={handleLogout} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
