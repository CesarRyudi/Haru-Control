import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import OrderBoard from "../pages/OrderBoard";
import OrderForm from "../pages/OrderForm";
import PinLogin from "../pages/PinLogin";
import Products from "../pages/Products";
import Stock from "../pages/Stock";
import Customers from "../pages/Customers";
import ProductRecipe from "../pages/ProductRecipe";
import Manufacturing from "../pages/Manufacturing";
import Help from "../pages/Help";
import AppLayout from "../components/AppLayout";
import { isAuthSessionValid } from "../services/biometrics";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se existe autenticação válida (válida por 7 dias)
    if (isAuthSessionValid()) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          color: "#666",
        }}
      >
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLogin onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout><OrderBoard /></AppLayout>} />
        <Route path="/orders/new" element={<OrderForm />} />
        <Route path="/orders/:id/edit" element={<OrderForm />} />
        <Route path="/products" element={<AppLayout><Products /></AppLayout>} />
        <Route path="/products/:id/recipe" element={<AppLayout><ProductRecipe /></AppLayout>} />
        <Route path="/manufacturing" element={<AppLayout><Manufacturing /></AppLayout>} />
        <Route path="/stock" element={<AppLayout><Stock /></AppLayout>} />
        <Route path="/customers" element={<AppLayout><Customers /></AppLayout>} />
        <Route path="/help" element={<AppLayout><Help /></AppLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
