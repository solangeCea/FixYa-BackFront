export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface Usuario {
  rut: string;
  nombre_completo: string;
  correo: string;
  telefono: string;
  tipo_usuario: string;
  comuna_id_comuna: number;
  estado_usuario: boolean;
}