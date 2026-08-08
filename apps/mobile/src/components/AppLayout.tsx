import React from "react";
import BottomNavigation from "./BottomNavigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingBottom: "80px" }}>
      {children}
      <BottomNavigation />
    </div>
  );
}
