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
    throw new Error("Credenciales incorrectas");
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