import API_URL from "./api";
import { getToken } from "./token";
import type { Usuario } from "../types/auth";

export interface UsuarioAdmin {
  rut: string;
  nombre_completo: string;
  correo: string;
  telefono: string | null;
  tipo_usuario: "CLIENTE" | "TECNICO" | "ADMIN";
  roles?: ("CLIENTE" | "TECNICO" | "ADMIN")[];
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

export interface RegistroTecnicoCreate extends UsuarioCreate {
  tipo_usuario: "TECNICO";
  descripcion_perfil: string;
  experiencia_anios: number;
  nivel_tecnico: string;
  servicios: number[];
  comunas: number[];
}

export async function setUserEstado(
  rut: string,
  estado: boolean
): Promise<{ rut: string; estado_usuario: boolean }> {
  const token = getToken();

  const response = await fetch(`${API_URL}/usuarios/${rut}/estado`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ estado_usuario: estado }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      typeof errorData?.detail === "string"
        ? errorData.detail
        : "No pudimos actualizar el estado del usuario."
    );
  }

  return response.json();
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

export interface PerfilUpdate {
  nombre_completo: string;
  correo: string;
  telefono: string;
  comuna_id_comuna: number;
  direccion?: string | null;
}

export interface PerfilUpdateResponse {
  usuario: Usuario;
  access_token: string;
  token_type: string;
}

export async function updateMyProfile(
  data: PerfilUpdate
): Promise<PerfilUpdateResponse> {
  const token = getToken();

  const response = await fetch(`${API_URL}/usuarios/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      typeof errorData?.detail === "string"
        ? errorData.detail
        : "No pudimos actualizar tu perfil."
    );
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

export async function registerTechnician(
  data: RegistroTecnicoCreate
): Promise<{ mensaje: string; estado_verificacion: string }> {
  const response = await fetch(`${API_URL}/usuarios/registro-tecnico`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || "Error al registrar tecnico"
    );
  }

  return response.json();
}
