import API_URL from "./api";
import { getToken, removeToken } from "./token";

let instalado = false;

// Instala un interceptor global sobre window.fetch: si una llamada a la API
// responde 401 (token expirado o inválido) teniendo sesión activa, cierra la
// sesión y redirige a /login. Evita que la app quede "colgada" con spinners o
// listas vacías cuando el token vence a mitad de sesión.
export function installAuthInterceptor() {
  if (instalado) return;
  instalado = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init);

    try {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : String(input);

      const esApi = url.startsWith(API_URL);
      const esLogin = url.includes("/usuarios/login");

      if (response.status === 401 && esApi && !esLogin && getToken()) {
        removeToken();
        if (!window.location.pathname.startsWith("/login")) {
          window.location.assign("/login?expired=1");
        }
      }
    } catch {
      // Nunca romper la respuesta por un fallo del interceptor.
    }

    return response;
  };
}
