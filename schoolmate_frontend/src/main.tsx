import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/shared/contexts/AuthContext";
import { SchoolProvider } from "@/shared/contexts/SchoolContext";
import { ProfileModalProvider } from "@/shared/contexts/ProfileModalContext";
import "./index.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import App from "@/App.tsx";

// PWA 서비스 워커 등록 (PWA 설치 기능을 활성화하기 위함)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.log("Service Worker registration failed:", error);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProfileModalProvider>
          <SchoolProvider>
            <App />
          </SchoolProvider>
        </ProfileModalProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
