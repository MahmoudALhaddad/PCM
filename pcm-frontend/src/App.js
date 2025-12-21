import React, { useState, useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import SplashScreen from "./components/SplashScreen";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simulate app initialization/loading
    // You can add any initial data loading here
    setTimeout(() => {
      setIsReady(true);
    }, 5000);
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash && !isReady) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}

export default App;
