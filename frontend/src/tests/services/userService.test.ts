import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  createUser,
  getUsers,
  type UsuarioCreate,
} from "../../services/userService"

const API_URL = "http://localhost:8000"
const fetchMock = vi.fn()

function mockJsonResponse(body: unknown, ok = true) {
  fetchMock.mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response)
}

describe("userService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.stubGlobal("fetch", fetchMock)
  })

  it("CP-SERV-USER-001 crea usuario exitosamente con payload esperado", async () => {
    const payload: UsuarioCreate = {
      rut: "12345678-5",
      nombre_completo: "Cliente FixYa",
      fecha_nacimiento: "1990-01-01",
      genero: "Masculino",
      correo: "cliente@fixya.cl",
      telefono: "912345678",
      contrasena: "Cliente1234",
      comuna_id_comuna: 10,
      tipo_usuario: "CLIENTE",
    }
    const responseBody = {
      rut: payload.rut,
      nombre_completo: payload.nombre_completo,
      correo: payload.correo,
      telefono: payload.telefono,
      tipo_usuario: "CLIENTE",
      comuna_id_comuna: 10,
      estado_usuario: true,
    }
    mockJsonResponse(responseBody)

    const result = await createUser(payload)

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/usuarios/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
    expect(result).toEqual(responseBody)
  })

  it("CP-SERV-USER-002 lanza mensaje del backend cuando crear usuario falla", async () => {
    mockJsonResponse({ detail: "El correo ya existe" }, false)

    await expect(
      createUser({
        rut: "12345678-5",
        nombre_completo: "Cliente FixYa",
        fecha_nacimiento: "1990-01-01",
        genero: "Masculino",
        correo: "cliente@fixya.cl",
        telefono: "912345678",
        contrasena: "Cliente1234",
        comuna_id_comuna: 10,
        tipo_usuario: "CLIENTE",
      })
    ).rejects.toThrow("El correo ya existe")
  })

  it("CP-SERV-USER-003 lista usuarios enviando Authorization Bearer", async () => {
    localStorage.setItem("token", "admin-token")
    const users = [
      {
        rut: "11.111.111-1",
        nombre_completo: "Admin FixYa",
        correo: "admin@fixya.cl",
        telefono: "+56911111111",
        tipo_usuario: "ADMIN",
        estado_usuario: true,
      },
    ]
    mockJsonResponse(users)

    const result = await getUsers()

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/usuarios/`, {
      method: "GET",
      headers: {
        Authorization: "Bearer admin-token",
      },
    })
    expect(result).toEqual(users)
  })
})
