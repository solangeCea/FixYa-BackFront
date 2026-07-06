import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import PlatformAnalytics from "../../components/analytics/PlatformAnalytics"
import { getAdminAnalytics } from "../../services/analyticsService"
import type { AdminAnaliticaData } from "../../services/analyticsService"

vi.mock("../../services/analyticsService", () => ({
  getAdminAnalytics: vi.fn(),
}))

const mockGetAdminAnalytics = vi.mocked(getAdminAnalytics)

const analiticaData: AdminAnaliticaData = {
  indicadores: {
    total_usuarios: 42,
    total_clientes: 27,
    total_tecnicos: 12,
    total_solicitudes: 18,
    solicitudes_pendientes: 4,
    solicitudes_asignadas: 3,
    solicitudes_en_proceso: 5,
    solicitudes_finalizadas: 5,
    solicitudes_canceladas: 1,
    tecnicos_pendientes: 3,
    tecnicos_activos: 9,
    reportes_pendientes: 2,
  },
  solicitudes_por_oficio: [
    { nombre: "Gasfitería", total: 8 },
    { nombre: "Electricidad", total: 6 },
  ],
  solicitudes_por_comuna: [{ nombre: "Santiago", total: 10 }],
  usuarios_por_mes: [
    { periodo: "2026-05", label: "may 2026", clientes: 10, tecnicos: 4, total: 14 },
    { periodo: "2026-06", label: "jun 2026", clientes: 15, tecnicos: 6, total: 21 },
  ],
  solicitudes_por_estado: [
    { estado: "INICIADO", label: "Pendientes", total: 4 },
    { estado: "FINALIZADO", label: "Finalizadas", total: 5 },
  ],
  tecnicos_por_oficio: [{ nombre: "Gasfitería", total: 5 }],
  clientes_por_comuna: [{ nombre: "Santiago", total: 20 }],
  tecnicos_por_comuna: [{ nombre: "Providencia", total: 3 }],
  problemas_frecuentes: [{ nombre: "Fuga de agua", total: 6 }],
  distribucion_etaria: [
    { rango: "18-25", total: 5 },
    { rango: "26-35", total: 10 },
  ],
  edad_promedio_clientes: 34.2,
  insights: {
    oficio_mas_solicitado: "Gasfitería",
    comuna_mayor_demanda: "Santiago",
    comuna_menor_cobertura: "Santiago",
    porcentaje_completadas: 27.8,
    promedio_solicitudes_mes: 9,
    crecimiento_usuarios_pct: 50,
    tendencia: "creciente",
  },
}

describe("PlatformAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAdminAnalytics.mockResolvedValue(analiticaData)
  })

  it("CP-ANALYTICS-001 renderiza la sección de análisis de la plataforma", async () => {
    render(<PlatformAnalytics />)

    expect(
      await screen.findByText(/del dato a la decisión/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/indicadores generales/i)).toBeInTheDocument()
    expect(screen.getByText(/indicadores inteligentes/i)).toBeInTheDocument()
    expect(screen.getByText(/impacto de la plataforma/i)).toBeInTheDocument()
  })

  it("CP-ANALYTICS-002 muestra insights calculados", async () => {
    render(<PlatformAnalytics />)

    await screen.findByText(/del dato a la decisión/i)

    expect(mockGetAdminAnalytics).toHaveBeenCalledTimes(1)
    expect(screen.getAllByText(/gasfitería/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/27\.8%/).length).toBeGreaterThan(0)
    expect(screen.getByText(/\+50% · creciente/i)).toBeInTheDocument()
  })

  it("CP-ANALYTICS-003 muestra error controlado si falla la carga", async () => {
    mockGetAdminAnalytics.mockRejectedValueOnce(new Error("Error 500"))

    render(<PlatformAnalytics />)

    expect(
      await screen.findByText(/no pudimos cargar el análisis/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /reintentar/i })
    ).toBeInTheDocument()
  })
})
