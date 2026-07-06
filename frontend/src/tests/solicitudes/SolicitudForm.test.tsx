import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAuth } from "../../context/AuthContext"
import ClienteDashboard from "../../pages/cliente/ClienteDashboard"
import { getComunas, getRegiones, getServicios } from "../../services/catalogService"
import { getCotizacionesSolicitud } from "../../services/cotizacionService"
import {
  createSolicitud,
  getSolicitudesCliente,
} from "../../services/solicitudService"

vi.mock("../../components/Navbar", () => ({
  default: () => <nav aria-label="Navegacion principal">Navbar mock</nav>,
}))

vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}))

vi.mock("../../services/catalogService", () => ({
  getComunas: vi.fn(),
  getRegiones: vi.fn(),
  getServicios: vi.fn(),
}))

vi.mock("../../services/solicitudService", () => ({
  createSolicitud: vi.fn(),
  getSolicitudesCliente: vi.fn(),
}))

vi.mock("../../services/cotizacionService", () => ({
  acceptCotizacion: vi.fn(),
  getCotizacionesSolicitud: vi.fn(),
  rejectCotizacion: vi.fn(),
}))

vi.mock("../../services/reviewService", () => ({
  createReview: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)
const mockGetServicios = vi.mocked(getServicios)
const mockGetRegiones = vi.mocked(getRegiones)
const mockGetComunas = vi.mocked(getComunas)
const mockCreateSolicitud = vi.mocked(createSolicitud)
const mockGetSolicitudesCliente = vi.mocked(getSolicitudesCliente)
const mockGetCotizacionesSolicitud = vi.mocked(getCotizacionesSolicitud)

function renderSolicitudForm() {
  return render(
    <MemoryRouter initialEntries={["/cliente/dashboard"]}>
      <ClienteDashboard />
    </MemoryRouter>
  )
}

function getSolicitudForm() {
  const button = screen.getByRole("button", { name: /solicitar servicio/i })
  const form = button.closest("form")

  if (!form) {
    throw new Error("No se encontro el formulario de solicitud")
  }

  return form
}

async function waitForSolicitudFormReady() {
  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: /solicitar servicio/i })
    ).toBeEnabled()
  })
}

