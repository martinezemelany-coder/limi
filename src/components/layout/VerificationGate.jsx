import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useFirebaseAuth } from "@/lib/FirebaseAuthContext";
import { ShieldCheck } from "lucide-react";

export default function VerificationGate() {
  const { user, loading } = useFirebaseAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}