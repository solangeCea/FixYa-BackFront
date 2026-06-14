import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAuth } from "../../context/AuthContext"
import TecnicoDashboard from "../../pages/tecnico/TecnicoDashboard"
import { getServicios } from "../../services/catalogService"
import { createCotizacion } from "../../services/cotizacionService"
import {
  asignarTecnico,
  finalizarSolicitud,
  getSolicitudes,
  getSolicitudesTecnico,
  iniciarSolicitud,
} from "../../services/solicitudService"
import type { Solicitud } from "../../services/solicitudService"
import { getTechnicianDashboard } from "../../services/technicianService"
import type { TecnicoDashboardMetrics } from "../../services/technicianService"

vi.mock("../../components/Navbar", () => ({
  default: () => <nav aria-label="Navegacion principal">Navbar mock</nav>,
}))

vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}))

vi.mock("../../services/catalogService", () => ({
  getServicios: vi.fn(),
}))

vi.mock("../../services/cotizacionService", () => ({
  createCotizacion: vi.fn(),
}))

vi.mock("../../services/solicitudService", () => ({
  asignarTecnico: vi.fn(),
  finalizarSolicitud: vi.fn(),
  getSolicitudes: vi.fn(),
  getSolicitudesTecnico: vi.fn(),
  iniciarSolicitud: vi.fn(),
}))

