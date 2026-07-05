import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import AdminDashboard from "../../pages/admin/AdminDashboard"
import { getAdminDashboard } from "../../services/dashboardService"
import type { AdminDashboardData } from "../../services/dashboardService"

vi.mock("../../services/dashboardService", () => ({
  getAdminDashboard: vi.fn(),
}))

const mockGetAdminDashboard = vi.mocked(getAdminDashboard)

const dashboardData: AdminDashboardData = {
  total_usuarios: 42,
  total_tecnicos: 12,
  total_clientes: 27,
  total_admins: 3,
  tecnicos_verificados: 9,
  tecnicos_pendientes: 3,
  total_solicitudes: 18,
  solicitudes_iniciadas: 4,
  solicitudes_asignadas: 5,
  solicitudes_en_proceso: 6,
  solicitudes_activas: 15,
  solicitudes_finalizadas: 2,
  solicitudes_canceladas: 1,
  total_resenas: 11,
  resenas_activas: 8,
  resenas_reportadas: 2,
  total_cotizaciones: 7,
  reportes_solicitudes_pendientes: 1,
  promedio_general_calificaciones: 4.6,
}

function renderAdminDashboard() {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  )
}

describe("AdminDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAdminDashboard.mockResolvedValue(dashboardData)
  })

  it("CP-ADMIN-001 renderiza el dashboard administrativo", async () => {
    renderAdminDashboard()

    expect(
      await screen.findByRole("heading", { name: /resumen operativo/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/panel administrativo/i)).toBeInTheDocument()
    expect(screen.getByText(/estado del sistema/i)).toBeInTheDocument()
    expect(screen.getByText(/acciones r.pidas/i)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /actualizar panel/i })
    ).toBeInTheDocument()
  })

  it("CP-ADMIN-002 carga metricas principales del dashboard", async () => {
    renderAdminDashboard()

    await screen.findByRole("heading", { name: /resumen operativo/i })

    expect(mockGetAdminDashboard).toHaveBeenCalledTimes(1)
    expect(screen.getAllByText("Usuarios").length).toBeGreaterThan(0)
    expect(screen.getAllByText("42").length).toBeGreaterThan(0)
    expect(screen.getByText(/t.cnicos verificados/i)).toBeInTheDocument()
    expect(screen.getAllByText("9").length).toBeGreaterThan(0)
    expect(screen.getByText(/reportes pendientes/i)).toBeInTheDocument()
    expect(screen.getAllByText("3").length).toBeGreaterThan(0)
    expect(screen.getAllByText(/cotizaciones/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText("7").length).toBeGreaterThan(0)
  })

  it("CP-ADMIN-003 muestra error controlado si fallan las metricas", async () => {
    mockGetAdminDashboard.mockRejectedValueOnce(new Error("Error 500"))

    renderAdminDashboard()

    expect(
      await screen.findByText(/no pudimos cargar el resumen administrativo/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /reintentar carga del panel/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: /resumen operativo/i })
    ).not.toBeInTheDocument()
  })
})
