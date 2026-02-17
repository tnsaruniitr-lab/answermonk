import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Analyzer from "@/pages/Analyzer";
import HistoryPage from "@/pages/History";
import PromptGenerator from "@/pages/PromptGenerator";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Analyzer} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/prompts" component={PromptGenerator} />
      <Route component={NotFound} />
    </Switch>
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
