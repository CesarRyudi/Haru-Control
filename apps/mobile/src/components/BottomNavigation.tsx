import { useNavigate, useLocation } from "react-router-dom";
import "./BottomNavigation.css";

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/", icon: "📋", label: "Início" },
    { path: "/orders/history", icon: "🧾", label: "Pedidos" },
    { path: "/customers", icon: "👥", label: "Clientes" },
    { path: "/products", icon: "📦", label: "Produtos" },
    { path: "/manufacturing", icon: "🏭", label: "Produção" },
    { path: "/stock", icon: "📊", label: "Estoque" },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive =
          item.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.path);
        return (
          <button
            key={item.path}
            className={`bottom-nav-item ${isActive ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
