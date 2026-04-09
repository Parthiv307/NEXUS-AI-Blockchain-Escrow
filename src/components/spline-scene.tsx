"use client";

import { Suspense, lazy } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

export function SplineScene({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Suspense
        fallback={
          <div className="w-full h-full bg-gradient-to-br from-indigo-deep via-background to-void" />
        }
      >
        <Spline scene="https://prod.spline.design/mdL0TgvbgHNpjrh9/scene.splinecode" />
      </Suspense>
    </div>
  );
}
