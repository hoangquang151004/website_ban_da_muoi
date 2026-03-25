"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "customer";
}

export default function AuthGuard({
  children,
  requiredRole,
}: AuthGuardProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (requiredRole && user?.role !== requiredRole) {
        if (requiredRole === "admin") {
          router.push("/"); // Redirect to home if not admin
        } else {
          router.push("/login");
        }
      }
    }
  }, [isMounted, isAuthenticated, user, router, requiredRole]);

  if (!isMounted || !isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-slate-500 font-medium animate-pulse">
            Đang kiểm tra quyền truy cập...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
