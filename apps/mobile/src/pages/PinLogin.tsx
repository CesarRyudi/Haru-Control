import { useEffect, useState } from "react";
import api from "../services/api";
import {
  authenticateWithBiometrics,
  isBiometricsRegistered,
  isBiometricsSupported,
  registerBiometrics,
  saveAuthSession,
} from "../services/biometrics";
import "./PinLogin.css";

interface PinLoginProps {
  onSuccess: () => void;
}

export default function PinLogin({ onSuccess }: PinLoginProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsRegistered, setBiometricsRegistered] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkBiometrics() {
      const supported = await isBiometricsSupported();
      const registered = isBiometricsRegistered();

      if (mounted) {
        setBiometricsAvailable(supported);
        setBiometricsRegistered(registered);
      }
    }

    checkBiometrics();

    return () => {
      mounted = false;
    };
  }, []);

  const handleBiometricLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const success = await authenticateWithBiometrics();
      if (success) {
        onSuccess();
      } else {
        setError("Não foi possível autenticar com biometria. Use o PIN.");
      }
    } catch {
      setError("Erro ao autenticar com biometria.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/verify-pin", { pin });

      // Salva sessão válida por 7 dias
      saveAuthSession(7);

      // Se o aparelho suportar biometria e ainda não estiver registrada, oferece cadastrar
      if (biometricsAvailable && !biometricsRegistered) {
        setShowBiometricPrompt(true);
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (err) {
      setError("PIN inválido");
      setLoading(false);
    }
  };

  const handleEnableBiometrics = async () => {
    setLoading(true);
    try {
      const registered = await registerBiometrics();
      if (registered) {
        setBiometricsRegistered(true);
      }
    } catch (e) {
      console.warn("Falha ao registrar biometria:", e);
    } finally {
      onSuccess();
    }
  };

  const handleSkipBiometrics = () => {
    onSuccess();
  };

  if (showBiometricPrompt) {
    return (
      <div className="pin-login">
        <div className="pin-login-card biometric-prompt-card">
          <div className="biometric-icon-container">
            <svg
              className="biometric-icon pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 11c0 3.866-3.134 7-7 7a8.96 8.96 0 0 1-1-.055" />
              <path d="M8 7a4 4 0 0 1 8 0v1" />
              <path d="M12 21c4.97 0 9-4.03 9-9 0-2.485-1.007-4.735-2.636-6.364" />
              <path d="M12 3v1" />
              <path d="M6 12a6 6 0 0 1 6-6" />
              <path d="M12 17a4 4 0 0 1-4-4" />
            </svg>
          </div>
          <h2>Ativar Biometria?</h2>
          <p>
            Deseja habilitar o login por <strong>Face ID / Touch ID / Digital</strong> para entrar com 1 toque neste aparelho nos próximos 7 dias?
          </p>
          <div className="biometric-actions">
            <button
              type="button"
              className="btn-biometric-enable"
              onClick={handleEnableBiometrics}
              disabled={loading}
            >
              {loading ? "Ativando..." : "Sim, ativar biometria"}
            </button>
            <button
              type="button"
              className="btn-biometric-skip"
              onClick={handleSkipBiometrics}
              disabled={loading}
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pin-login">
      <div className="pin-login-card">
        <h1>Haru Control</h1>
        <p className="subtitle">Digite o PIN para acessar</p>

        {biometricsRegistered && (
          <div className="biometric-quick-login">
            <button
              type="button"
              className="btn-biometric-login"
              onClick={handleBiometricLogin}
              disabled={loading}
            >
              <svg
                className="btn-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 11c0 3.866-3.134 7-7 7a8.96 8.96 0 0 1-1-.055" />
                <path d="M8 7a4 4 0 0 1 8 0v1" />
                <path d="M12 21c4.97 0 9-4.03 9-9 0-2.485-1.007-4.735-2.636-6.364" />
                <path d="M12 3v1" />
                <path d="M6 12a6 6 0 0 1 6-6" />
                <path d="M12 17a4 4 0 0 1-4-4" />
              </svg>
              {loading ? "Verificando..." : "Entrar com Biometria / Digital"}
            </button>

            <div className="auth-divider">
              <span>ou use o PIN</span>
            </div>
          </div>
        )}

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
            autoFocus={!biometricsRegistered}
            autoComplete="current-password"
          />

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-pin-submit" disabled={loading || pin.length < 4}>
            {loading ? "Verificando..." : "Entrar com PIN"}
          </button>
        </form>

        <p className="session-info">
          🛡️ Acesso salvo com segurança por 7 dias neste navegador
        </p>
      </div>
    </div>
  );
}
