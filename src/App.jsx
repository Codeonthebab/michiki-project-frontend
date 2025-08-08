// src/App.jsx
import { Outlet, useLocation } from 'react-router-dom';
import './App.css';
import LogoSection from './components/LogoSection';
import LanguageButton from './components/LanguageButton';
import Footer from './components/Footer';
import React, { useEffect, useState } from "react";
import AvatarDock from './components/AvatarDock';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const access = localStorage.getItem("accessToken");
      const u = localStorage.getItem("user");
      if (access && u) {
        setIsLoggedIn(true);
        setUser(JSON.parse(u));
      }
    } catch (e) {
      console.error("restore failed", e);
    }
  }, []);

  const location = useLocation();
  const hideFooter = location.pathname === "/schedule";

  return (
    <div className="app-layout">
      <LogoSection />
      <LanguageButton />
      <main className="main-outlet">
        <Outlet context={{ isLoggedIn, setIsLoggedIn, user, setUser }} />
      </main>
      {!hideFooter && <Footer />}

      {/* 전역 로그인 배지 (모든 페이지 좌하단) */}
      <AvatarDock
        user={user}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        setUser={setUser}
      />
    </div>
  );
}

export default App;
