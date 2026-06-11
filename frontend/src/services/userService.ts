import API_URL from "./api";
import { getToken } from "./token";

export interface UsuarioAdmin {
  rut: string;
  nombre_completo: string;
  correo: string;
  telefono: string | null;
  tipo_usuario: "CLIENTE" | "TECNICO" | "ADMIN";
  comuna_id_comuna?: number;
  estado_usuario?: boolean;
}

export interface UsuarioCreate {
  rut: string;
  nombre_completo: string;
  fecha_nacimiento: string;
  genero: string;
  correo: string;
  telefono: string;
  contrasena: string;
  comuna_id_comuna: number;
  tipo_usuario: "CLIENTE" | "TECNICO" | "ADMIN";
}

export async function getUsers(): Promise<UsuarioAdmin[]> {
  const token = getToken();

  const response = await fetch(`${API_URL}/usuarios/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener usuarios");
  }

  return response.json();
}

export async function createUser(data: UsuarioCreate): Promise<UsuarioAdmin> {
  const response = await fetch(`${API_URL}/usuarios/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || "Error al registrar usuario"
    );
  }

  return response.json();
}