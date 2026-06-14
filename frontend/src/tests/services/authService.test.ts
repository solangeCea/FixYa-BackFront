import { beforeEach, describe, expect, it, vi } from "vitest"

import { login, obtenerUsuarioActual } from "../../services/authService"

const API_URL = "http://localhost:8000"
const fetchMock = vi.fn()

function mockJsonResponse(body: unknown, ok = true) {
  fetchMock.mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response)
}

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("fetch", fetchMock)
  })

  it("CP-SERV-AUTH-001 realiza login exitoso y retorna token", async () => {
    const responseBody = {
      access_token: "jwt-token",
      token_type: "bearer",
    }
    mockJsonResponse(responseBody)

    const result = await login("cliente@fixya.cl", "Cliente1234")

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/usuarios/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correo: "cliente@fixya.cl",
        contrasena: "Cliente1234",
      }),
    })
    expect(result).toEqual(responseBody)
  })

  it("CP-SERV-AUTH-002 lanza error controlado cuando login responde 401", async () => {
    mockJsonResponse({ detail: "Unauthorized" }, false)

    await expect(
      login("cliente@fixya.cl", "clave-incorrecta")
    ).rejects.toThrow("Credenciales incorrectas")
  })

  it("CP-SERV-AUTH-003 obtiene usuario actual enviando Authorization Bearer", async () => {
    const usuario = {
      rut: "11.111.111-1",
      nombre_completo: "Cliente FixYa",
      correo: "cliente@fixya.cl",
      telefono: "+56911111111",
      tipo_usuario: "CLIENTE",
      comuna_id_comuna: 1,
      estado_usuario: true,
    }
    mockJsonResponse(usuario)

    const result = await obtenerUsuarioActual("jwt-token")

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/usuarios/me`, {
      headers: {
        Authorization: "Bearer jwt-token",
      },
    })
    expect(result).toEqual(usuario)
  })

  it("CP-SERV-AUTH-004 lanza error controlado si no puede obtener usuario actual", async () => {
    mockJsonResponse({ detail: "Token invalido" }, false)

    await expect(obtenerUsuarioActual("token-invalido")).rejects.toThrow(
      "No se pudo obtener usuario"
    )
  })
})
