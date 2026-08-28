const BIOMETRIC_CREDENTIAL_KEY = "haru_biometric_credential_id";
const AUTH_TOKEN_KEY = "auth_token";
const SESSION_DURATION_DAYS = 7;

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Salva a sessão de autenticação no localStorage por 7 dias
 */
export function saveAuthSession(days: number = SESSION_DURATION_DAYS): void {
  const expirationTime = Date.now() + days * 24 * 60 * 60 * 1000;
  localStorage.setItem(
    AUTH_TOKEN_KEY,
    JSON.stringify({
      authenticated: true,
      expiresAt: expirationTime,
    })
  );
}

/**
 * Verifica se existe uma sessão válida ativa (não expirada)
 */
export function isAuthSessionValid(): boolean {
  const authData = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!authData) return false;

  try {
    const { authenticated, expiresAt } = JSON.parse(authData);
    if (authenticated && Date.now() < expiresAt) {
      return true;
    }
    // Expirou, limpar
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return false;
  } catch {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return false;
  }
}

/**
 * Remove a sessão atual
 */
export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Verifica se o navegador e o dispositivo têm suporte a biometria nativa (Touch ID, Face ID, Windows Hello, etc.)
 */
export async function isBiometricsSupported(): Promise<boolean> {
  try {
    if (
      typeof window === "undefined" ||
      !window.PublicKeyCredential ||
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== "function"
    ) {
      return false;
    }

    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (err) {
    console.warn("Erro ao verificar suporte a biometria:", err);
    return false;
  }
}

/**
 * Verifica se já existe uma credencial biométrica cadastrada neste navegador
 */
export function isBiometricsRegistered(): boolean {
  return !!localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY);
}

/**
 * Registra a biometria do usuário no dispositivo via WebAuthn
 */
export async function registerBiometrics(): Promise<boolean> {
  try {
    const supported = await isBiometricsSupported();
    if (!supported) return false;

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array([104, 97, 114, 117]); // "haru"

    const creationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: "Haru Control",
      },
      user: {
        id: userId,
        name: "operador@harucontrol",
        displayName: "Operador Haru Control",
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: "none",
    };

    const credential = (await navigator.credentials.create({
      publicKey: creationOptions,
    })) as PublicKeyCredential | null;

    if (credential && credential.rawId) {
      const base64Id = bufferToBase64(credential.rawId);
      localStorage.setItem(BIOMETRIC_CREDENTIAL_KEY, base64Id);
      return true;
    }

    return false;
  } catch (err: any) {
    // Se o usuário cancelou ou deu erro
    if (err.name !== "NotAllowedError" && err.name !== "AbortError") {
      console.error("Erro ao registrar biometria:", err);
    }
    return false;
  }
}

/**
 * Realiza o login utilizando a biometria já registrada
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    const credentialIdBase64 = localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY);
    if (!credentialIdBase64) return false;

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const credentialIdBuffer = base64ToBuffer(credentialIdBase64);

    const requestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [
        {
          id: credentialIdBuffer,
          type: "public-key",
          transports: ["internal"],
        },
      ],
      userVerification: "required",
      timeout: 60000,
    };

    const assertion = await navigator.credentials.get({
      publicKey: requestOptions,
    });

    if (assertion) {
      // Biometria validada com sucesso! Salva a sessão por 7 dias.
      saveAuthSession(SESSION_DURATION_DAYS);
      return true;
    }

    return false;
  } catch (err: any) {
    if (err.name !== "NotAllowedError" && err.name !== "AbortError") {
      console.error("Erro na autenticação biométrica:", err);
    }
    return false;
  }
}

/**
 * Remove a biometria registrada neste dispositivo
 */
export function disableBiometrics(): void {
  localStorage.removeItem(BIOMETRIC_CREDENTIAL_KEY);
}
