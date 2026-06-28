import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #fff5f9 0%, #ffe8f2 50%, #fff0f5 100%)' }}>
      <div className="max-w-lg mx-auto pb-24">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}