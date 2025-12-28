
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import Home from './components/Home.tsx';
import InnerMuse from './components/InnerMuse.tsx';
import Soundtrack from './components/Soundtrack.tsx';
import SocraticMirrors from './components/SocraticMirrors.tsx';
import Rituals from './components/Rituals.tsx';
import Settings from './components/Settings.tsx';
import Login from './components/Login.tsx';
import { AppView } from './types.ts';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [isImmersive, setIsImmersive] = useState(false);

  // Persistência básica de sessão (opcional para o protótipo)
  useEffect(() => {
    const session = localStorage.getItem('is_authenticated');
    if (session === 'true') setIsAuthenticated(true);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('is_authenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('is_authenticated');
  };

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    setIsImmersive(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.HOME:
        return <Home onChangeView={handleViewChange} />;
      case AppView.MUSE:
        return <InnerMuse />;
      case AppView.SOUNDTRACK:
        return <Soundtrack />;
      case AppView.MIRROR:
        return (
          <SocraticMirrors />
        );
      case AppView.RITUALS:
        return <Rituals />;
      case AppView.SETTINGS:
        return <Settings />;
      default:
        return <Home onChangeView={handleViewChange} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      onChangeView={handleViewChange}
      isImmersive={isImmersive}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