describe("SolicitudForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseAuth.mockReturnValue({
      usuario: {
        rut: "11.111.111-1",
        nombre_completo: "Cliente FixYa",
        correo: "cliente@fixya.cl",
        telefono: "+56911111111",
        tipo_usuario: "CLIENTE",
        comuna_id_comuna: 10,
        estado_usuario: true,
      },
      setUsuario: vi.fn(),
      loading: false,
      logout: vi.fn(),
    })
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
      {
        id_servicio: 300,
        nombre_servicio: "Servicio inactivo",
        estado_servicio: false,
      },
    ])
    mockGetRegiones.mockResolvedValue([
      {
        id_region: 1,
        nombre_region: "Región Metropolitana",
      },
    ])
    mockGetComunas.mockResolvedValue([
      {
        id_comuna: 10,
        nombre_comuna: "Santiago",
        region_id_region: 1,
      },
    ])
    mockGetSolicitudesCliente.mockResolvedValue([])
    mockGetCotizacionesSolicitud.mockResolvedValue([])
    mockCreateSolicitud.mockResolvedValue({
      id_solicitud: 1,
      usuario_rut: "11.111.111-1",
      servicio_id_servicio: 100,
      tecnico_usuario_rut: null,
      comuna_id_comuna: 10,
      titulo_solicitud: "Filtracion bajo el lavaplatos",
      descripcion_problema: "Hay una fuga constante bajo el lavaplatos.",
      urgencia: "MEDIA",
      direccion: "Av Siempre Viva 123",
      fecha_creacion: "2026-06-14",
      solicitud_activa: true,
      estado_trabajo: "INICIADO",
      tipo_problema: "Fuga de agua",
      foto_problema: null,
      ubicacion_problema_referencia: "Cocina, bajo el lavaplatos",
      costo_final: null,
      fecha_real: null,
    })
  })

  it("CP-SOL-001 renderiza el formulario de solicitud con sus campos principales", async () => {
    renderSolicitudForm()

    expect(
      screen.getByRole("heading", { name: /solicitar servicio/i })
    ).toBeInTheDocument()

    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)

    expect(
      solicitudForm.getByLabelText(/servicio que necesitas/i)
    ).toBeInTheDocument()
    expect(solicitudForm.getByLabelText(/^regi.n/i)).toBeInTheDocument()
    expect(solicitudForm.getByLabelText(/^comuna/i)).toBeInTheDocument()
    expect(solicitudForm.getByLabelText(/t.tulo breve/i)).toBeInTheDocument()
    expect(
      solicitudForm.getByLabelText(/describe qu. ocurre/i)
    ).toBeInTheDocument()
    expect(solicitudForm.getByLabelText(/urgencia/i)).toBeInTheDocument()
    expect(solicitudForm.getByLabelText(/direcci.n/i)).toBeInTheDocument()
    expect(
      solicitudForm.getByLabelText(/^tipo de problema/i)
    ).toBeInTheDocument()
    expect(solicitudForm.getByLabelText(/foto del problema/i)).toBeInTheDocument()
    expect(
      solicitudForm.getByLabelText(/referencia de ubicaci.n/i)
    ).toBeInTheDocument()
  })

  it("CP-SOL-002 valida campos obligatorios antes de llamar al backend", async () => {
    const user = userEvent.setup()

    renderSolicitudForm()
    await waitForSolicitudFormReady()

    await user.click(screen.getByRole("button", { name: /solicitar servicio/i }))

    expect(mockCreateSolicitud).not.toHaveBeenCalled()
    expect(
      screen.getByText(/escribe un t.tulo breve para tu solicitud/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/describe qu. ocurre para orientar al t.cnico/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/ingresa la direcci.n donde necesitas el servicio/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/seg.n el servicio/i)).toBeInTheDocument()
    expect(
      screen.getByText(/agrega una referencia para ubicar mejor el problema/i)
    ).toBeInTheDocument()
  })

  it("CP-SOL-003 carga servicios activos disponibles para seleccionar", async () => {
    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const servicioSelect = screen.getByLabelText(
      /servicio que necesitas/i
    ) as HTMLSelectElement

    expect(within(servicioSelect).getByText("Gasfiteria")).toBeInTheDocument()
    expect(within(servicioSelect).getByText("Electricidad")).toBeInTheDocument()
    expect(
      within(servicioSelect).queryByText("Servicio inactivo")
    ).not.toBeInTheDocument()
    expect(mockGetServicios).toHaveBeenCalled()
  })

  it("CP-SOL-004 crea una solicitud con datos validos", async () => {
    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)

    fireEvent.change(solicitudForm.getByLabelText(/servicio que necesitas/i), {
      target: { value: "100" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/^regi.n/i), {
      target: { value: "1" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/^comuna/i), {
      target: { value: "10" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/t.tulo breve/i), {
      target: { value: "Filtracion bajo el lavaplatos" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/describe qu. ocurre/i), {
      target: { value: "Hay una fuga constante bajo el lavaplatos." },
    })
    fireEvent.change(solicitudForm.getByLabelText(/urgencia/i), {
      target: { value: "ALTA" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/direcci.n/i), {
      target: { value: "Av Siempre Viva 123" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/^tipo de problema/i), {
      target: { value: "Fuga de agua" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/referencia de ubicaci.n/i), {
      target: { value: "Cocina, bajo el lavaplatos" },
    })

    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockCreateSolicitud).toHaveBeenCalledTimes(1)
    })

    expect(mockCreateSolicitud).toHaveBeenCalledWith({
      usuario_rut: "11.111.111-1",
      servicio_id_servicio: 100,
      comuna_id_comuna: 10,
      titulo_solicitud: "Filtracion bajo el lavaplatos",
      descripcion_problema: "Hay una fuga constante bajo el lavaplatos.",
      urgencia: "ALTA",
      direccion: "Av Siempre Viva 123",
      tipo_problema: "Fuga de agua",
      foto_problema: null,
      ubicacion_problema_referencia: "Cocina, bajo el lavaplatos",
    })
    expect(
      await screen.findByText(/solicitud enviada correctamente/i)
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/escribe un t.tulo breve para tu solicitud/i)
    ).not.toBeInTheDocument()
  })

  it("CP-SOL-005 cambia el tipo de problema segun el servicio seleccionado", async () => {
    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)
    const servicioSelect = solicitudForm.getByLabelText(
      /servicio que necesitas/i
    ) as HTMLSelectElement
    const tipoProblemaSelect = solicitudForm.getByLabelText(
      /^tipo de problema/i
    ) as HTMLSelectElement

    fireEvent.change(servicioSelect, { target: { value: "200" } })

    await waitFor(() => {
      expect(within(tipoProblemaSelect).getByText("Enchufe")).toBeInTheDocument()
    })
    expect(within(tipoProblemaSelect).getByText("Cables")).toBeInTheDocument()
    expect(
      within(tipoProblemaSelect).getByText(/iluminaci.n/i)
    ).toBeInTheDocument()

    fireEvent.change(tipoProblemaSelect, { target: { value: "Enchufe" } })
    expect(tipoProblemaSelect).toHaveValue("Enchufe")

    fireEvent.change(servicioSelect, { target: { value: "100" } })

    await waitFor(() => {
      expect(
        within(tipoProblemaSelect).getByText("Fuga de agua")
      ).toBeInTheDocument()
    })
    expect(within(tipoProblemaSelect).getByText(/ca.er.a/i)).toBeInTheDocument()
    expect(within(tipoProblemaSelect).getByText(/ba.o/i)).toBeInTheDocument()
    expect(
      within(tipoProblemaSelect).queryByText("Enchufe")
    ).not.toBeInTheDocument()
    expect(tipoProblemaSelect).toHaveValue("")
  })

  it("CP-SOL-006 muestra error si el backend falla al crear la solicitud", async () => {
    mockCreateSolicitud.mockRejectedValueOnce(new Error("Error 500"))

    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)
    const tituloInput = solicitudForm.getByLabelText(/t.tulo breve/i)
    const descripcionInput = solicitudForm.getByLabelText(/describe qu. ocurre/i)
    const direccionInput = solicitudForm.getByLabelText(/direcci.n/i)
    const tipoProblemaSelect = solicitudForm.getByLabelText(
      /^tipo de problema/i
    )
    const referenciaInput = solicitudForm.getByLabelText(
      /referencia de ubicaci.n/i
    )

    fireEvent.change(solicitudForm.getByLabelText(/servicio que necesitas/i), {
      target: { value: "100" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/^regi.n/i), {
      target: { value: "1" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/^comuna/i), {
      target: { value: "10" },
    })
    fireEvent.change(tituloInput, {
      target: { value: "Filtracion bajo el lavaplatos" },
    })
    fireEvent.change(descripcionInput, {
      target: { value: "Hay una fuga constante bajo el lavaplatos." },
    })
    fireEvent.change(solicitudForm.getByLabelText(/urgencia/i), {
      target: { value: "ALTA" },
    })
    fireEvent.change(direccionInput, {
      target: { value: "Av Siempre Viva 123" },
    })
    fireEvent.change(tipoProblemaSelect, {
      target: { value: "Fuga de agua" },
    })
    fireEvent.change(referenciaInput, {
      target: { value: "Cocina, bajo el lavaplatos" },
    })

    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockCreateSolicitud).toHaveBeenCalledTimes(1)
    })

    expect(
      await screen.findByText(/no pudimos enviar la solicitud/i)
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/solicitud enviada correctamente/i)
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /solicitar servicio/i })
    ).toBeEnabled()
    expect(tituloInput).toHaveValue("Filtracion bajo el lavaplatos")
    expect(descripcionInput).toHaveValue(
      "Hay una fuga constante bajo el lavaplatos."
    )
    expect(direccionInput).toHaveValue("Av Siempre Viva 123")
    expect(tipoProblemaSelect).toHaveValue("Fuga de agua")
    expect(referenciaInput).toHaveValue("Cocina, bajo el lavaplatos")
  })
})
