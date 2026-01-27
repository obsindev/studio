import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Config from "./pages/Config";
import Docs from "./pages/Docs";

const useCleanHashLocation = () => {
  const [location, setLocation] = useHashLocation();
  // Query parametrelerini (e.g. ?id=...) route eşleşmesinden ayırıyoruz
  const [path] = location.split("?");
  return [path, setLocation];
};

function Router() {
  return (
    <WouterRouter hook={useCleanHashLocation}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/config" component={Config} />
        <Route path="/docs" component={Docs} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
