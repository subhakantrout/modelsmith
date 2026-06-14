import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomBar } from "./BottomBar";
import { RightPanel } from "./RightPanel";
import { HomeView } from "./HomeView";
import { CanvasView } from "./CanvasView";
import { ModelsView } from "./ModelsView";
import { ChatView } from "./ChatView";
import { SettingsView } from "./SettingsView";
import { useViewStore } from "../stores/viewStore";

const VIEWS: Record<string, React.FC> = {
  home: HomeView,
  canvas: CanvasView,
  models: ModelsView,
  chat: ChatView,
  settings: SettingsView,
};

export function Shell() {
  const currentView = useViewStore((s) => s.currentView);
  const ViewComponent = VIEWS[currentView];

  return (
    <div className="h-screen w-screen bg-gray-925 text-gray-100 flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 min-w-0">
            <ViewComponent />
          </div>
          <RightPanel />
        </div>
        <BottomBar />
      </div>
    </div>
  );
}