vi.mock("../../services/technicianService", () => ({
  getTechnicianDashboard: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)
const mockGetServicios = vi.mocked(getServicios)
const mockCreateCotizacion = vi.mocked(createCotizacion)
const mockGetSolicitudes = vi.mocked(getSolicitudes)
const mockGetSolicitudesTecnico = vi.mocked(getSolicitudesTecnico)
const mockGetTechnicianDashboard = vi.mocked(getTechnicianDashboard)

const tecnicoRut = "22.222.222-2"

const solicitudDisponible: Solicitud = {
  id_solicitud: 501,
  usuario_rut: "11.111.111-1",
  servicio_id_servicio: 100,
  tecnico_usuario_rut: null,
  comuna_id_comuna: 10,
  titulo_solicitud: "Filtracion urgente en cocina",
  descripcion_problema: "Hay una fuga constante bajo el lavaplatos.",
  urgencia: "ALTA",
  direccion: "Av Tecnica 123",
  fecha_creacion: "2026-06-14",
  solicitud_activa: true,
  estado_trabajo: "INICIADO",
  tipo_problema: "Fuga de agua",
  foto_problema: null,
  ubicacion_problema_referencia: "Cocina, bajo el lavaplatos",
  costo_final: null,
  fecha_real: null,
}

const solicitudAsignada: Solicitud = {
  id_solicitud: 601,
  usuario_rut: "11.111.111-1",
  servicio_id_servicio: 200,
  tecnico_usuario_rut: tecnicoRut,
  comuna_id_comuna: 10,
  titulo_solicitud: "Instalacion de enchufes",
  descripcion_problema: "Necesito instalar dos enchufes nuevos.",
  urgencia: "MEDIA",
  direccion: "Pasaje Corriente 456",
  fecha_creacion: "2026-06-14",
  solicitud_activa: true,
  estado_trabajo: "ASIGNADO",
  tipo_problema: "Enchufe",
  foto_problema: null,
  ubicacion_problema_referencia: "Living principal",
  costo_final: null,
  fecha_real: null,
}

const metrics: TecnicoDashboardMetrics = {
  tecnico_usuario_rut: tecnicoRut,
  solicitudes_asignadas: 1,
  solicitudes_en_proceso: 0,
  solicitudes_finalizadas: 3,
  ingresos_totales: 250000,
  promedio_calificacion: 4.8,
  total_resenas: 12,
}

function renderTecnicoDashboard() {
  return render(<TecnicoDashboard />)
}

function getCotizacionDateInput() {
  const input = document.querySelector<HTMLInputElement>('input[type="date"]')

  if (!input) {
    throw new Error("No se encontro el campo de vigencia de cotizacion")
  }

  return input
}

async function waitForPanelReady() {
  expect(
    await screen.findByRole("heading", {
      name: /panel de trabajos t.cnicos/i,
    })
  ).toBeInTheDocument()
}

describe("TecnicoDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseAuth.mockReturnValue({
      usuario: {
        rut: tecnicoRut,
        nombre_completo: "Tecnico FixYa",
        correo: "tecnico@fixya.cl",
        telefono: "+56922222222",
        tipo_usuario: "TECNICO",
        comuna_id_comuna: 10,
        estado_usuario: true,
      },
      setUsuario: vi.fn(),
      loading: false,
      logout: vi.fn(),
    })
    mockGetSolicitudes.mockResolvedValue([solicitudDisponible])
    mockGetSolicitudesTecnico.mockResolvedValue([solicitudAsignada])
    mockGetServicios.mockResolvedValue([
      {
        id_servicio: 100,
        nombre_servicio: "Gasfiteria",
        estado_servicio: true,
      },
      {
        id_servicio: 200,
        nombre_servicio: "Electricidad",
        estado_servicio: true,
      },
    ])
    mockGetTechnicianDashboard.mockResolvedValue(metrics)
    mockCreateCotizacion.mockResolvedValue({
      id_cotizacion: 1,
      solicitud_id_solicitud: 601,
      tecnico_usuario_rut: tecnicoRut,
      monto_estimado: "85000",
      mensaje_cotizacion: "Incluye materiales y mano de obra.",
      fecha_vigencia: "2026-07-01T23:59:00.000Z",
      estado_cotizacion: "PENDIENTE",
    })
  })

  it("CP-TEC-001 renderiza el panel tecnico", async () => {
    renderTecnicoDashboard()

    await waitForPanelReady()

    expect(screen.getByText(/solicitudes y trabajos/i)).toBeInTheDocument()
    expect(screen.getAllByText(/solicitudes disponibles/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/mis trabajos/i)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /actualizar trabajos/i })
    ).toBeInTheDocument()
  })

  it("CP-TEC-002 carga solicitudes disponibles y asignadas para el tecnico", async () => {
    renderTecnicoDashboard()

    await waitForPanelReady()

    expect(mockGetSolicitudes).toHaveBeenCalledTimes(1)
    expect(mockGetSolicitudesTecnico).toHaveBeenCalledWith(tecnicoRut)
    expect(screen.getByText("Filtracion urgente en cocina")).toBeInTheDocument()
    expect(screen.getByText("Instalacion de enchufes")).toBeInTheDocument()
    expect(
      screen.getByText("Hay una fuga constante bajo el lavaplatos.")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Necesito instalar dos enchufes nuevos.")
    ).toBeInTheDocument()
  })

  it("CP-TEC-003 muestra estado controlado cuando no hay solicitudes", async () => {
    mockGetSolicitudes.mockResolvedValueOnce([])
    mockGetSolicitudesTecnico.mockResolvedValueOnce([])

    renderTecnicoDashboard()

    await waitForPanelReady()

    expect(
      screen.getByText(/a.n no hay solicitudes disponibles para tomar/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/a.n no tienes trabajos asignados/i)
    ).toBeInTheDocument()
  })

  it("CP-TEC-004 muestra error controlado si falla la carga de solicitudes", async () => {
    mockGetSolicitudes.mockRejectedValueOnce(new Error("Error 500"))

    renderTecnicoDashboard()

    await waitForPanelReady()

    expect(
      await screen.findByText(/no pudimos cargar tus trabajos/i)
    ).toBeInTheDocument()
    expect(screen.queryByText("Filtracion urgente en cocina")).not.toBeInTheDocument()
  })

  it("CP-TEC-005 visualiza informacion principal de una solicitud", async () => {
    renderTecnicoDashboard()

    await waitForPanelReady()

    expect(screen.getByText("Gasfiteria")).toBeInTheDocument()
    expect(screen.getByText("Av Tecnica 123")).toBeInTheDocument()
    expect(screen.getByText("Pasaje Corriente 456")).toBeInTheDocument()
    expect(screen.getAllByText(/urgencia:/i).length).toBeGreaterThan(0)
    expect(screen.getByText("Cocina, bajo el lavaplatos")).toBeInTheDocument()
    expect(screen.getByText("Living principal")).toBeInTheDocument()
  })

  it("CP-TEC-006 crea una cotizacion desde un trabajo asignado", async () => {
    renderTecnicoDashboard()

    await waitForPanelReady()

    fireEvent.change(
      screen.getByPlaceholderText(/monto estimado de la cotizaci.n/i),
      { target: { value: "85000" } }
    )
    fireEvent.change(
      screen.getByPlaceholderText(/detalle, alcance o condiciones/i),
      { target: { value: "Incluye materiales y mano de obra." } }
    )
    fireEvent.change(getCotizacionDateInput(), {
      target: { value: "2026-07-01" },
    })

    fireEvent.click(
      screen.getByRole("button", { name: /enviar cotizaci.n al cliente/i })
    )

    await waitFor(() => {
      expect(mockCreateCotizacion).toHaveBeenCalledTimes(1)
    })

    expect(mockCreateCotizacion).toHaveBeenCalledWith({
      solicitud_id_solicitud: 601,
      tecnico_usuario_rut: tecnicoRut,
      monto_estimado: 85000,
      mensaje_cotizacion: "Incluye materiales y mano de obra.",
      fecha_vigencia: new Date("2026-07-01T23:59:00").toISOString(),
    })
    expect(
      await screen.findByText(/cotizaci.n enviada y pdf generado correctamente/i)
    ).toBeInTheDocument()
  })
})
