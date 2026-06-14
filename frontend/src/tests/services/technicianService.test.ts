import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  getTechnicianProfile,
  getTechnicians,
  searchTechnicians,
} from "../../services/technicianService"

const API_URL = "http://localhost:8000"
const fetchMock = vi.fn()

function mockJsonResponse(body: unknown, ok = true) {
  fetchMock.mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response)
}

describe("technicianService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.stubGlobal("fetch", fetchMock)
  })

  it("CP-SERV-TECH-001 lista tecnicos exitosamente con Authorization Bearer", async () => {
    localStorage.setItem("token", "admin-token")
    const tecnicos = [
      {
        usuario_rut: "22.222.222-2",
        descripcion_perfil: "Gasfiter certificado",
        experiencia_anios: 5,
        nivel_tecnico: "Avanzado",
        tecnico_verificado: true,
      },
    ]
    mockJsonResponse(tecnicos)

    const result = await getTechnicians()

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/tecnicos/`, {
      method: "GET",
      headers: {
        Authorization: "Bearer admin-token",
      },
    })
    expect(result).toEqual(tecnicos)
  })

  it("CP-SERV-TECH-002 busca tecnicos por servicio y comuna construyendo la URL correcta", async () => {
    localStorage.setItem("token", "cliente-token")
    const tecnicos = [
      {
        usuario_rut: "22.222.222-2",
        nombre_completo: "Tecnico FixYa",
        servicios: ["Gasfiteria"],
        comunas: ["Santiago"],
      },
    ]
    mockJsonResponse(tecnicos)

    const result = await searchTechnicians(100, 10)

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/tecnicos/buscar?servicio_id=100&comuna_id=10`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer cliente-token",
        },
      }
    )
    expect(result).toEqual(tecnicos)
  })

  it("CP-SERV-TECH-003 obtiene perfil tecnico por RUT", async () => {
    localStorage.setItem("token", "tecnico-token")
    const perfil = {
      usuario_rut: "22.222.222-2",
      descripcion_perfil: "Electricista certificado",
      experiencia_anios: 3,
      nivel_tecnico: "Intermedio",
      tecnico_verificado: true,
    }
    mockJsonResponse(perfil)

    const result = await getTechnicianProfile("22.222.222-2")

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/tecnicos/22.222.222-2/perfil`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer tecnico-token",
        },
      }
    )
    expect(result).toEqual(perfil)
  })

  it("CP-SERV-TECH-004 lanza error controlado ante error del backend", async () => {
    localStorage.setItem("token", "admin-token")
    mockJsonResponse({ detail: "Error interno" }, false)

    await expect(getTechnicians()).rejects.toThrow(/Error al obtener/)
  })
})
