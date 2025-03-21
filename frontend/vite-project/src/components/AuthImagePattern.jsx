 import React from "react";

 export const AuthImagePattern = ({ title, subtitle }) => {
    return (
      <div className="hidden lg:flex items-center justify-center bg-base-200 p-12">
        <div className="max-w-md text-center">
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-2xl bg-primary/10 flex items-center justify-center ${
                  i % 2 === 0 ? "animate-pulse" : ""
                }`}
              >
                {/* AI/Cartoon Avatar Inside Boxes */}
                <div className="avatar">
                  <div className="w-16 rounded-full bg-base-300">
                    <img
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=avatar${i}`}
                      alt="Avatar"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <p className="text-base-content/60">{subtitle}</p>
        </div>
      </div>
    );
  };