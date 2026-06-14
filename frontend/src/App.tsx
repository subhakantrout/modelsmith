import { useState } from "react";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { Shell } from "./components/Shell";
import { DownloadManager } from "./components/DownloadManager";
import { ToastProvider } from "./components/ToastProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <ErrorBoundary>
      {started ? <Shell /> : <WelcomeScreen onStart={() => setStarted(true)} />}
      <DownloadManager />
      <ToastProvider />
    </ErrorBoundary>
  );
}
