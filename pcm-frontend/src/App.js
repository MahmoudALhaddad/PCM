import React, { useState, useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import SplashScreen from "./components/SplashScreen";

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

  return <AppRoutes />;
}

export default App;
