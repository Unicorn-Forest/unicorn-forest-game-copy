import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ForestShell from "./components/ForestShell";
import { GameProvider } from "./contexts/GameContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import ConstellationGraph from "./pages/forest/ConstellationGraph";
import Expedition from "./pages/forest/Expedition";
import GrovePage from "./pages/forest/GrovePage";
import NotesPage from "./pages/forest/NotesPage";
import ObservatoryPage from "./pages/forest/ObservatoryPage";
import OraclePage from "./pages/forest/OraclePage";
import ShrinePage from "./pages/forest/ShrinePage";
import WorldTree from "./pages/WorldTree";

/** Legacy path redirect: /world-tree → /forest/world-tree */
function WorldTreeRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/forest/world-tree", { replace: true });
  }, [navigate]);
  return null;
}

/** All /forest/* pages share the GameProvider + dashboard shell */
function ForestRoutes() {
  return (
    <GameProvider>
      <ForestShell>
        <Switch>
          <Route path="/forest" component={Expedition} />
          <Route path="/forest/oracle" component={OraclePage} />
          <Route path="/forest/observatory" component={ObservatoryPage} />
          <Route path="/forest/constellation" component={ConstellationGraph} />
          <Route path="/forest/world-tree" component={WorldTree} />
          <Route path="/forest/grove" component={GrovePage} />
          <Route path="/forest/shrine" component={ShrinePage} />
          <Route path="/forest/notes" component={NotesPage} />
          <Route component={NotFound} />
        </Switch>
      </ForestShell>
    </GameProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/world-tree" component={WorldTreeRedirect} />
      <Route path="/forest" component={ForestRoutes} />
      <Route path="/forest/:rest*" component={ForestRoutes} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
