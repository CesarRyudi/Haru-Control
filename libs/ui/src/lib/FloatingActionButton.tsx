import { useState } from "react";
import "./FloatingActionButton.css";

interface MenuItem {
  icon: string;
  label: string;
  onClick: () => void;
}

interface FloatingActionButtonProps {
  menuItems: MenuItem[];
}

export function FloatingActionButton({ menuItems }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`fab-container ${isOpen ? "fab-open" : ""}`}>
      {isOpen && (
        <div className="fab-menu">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="fab-menu-item"
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
            >
              <span className="fab-icon">{item.icon}</span>
              <span className="fab-label">{item.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        className="fab-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu de navegação"
      >
        {isOpen ? "✕" : "☰"}
      </button>
    </div>
  );
}
