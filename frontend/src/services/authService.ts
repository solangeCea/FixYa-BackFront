import API_URL from "./api";

export async function login(
  correo: string,
  contrasena: string
) {
  const response = await fetch(
    `${API_URL}/usuarios/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correo,
        contrasena,
      }),
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    // Relaya el motivo real del backend (cuenta desactivada, credenciales, etc.).
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "No pudimos iniciar sesión. Intenta nuevamente."
    );
  }

  return response.json();
}

export async function obtenerUsuarioActual(
  token: string
) {
  const response = await fetch(
    `${API_URL}/usuarios/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("No se pudo obtener usuario");
  }

  return response.json();
}