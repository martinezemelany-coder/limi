import React, { useEffect } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
} from "react-router-dom";

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

/* -------------------------------------------------------
   NAVIGATION ITEMS
------------------------------------------------------- */

const navItems = [
  {
    label: "Feed",
    to: "/",
    icon: Newspaper,
  },
  {
    label: "Reels",
    to: "/reels",
    icon: Film,
  },
  {
    label: "Hangouts",
    to: "/hangouts",
    icon: MapPin,
  },
  {
    label: "Chats",
    to: "/chats",
    icon: MessageCircle,
  },
  {
    label: "Match",
    to: "/match",
    icon: Heart,
  },
  {
    label: "Profile",
    to: "/profile",
    icon: User,
  },
];

/* -------------------------------------------------------
   PAGE TRANSITION
------------------------------------------------------- */

function PageTransition({ children }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  return (
    <div
      key={location.pathname}
      className="limi-page-transition"
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------
   PREMIUM NAVIGATION
------------------------------------------------------- */

function PremiumNavigation() {
  const location = useLocation();

  const getActiveIndex = () => {
    if (location.pathname === "/") {
      return 0;
    }

    if (location.pathname.startsWith("/reels")) {
      return 1;
    }

    if (
      location.pathname.startsWith("/hangouts") ||
      location.pathname.startsWith("/hangout-chat")
    ) {
      return 2;
    }

    if (
      location.pathname.startsWith("/chats") ||
      location.pathname.startsWith("/chat/")
    ) {
      return 3;
    }

    if (location.pathname.startsWith("/match")) {
      return 4;
    }

    if (
      location.pathname.startsWith("/profile") ||
      location.pathname.startsWith("/verify")
    ) {
      return 5;
    }

    return 0;
  };

  const activeIndex = getActiveIndex();

  return (
    <nav className="fixed bottom-3 left-0 right-0 z-30 px-3 pb-[max(4px,env(safe-area-inset-bottom))]">
      <div className="relative mx-auto max-w-md rounded-[26px] border border-white/35 bg-white/20 p-1.5 shadow-[0_14px_40px_rgba(71,45,58,0.10)] backdrop-blur-2xl">
        {/* Top glass shine */}

        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

        {/* Sliding Limi gradient */}

        <div
          className="pointer-events-none absolute bottom-1.5 top-1.5 rounded-[20px] bg-gradient-to-br from-[#ee78aa] via-[#df5e9c] to-[#f18a91] shadow-[0_8px_20px_rgba(212,72,139,0.26)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            left: "6px",
            width: "calc((100% - 12px) / 6)",
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        <div className="relative z-10 grid grid-cols-6">
          {navItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              end={to === "/"}
              aria-label={label}
              className="group relative flex h-[52px] items-center justify-center rounded-[20px]"
            >
              {({ isActive }) => (
                <span
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ease-out ${
                    isActive
                      ? "-translate-y-0.5 scale-110 text-white"
                      : "scale-100 text-[#75636c] group-hover:text-[#d45c98] group-active:scale-90"
                  }`}
                >
                  <Icon
                    size={isActive ? 22 : 21}
                    strokeWidth={isActive ? 2.7 : 2.2}
                    fill={
                      isActive && label === "Match"
                        ? "currentColor"
                        : "none"
                    }
                  />
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

/* -------------------------------------------------------
   APP LAYOUT
------------------------------------------------------- */

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#fff6fa] pb-28">
      <div className="mx-auto min-h-screen max-w-md">
        <PageTransition>{children}</PageTransition>
      </div>

      <PremiumNavigation />
    </div>
  );
}

/* -------------------------------------------------------
   PROTECTED PAGE
------------------------------------------------------- */

function ProtectedAppPage({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

/* -------------------------------------------------------
   ROUTES
------------------------------------------------------- */

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/signup"
        element={<Signup />}
      />

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

      <Route
        path="*"
        element={<Login />}
      />
    </Routes>
  );
}

/* -------------------------------------------------------
   APP
------------------------------------------------------- */

function App() {
  return (
    <FirebaseAuthProvider>
      <Router>
        <style>
          {`
            @keyframes limiPageEnter {
              from {
                opacity: 0;
              }

              to {
                opacity: 1;
              }
            }

            .limi-page-transition {
              animation:
                limiPageEnter
                240ms
                ease-out;
            }

            @media (prefers-reduced-motion: reduce) {
              .limi-page-transition {
                animation: none;
              }
            }
          `}
        </style>

        <AppRoutes />
      </Router>
    </FirebaseAuthProvider>
  );
}

export default App;