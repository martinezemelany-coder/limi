import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { FirebaseAuthProvider } from "./lib/FirebaseAuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Feed from "./pages/Feed";
import Reels from "./pages/Reels";
import Hangouts from "./pages/Hangouts";
import Match from "./pages/Match";
import Profile from "./pages/Profile";
import Chats from "./pages/Chats";
import ChatConversation from "./pages/ChatConversation";
import HangoutChatConversation from "./pages/HangoutChatConversation";
import Verify from "./pages/Verify";

import {
  Newspaper,
  Film,
  MapPin,
  Heart,
  User,
} from "lucide-react";

const navItems = [
  { label: "Feed", to: "/", icon: Newspaper },
  { label: "Reels", to: "/reels", icon: Film },
  { label: "Hangouts", to: "/hangouts", icon: MapPin },
  { label: "Match", to: "/match", icon: Heart },
  { label: "Profile", to: "/profile", icon: User },
];

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#fff6fa] pb-28">
      <div className="mx-auto min-h-screen max-w-md">
        {children}
      </div>

      <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-[30px] border border-[#f4dce7] bg-white/95 px-3 py-3 shadow-[0_14px_35px_rgba(239,148,181,0.22)] backdrop-blur">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-black uppercase tracking-wide transition ${
                  isActive
                    ? "bg-gradient-to-b from-[#f5a2bc] to-[#d94b93] text-white"
                    : "text-[#5f4b56]"
                }`
              }
            >
              <Icon size={21} />
              <span className="mt-1">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function ProtectedAppPage({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <FirebaseAuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireOnboarding={false}>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          <Route
            path="/verify"
            element={
              <ProtectedRoute requireOnboarding={false}>
                <Verify />
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedAppPage>
                <Feed />
              </ProtectedAppPage>
            }
          />

          <Route
            path="/reels"
            element={
              <ProtectedAppPage>
                <Reels />
              </ProtectedAppPage>
            }
          />

          <Route
            path="/hangouts"
            element={
              <ProtectedAppPage>
                <Hangouts />
              </ProtectedAppPage>
            }
          />

          <Route
            path="/match"
            element={
              <ProtectedAppPage>
                <Match />
              </ProtectedAppPage>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedAppPage>
                <Profile />
              </ProtectedAppPage>
            }
          />

          <Route
            path="/chats"
            element={
              <ProtectedAppPage>
                <Chats />
              </ProtectedAppPage>
            }
          />

          <Route
            path="/chat/:chatId"
            element={
              <ProtectedAppPage>
                <ChatConversation />
              </ProtectedAppPage>
            }
          />

          <Route
            path="/hangout-chat/:hangoutId"
            element={
              <ProtectedAppPage>
                <HangoutChatConversation />
              </ProtectedAppPage>
            }
          />

          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </FirebaseAuthProvider>
  );
}

export default App;