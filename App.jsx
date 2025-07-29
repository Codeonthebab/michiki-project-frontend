import { Outlet } from 'react-router-dom';
import './App.css'
import LogoSection from './components/LogoSection';
import LanguageButton from './components/LanguageButton';
import Footer from './components/Footer';
import { useState } from 'react';
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Schedule from "./pages/Schedule";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="app-layout">
      <LogoSection />
      <LanguageButton />
      <main className = "main-outlet">
        <Outlet context={{ isLoggedIn, setIsLoggedIn }} />
      </main>
      <Footer />
    </div>
  )
}

export default App