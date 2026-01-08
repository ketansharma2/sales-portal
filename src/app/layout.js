"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation"; // Path check karne ke liye
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Check karein kya ye login page hai
  const isLoginPage = pathname === "/";

  return (
    <html lang="en">
<body className="antialiased bg-gray-50/50 flex font-['Calibri'] h-screen overflow-hidden">
        
        {/* Agar Login page nahi hai, tabhi Sidebar dikhao */}
        {!isLoginPage && (
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        )}

        <div
          className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-500 ease-in-out ${
    isLoginPage ? "ml-0" : (isCollapsed ? "ml-14" : "ml-72")
          }`}
        >
          {/* Agar Login page nahi hai, tabhi Header dikhao */}
          {!isLoginPage && <Header />}

          {/* Page Content: Login page full screen hogi, baki content p-8 follow karega */}
<main 
            className={`flex-1 overflow-y-auto ${
              isLoginPage ? "w-full p-0" : "pt-4 px-6 pb-8 w-full"
            }`}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
