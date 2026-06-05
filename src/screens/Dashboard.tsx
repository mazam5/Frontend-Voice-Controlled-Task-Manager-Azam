import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVoiceAgent } from "@/hooks/useVoiceAgent";
import { getUserInfo, logoutUser } from "@/lib/api";
import {
  Calendar,
  LogOut,
  Mic,
  Settings,
  Terminal,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConversationHUD } from "@/components/dashboard/ConversationHUD";
import { VoiceOrbPanel } from "@/components/dashboard/VoiceOrbPanel";
import { AgendaDashboard } from "@/components/dashboard/AgendaDashboard";

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [mobileTab, setMobileTab] = useState<"orb" | "chat" | "agenda">("orb");

  const user = getUserInfo();

  const {
    agentState,
    isMicActive,
    isWsConnected,
    tasks,
    chatHistory,
    interimText,
    logs,
    selectedVoice,
    setSelectedVoice,
    toggleListening,
    resetSession,
  } = useVoiceAgent();

  // Load browser voices for TTS
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Show login welcome confirmation on dashboard load
  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem("just_logged_in");
    if (justLoggedIn === "true") {
      toast.success(`Welcome back, ${user?.name || "User"}! You are successfully logged in.`);
      sessionStorage.removeItem("just_logged_in");
    }
  }, [user]);

  const handleSaveSettings = () => {
    setShowSettings(false);
  };

  const handleLogoutClick = () => {
    logoutUser();
    onLogout();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4 gap-3">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-slate-800/60 pb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400">
            Auralist
          </h1>
          <span className="hidden sm:inline-block text-[10px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            Voice HUD v1.0
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden xs:block">
            <p className="text-[10px] text-slate-500">Logged in as</p>
            <p className="text-xs font-bold text-slate-200">{user?.name || user?.email || "User"}</p>
          </div>
          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="text-slate-400 hover:text-indigo-400 hover:bg-slate-800 w-8 h-8 rounded-lg"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
          {/* Logout Trigger */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogoutConfirm(true)}
            className="text-slate-400 hover:text-rose-400 hover:bg-slate-900 gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800/60 h-8"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline text-xs font-medium">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Panels Layout Container */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden min-h-0">
        {/* LEFT PANEL: Chat History */}
        <ConversationHUD
          chatHistory={chatHistory}
          interimText={interimText}
          isWsConnected={isWsConnected}
          resetSession={resetSession}
          mobileTab={mobileTab}
        />

        {/* CENTER STAGE: Voice Orb */}
        <VoiceOrbPanel
          agentState={agentState}
          isMicActive={isMicActive}
          toggleListening={toggleListening}
          logs={logs}
          mobileTab={mobileTab}
        />

        {/* RIGHT PANEL: Task Agenda */}
        <AgendaDashboard
          tasks={tasks}
          mobileTab={mobileTab}
        />
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-900 bg-slate-950/90 backdrop-blur-md p-2 w-full shrink-0">
        <button
          onClick={() => setMobileTab("chat")}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all duration-200 cursor-pointer ${
            mobileTab === "chat"
              ? "text-indigo-400 bg-indigo-500/10 font-semibold"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Terminal className="w-5 h-5" />
          <span className="text-[10px]">Chat Log</span>
        </button>

        <button
          onClick={() => setMobileTab("orb")}
          className={`flex flex-col items-center gap-1 py-1 px-5 rounded-xl transition-all duration-200 relative cursor-pointer ${
            mobileTab === "orb"
              ? "text-pink-400 bg-pink-500/10 font-semibold"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {isMicActive && (
            <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-pink-500 animate-ping" />
          )}
          <Mic className={`w-5 h-5 ${isMicActive && mobileTab !== "orb" ? "text-pink-500 animate-pulse" : ""}`} />
          <span className="text-[10px]">Assistant</span>
        </button>

        <button
          onClick={() => setMobileTab("agenda")}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all duration-200 cursor-pointer ${
            mobileTab === "agenda"
              ? "text-indigo-400 bg-indigo-500/10 font-semibold"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Agenda</span>
        </button>
      </div>

      {/* SETTINGS DIALOG */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="glass-panel max-w-sm w-full p-6 rounded-2xl shadow-2xl border border-white/10 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              Agent Settings
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              Configure your Auralist voice assistant options.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold">
                Text-to-Speech Voice
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-100 rounded-lg p-2 text-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="">Browser Default</option>
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="flex gap-2 justify-end mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSettings}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LOGOUT CONFIRMATION DIALOG */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="glass-panel max-w-sm w-full p-6 rounded-2xl shadow-2xl border border-white/10 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <LogOut className="w-5 h-5 text-rose-500" />
              Confirm Logout
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              Are you sure you want to log out of Auralist? Your active voice session will be ended.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 justify-end mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLogoutConfirm(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleLogoutClick}
              className="bg-rose-600 hover:bg-rose-700 text-white border-none"
            >
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;