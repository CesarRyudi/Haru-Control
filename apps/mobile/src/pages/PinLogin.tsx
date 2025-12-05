import { useState } from "react";
import api from "../services/api";
import "./PinLogin.css";

interface PinLoginProps {
  onSuccess: () => void;
}

export default function PinLogin({ onSuccess }: PinLoginProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/verify-pin", { pin });

      // Salvar timestamp de autenticação no localStorage (válido por 12 horas)
      const expirationTime = Date.now() + 12 * 60 * 60 * 1000; // 12 horas
      localStorage.setItem(
        "auth_token",
        JSON.stringify({
          authenticated: true,
          expiresAt: expirationTime,
        })
      );

      onSuccess();
    } catch (err) {
      setError("PIN inválido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pin-login">
      <div className="pin-login-card">
        <h1>Haru Control</h1>
        <p>Digite o PIN para acessar</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            className="pin-input"
            autoFocus
          />

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading || pin.length < 4}>
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
