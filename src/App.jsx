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
import MainChat from "./pages/MainChat";
import ChatConversation from "./pages/ChatConversation";
import HangoutChatConversation from "./pages/HangoutChatConversation";
import Verify from "./pages/Verify";

import {
  Newspaper,
  Film,
  MapPin,
  Heart,
  User,
  MessageCircle,
} from "lucide-react";

const navItems = [
  { label: "Feed", to: "/", icon: Newspaper },
  { label: "Reels", to: "/reels", icon: Film },
  { label: "Hangouts", to: "/hangouts", icon: MapPin },
  { label: "Chats", to: "/chats", icon: MessageCircle },
  { label: "Match", to: "/match", icon: Heart },
  { label: "Profile", to: "/profile", icon: User },
];

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#fff6fa] pb-28">
      <div className="mx-auto min-h-screen max-w-md">{children}</div>

      <nav className="fixed bottom-4 left-1/2 z-50 w-[94%] max-w-md -translate-x-1/2 rounded-[28px] border border-[#f4dce7] bg-white/95 px-2 py-2 shadow-[0_14px_35px_rgba(239,148,181,0.22)] backdrop-blur">
        <div className="grid grid-cols-6 gap-1">
          {navItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center rounded-2xl px-1 py-3 text-[9px] font-black transition ${
                  isActive
                    ? "bg-gradient-to-b from-[#c95c92] to-[#d94b93] text-white shadow-[0_8px_18px_rgba(217,75,147,0.25)]"
                    : "text-[#5f4b56]"
                }`
              }
            >
              <Icon size={21} />
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
              <ProtectedAppPage>
                <Verify />
              </ProtectedAppPage>
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
            path="/chats"
            element={
              <ProtectedAppPage>
                <MainChat />
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
            path="/profile"
            element={
              <ProtectedAppPage>
                <Profile />
              </ProtectedAppPage>
            }
          />

          <Route
            path="/profile/:uid"
            element={
              <ProtectedAppPage>
                <Profile />
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