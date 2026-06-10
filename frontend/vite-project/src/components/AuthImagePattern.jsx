import React from "react";

export const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="app-aurora relative hidden items-center justify-center overflow-hidden p-12 lg:flex">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 animate-aurora-pulse rounded-full bg-primary/25 blur-[100px]" />

      <div className="relative z-10 max-w-md text-center">
        <div className="mb-8 grid grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`glass flex aspect-square items-center justify-center rounded-2xl ${
                i % 2 === 0 ? "animate-pulse" : ""
              }`}
            >
              <div className="size-16 overflow-hidden rounded-full ring-1 ring-white/10">
                <img
                  src={`https://api.dicebear.com/9.x/bottts/svg?seed=gargx-${i}`}
                  alt="Avatar"
                  className="size-16"
                />
              </div>
            </div>
          ))}
        </div>
        <h2 className="mb-3 text-2xl font-bold tracking-tightish">{title}</h2>
        <p className="text-base-content/55">{subtitle}</p>
      </div>
    </div>
  );
};
