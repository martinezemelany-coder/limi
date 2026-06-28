import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Film, MapPin, Heart, User } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', icon: Home, label: 'Feed' },
  { path: '/reels', icon: Film, label: 'Reels' },
  { path: '/hangouts', icon: MapPin, label: 'Hangouts' },
  { path: '/match', icon: Heart, label: 'Match' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-lg mx-auto">
        <div className="mx-3 mb-3 rounded-2xl glass border border-white/60 shadow-glow-sm">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
                >
                  {isActive && (
                    <motion.div
                      layoutId="navPill"
                      className="absolute inset-0 rounded-xl gradient-warm opacity-90"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={`w-5 h-5 relative z-10 transition-all duration-200 ${
                      isActive ? 'text-white drop-shadow-sm' : 'text-muted-foreground'
                    }`}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  <span className={`text-[9px] font-semibold relative z-10 tracking-wide uppercase transition-all ${
                    isActive ? 'text-white' : 'text-muted-foreground'
                  }`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}