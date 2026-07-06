import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAuth } from "../../context/AuthContext"
import ClienteDashboard from "../../pages/cliente/ClienteDashboard"
import {
  getComunas,
  getRegiones,
  getServicios,
} from "../../services/catalogService"
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

function changeSelectByOptionText(
  select: HTMLElement,
  optionName: RegExp
) {
  const option = within(select).getByText(optionName) as HTMLOptionElement

  fireEvent.change(select, {
    target: { value: option.value },
  })
}

function fillRequiredSolicitudFields(solicitudForm: ReturnType<typeof within>) {
  fireEvent.change(solicitudForm.getByLabelText(/servicio que necesitas/i), {
    target: { value: "100" },
  })
  fireEvent.change(solicitudForm.getByLabelText(/regi.n/i), {
    target: { value: "1" },
  })
  fireEvent.change(solicitudForm.getByLabelText(/comuna del servicio/i), {
    target: { value: "10" },
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
  fireEvent.change(solicitudForm.getByLabelText(/^tipo de problema$/i), {
    target: { value: "Fuga de agua" },
  })
  fireEvent.change(
    solicitudForm.getByLabelText(/parte del inmueble/i),
    {
      target: { value: "Cocina, bajo el lavaplatos" },
    }
  )
}

function selectAvailabilityDay(
  solicitudForm: ReturnType<typeof within>,
  dayName: RegExp
) {
  fireEvent.click(solicitudForm.getByRole("button", { name: dayName }))
}

function fillCasaContext(solicitudForm: ReturnType<typeof within>) {
  fireEvent.change(
    solicitudForm.getByLabelText(/d.nde se realizar. el trabajo/i),
    {
      target: { value: "Casa" },
    }
  )
  fireEvent.change(
    solicitudForm.getByLabelText(/estacionamiento disponible/i),
    {
      target: { value: "SI" },
    }
  )
  fireEvent.change(solicitudForm.getByLabelText(/mascotas en el domicilio/i), {
    target: { value: "NO" },
  })
  fireEvent.change(solicitudForm.getByLabelText(/instrucciones para ingresar/i), {
    target: { value: "Acceso por porton lateral" },
  })
  fireEvent.change(solicitudForm.getByLabelText(/instrucciones para ingresar/i), {
    target: { value: "Tocar timbre principal" },
  })
  selectAvailabilityDay(solicitudForm, /lunes/i)
}

function fillDepartamentoContext(
  solicitudForm: ReturnType<typeof within>,
  tipoInmueble = "Departamento"
) {
  fireEvent.change(
    solicitudForm.getByLabelText(/d.nde se realizar. el trabajo/i),
    {
      target: { value: tipoInmueble },
    }
  )
  fireEvent.change(
    solicitudForm.getByLabelText(/n.mero de departamento u oficina/i),
    {
      target: { value: tipoInmueble === "Edificio" ? "Oficina 1201" : "804" },
    }
  )
  fireEvent.change(solicitudForm.getByLabelText(/^piso$/i), {
    target: { value: tipoInmueble === "Edificio" ? "12" : "8" },
  })
  fireEvent.change(solicitudForm.getByLabelText(/conserjer.a/i), {
    target: { value: "SI" },
  })
  fireEvent.change(solicitudForm.getByLabelText(/requiere autorizaci.n/i), {
    target: { value: tipoInmueble === "Edificio" ? "SI" : "NO" },
  })
  fireEvent.change(
    solicitudForm.getByLabelText(/horario permitido para trabajos/i),
    {
      target: {
        value:
          tipoInmueble === "Edificio"
            ? "Martes y jueves de 14:00 a 18:00"
            : "Lunes a viernes de 09:00 a 18:00",
      },
    }
  )
  fireEvent.change(solicitudForm.getByLabelText(/instrucciones para ingresar/i), {
    target: {
      value:
        tipoInmueble === "Edificio"
          ? "Registrar visita en recepcion"
          : "Anunciarse en conserjeria",
    },
  })
  fireEvent.change(
    solicitudForm.getByLabelText(/instrucciones para ingresar/i),
    {
      target: {
        value:
          tipoInmueble === "Edificio"
            ? "Solicitar tarjeta de acceso"
            : "Usar ascensor de visitas",
      },
    }
  )
  selectAvailabilityDay(solicitudForm, /mi.rcoles/i)
  fireEvent.click(solicitudForm.getByRole("button", { name: /tarde/i }))
}

function fillLocalComercialContext(solicitudForm: ReturnType<typeof within>) {
  fireEvent.change(
    solicitudForm.getByLabelText(/d.nde se realizar. el trabajo/i),
    {
      target: { value: "Local comercial" },
    }
  )
  fireEvent.change(solicitudForm.getByLabelText(/horario de atenci.n/i), {
    target: { value: "Lunes a sabado 10:00 a 20:00" },
  })
  fireEvent.change(solicitudForm.getByLabelText(/fuera de horario/i), {
    target: { value: "SI" },
  })
  fireEvent.change(solicitudForm.getByLabelText(/persona de contacto/i), {
    target: { value: "Camila Perez" },
  })
  fireEvent.change(solicitudForm.getByLabelText(/tel.fono de contacto/i), {
    target: { value: "+56912345678" },
  })
  fireEvent.change(solicitudForm.getByLabelText(/local estar. funcionando/i), {
    target: { value: "NO" },
  })
  fireEvent.change(solicitudForm.getByLabelText(/instrucciones para ingresar/i), {
    target: { value: "Ingreso por caja principal" },
  })
  fireEvent.change(
    solicitudForm.getByLabelText(/instrucciones para ingresar/i),
    {
      target: { value: "Coordinar apertura con administrador" },
    }
  )
  selectAvailabilityDay(solicitudForm, /s.bado/i)
  fireEvent.change(solicitudForm.getByLabelText(/desde s.bado/i), {
    target: { value: "10:00" },
  })
  fireEvent.change(solicitudForm.getByLabelText(/hasta s.bado/i), {
    target: { value: "14:00" },
  })
}

function submitFormAndWaitForCreate(form: HTMLFormElement) {
  fireEvent.submit(form)

  return waitFor(() => {
    expect(mockCreateSolicitud).toHaveBeenCalledTimes(1)
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
        nombre_region: "Region Metropolitana",
      },
      {
        id_region: 2,
        nombre_region: "Valparaiso",
      },
    ])
    mockGetComunas.mockResolvedValue([
      {
        id_comuna: 10,
        nombre_comuna: "Santiago",
        region_id_region: 1,
      },
      {
        id_comuna: 20,
        nombre_comuna: "Valparaiso",
        region_id_region: 2,
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
      titulo_solicitud: "Gasfiteria - Fuga de agua",
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
    expect(solicitudForm.getByLabelText(/regi.n/i)).toBeInTheDocument()
    expect(
      solicitudForm.getByLabelText(/comuna del servicio/i)
    ).toBeInTheDocument()
    expect(
      solicitudForm.queryByLabelText(/t.tulo breve/i)
    ).not.toBeInTheDocument()
    expect(
      solicitudForm.getByLabelText(/describe qu. ocurre/i)
    ).toBeInTheDocument()
    expect(solicitudForm.getByLabelText(/urgencia/i)).toBeInTheDocument()
    expect(solicitudForm.getByLabelText(/direcci.n/i)).toBeInTheDocument()
    expect(
      solicitudForm.getByLabelText(/d.nde se realizar. el trabajo/i)
    ).toBeInTheDocument()
    expect(
      solicitudForm.getByLabelText(/^tipo de problema$/i)
    ).toBeInTheDocument()
    expect(
      solicitudForm.getByLabelText(/foto del problema/i)
    ).toHaveAttribute("type", "file")
    expect(
      solicitudForm.getByLabelText(/parte del inmueble/i)
    ).toBeInTheDocument()
  })

  it("CP-SOL-002 valida campos obligatorios antes de llamar al backend", async () => {
    const user = userEvent.setup()

    renderSolicitudForm()
    await waitForSolicitudFormReady()

    await user.click(screen.getByRole("button", { name: /solicitar servicio/i }))

    expect(mockCreateSolicitud).not.toHaveBeenCalled()
    expect(screen.getByText("Selecciona una región.")).toBeInTheDocument()
    expect(screen.getByText("Selecciona una comuna.")).toBeInTheDocument()
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
    expect(
      screen.getByText(/selecciona d.nde se realizar. el trabajo/i)
    ).toBeInTheDocument()
  }, 10000)

  it("CP-SOL-002B valida largos minimos antes de llamar al backend", async () => {
    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)

    fillRequiredSolicitudFields(solicitudForm)
    fillCasaContext(solicitudForm)
    fireEvent.change(solicitudForm.getByLabelText(/describe qu. ocurre/i), {
      target: { value: "Fuga" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/direcci.n/i), {
      target: { value: "Av 1" },
    })

    fireEvent.submit(form)

    expect(mockCreateSolicitud).not.toHaveBeenCalled()
    expect(
      screen.getByText(/problema con al menos 20 caracteres/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/direcci.n con al menos 10 caracteres/i)
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

  it("CP-SOL-003B filtra comunas segun la region seleccionada", async () => {
    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)
    const regionSelect = solicitudForm.getByLabelText(/regi.n/i)
    const comunaSelect = solicitudForm.getByLabelText(
      /comuna del servicio/i
    ) as HTMLSelectElement

    expect(comunaSelect).toBeDisabled()

    fireEvent.change(regionSelect, { target: { value: "1" } })

    expect(comunaSelect).toBeEnabled()
    expect(within(comunaSelect).getByText("Santiago")).toBeInTheDocument()
    expect(within(comunaSelect).queryByText("Valparaiso")).not.toBeInTheDocument()

    fireEvent.change(comunaSelect, { target: { value: "10" } })
    expect(comunaSelect).toHaveValue("10")

    fireEvent.change(regionSelect, { target: { value: "2" } })

    expect(comunaSelect).toHaveValue("0")
    expect(within(comunaSelect).getByText("Valparaiso")).toBeInTheDocument()
    expect(within(comunaSelect).queryByText("Santiago")).not.toBeInTheDocument()
  })

  it("CP-SOL-003C permite adjuntar una foto valida sin usar URL", async () => {
    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)
    const fotoInput = solicitudForm.getByLabelText(
      /foto del problema/i
    ) as HTMLInputElement
    const file = new File(["imagen"], "filtracion.webp", {
      type: "image/webp",
    })

    fireEvent.change(fotoInput, { target: { files: [file] } })
    expect(screen.getByText("filtracion.webp")).toBeInTheDocument()

    fillRequiredSolicitudFields(solicitudForm)
    fillCasaContext(solicitudForm)
    await submitFormAndWaitForCreate(form)

    expect(mockCreateSolicitud).toHaveBeenCalledWith(
      expect.objectContaining({
        foto_problema: "filtracion.webp",
      })
    )
  })

  it("CP-SOL-004 crea una solicitud para casa con datos validos", async () => {
    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)

    fireEvent.change(solicitudForm.getByLabelText(/servicio que necesitas/i), {
      target: { value: "100" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/regi.n/i), {
      target: { value: "1" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/comuna del servicio/i), {
      target: { value: "10" },
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
    fireEvent.change(solicitudForm.getByLabelText(/^tipo de problema$/i), {
      target: { value: "Fuga de agua" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/parte del inmueble/i), {
      target: { value: "Cocina, bajo el lavaplatos" },
    })
    fillCasaContext(solicitudForm)

    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockCreateSolicitud).toHaveBeenCalledTimes(1)
    })

    expect(mockCreateSolicitud).toHaveBeenCalledWith({
      usuario_rut: "11.111.111-1",
      servicio_id_servicio: 100,
      comuna_id_comuna: 10,
      titulo_solicitud: "Gasfiteria - Fuga de agua",
      descripcion_problema: "Hay una fuga constante bajo el lavaplatos.",
      urgencia: "ALTA",
      direccion: "Av Siempre Viva 123",
      tipo_problema: "Fuga de agua",
      foto_problema: null,
      ubicacion_problema_referencia: "Cocina, bajo el lavaplatos",
      tipo_inmueble: "Casa",
      detalle_inmueble: null,
      piso: null,
      numero_departamento: null,
      tiene_conserjeria: null,
      requiere_autorizacion: null,
      horario_disponible: "Disponibilidad cliente: lunes de 09:00 a 13:00",
      disponibilidad_horaria: [
        { dia: "LUNES", hora_inicio: "09:00", hora_fin: "13:00" },
      ],
      condiciones_acceso: null,
      instrucciones_acceso: "Tocar timbre principal",
      persona_contacto: null,
      telefono_contacto: null,
      estacionamiento_disponible: true,
      tiene_mascotas: false,
    })
    expect(
      await screen.findByText(/solicitud enviada correctamente/i)
    ).toBeInTheDocument()
    expect(solicitudForm.queryByLabelText(/t.tulo breve/i)).not.toBeInTheDocument()
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
      /^tipo de problema$/i
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
    const descripcionInput = solicitudForm.getByLabelText(/describe qu. ocurre/i)
    const direccionInput = solicitudForm.getByLabelText(/direcci.n/i)
    const tipoProblemaSelect = solicitudForm.getByLabelText(
      /^tipo de problema$/i
    )
    const referenciaInput = solicitudForm.getByLabelText(
      /parte del inmueble/i
    )

    fireEvent.change(solicitudForm.getByLabelText(/servicio que necesitas/i), {
      target: { value: "100" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/regi.n/i), {
      target: { value: "1" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/comuna del servicio/i), {
      target: { value: "10" },
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
    fillCasaContext(solicitudForm)

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
    expect(descripcionInput).toHaveValue(
      "Hay una fuga constante bajo el lavaplatos."
    )
    expect(direccionInput).toHaveValue("Av Siempre Viva 123")
    expect(tipoProblemaSelect).toHaveValue("Fuga de agua")
    expect(referenciaInput).toHaveValue("Cocina, bajo el lavaplatos")
    expect(solicitudForm.getByLabelText(/desde lunes/i)).toHaveValue("09:00")
    expect(solicitudForm.getByLabelText(/hasta lunes/i)).toHaveValue("13:00")
    expect(screen.getByText(/lunes de 09:00 a 13:00/i)).toBeInTheDocument()
  })

  it("CP-SOL-007 crea una solicitud para departamento con contexto de acceso", async () => {
    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)

    fillRequiredSolicitudFields(solicitudForm)
    fillDepartamentoContext(solicitudForm)
    await submitFormAndWaitForCreate(form)

    expect(mockCreateSolicitud).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo_inmueble: "Departamento",
        numero_departamento: "804",
        piso: "8",
        tiene_conserjeria: true,
        requiere_autorizacion: false,
        horario_disponible:
          "Disponibilidad cliente: miércoles de 15:00 a 19:00 | Horario permitido para trabajos: Lunes a viernes de 09:00 a 18:00",
        disponibilidad_horaria: [
          { dia: "MIERCOLES", hora_inicio: "15:00", hora_fin: "19:00" },
        ],
        condiciones_acceso: null,
        instrucciones_acceso: "Usar ascensor de visitas",
        estacionamiento_disponible: null,
        tiene_mascotas: null,
      })
    )
  })

  it("CP-SOL-008 crea una solicitud para edificio con autorizacion requerida", async () => {
    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)

    fillRequiredSolicitudFields(solicitudForm)
    fillDepartamentoContext(solicitudForm, "Edificio")
    await submitFormAndWaitForCreate(form)

    expect(mockCreateSolicitud).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo_inmueble: "Edificio",
        numero_departamento: "Oficina 1201",
        piso: "12",
        tiene_conserjeria: true,
        requiere_autorizacion: true,
        horario_disponible:
          "Disponibilidad cliente: miércoles de 15:00 a 19:00 | Horario permitido para trabajos: Martes y jueves de 14:00 a 18:00",
        disponibilidad_horaria: [
          { dia: "MIERCOLES", hora_inicio: "15:00", hora_fin: "19:00" },
        ],
        condiciones_acceso: null,
        instrucciones_acceso: "Solicitar tarjeta de acceso",
      })
    )
  })

  it("CP-SOL-009 crea una solicitud para local comercial con contacto y horario", async () => {
    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)

    fillRequiredSolicitudFields(solicitudForm)
    fillLocalComercialContext(solicitudForm)
    await submitFormAndWaitForCreate(form)

    expect(mockCreateSolicitud).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo_inmueble: "Local comercial",
        persona_contacto: "Camila Perez",
        telefono_contacto: "+56912345678",
        disponibilidad_horaria: [
          { dia: "SABADO", hora_inicio: "10:00", hora_fin: "14:00" },
        ],
        condiciones_acceso: expect.stringContaining("Trabajo fuera de horario"),
        instrucciones_acceso: "Coordinar apertura con administrador",
      })
    )
    const localPayload = mockCreateSolicitud.mock.calls[0][0]
    expect(localPayload.horario_disponible).toContain("sábado de 10:00 a 14:00")
    expect(localPayload.horario_disponible).toContain("Horario de")
    expect(mockCreateSolicitud).toHaveBeenCalledWith(
      expect.objectContaining({
        condiciones_acceso: expect.stringContaining(
          "Lugar funcionando durante el trabajo"
        ),
      })
    )
  }, 10000)

  it("CP-SOL-010 crea una solicitud para espacio publico mostrando advertencia", async () => {
    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)

    fillRequiredSolicitudFields(solicitudForm)
    fireEvent.change(
      solicitudForm.getByLabelText(/d.nde se realizar. el trabajo/i),
      {
        target: { value: "Espacio pÃºblico" },
      }
    )

    changeSelectByOptionText(
      solicitudForm.getByLabelText(/d.nde se realizar. el trabajo/i),
      /espacio p.blico/i
    )

    expect(screen.getByText(/permisos municipales/i)).toBeInTheDocument()
    expect(screen.getByText(/factibilidad/i)).toBeInTheDocument()

    fireEvent.change(solicitudForm.getByLabelText(/instrucciones para ingresar/i), {
      target: { value: "Coordinar con guardia municipal" },
    })
    fireEvent.change(
      solicitudForm.getByLabelText(/instrucciones para ingresar/i),
      {
        target: { value: "Punto de encuentro en acceso norte" },
      }
    )
    selectAvailabilityDay(solicitudForm, /lunes/i)

    await submitFormAndWaitForCreate(form)

    expect(mockCreateSolicitud).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo_inmueble: expect.stringContaining("Espacio"),
        horario_disponible: "Disponibilidad cliente: lunes de 09:00 a 13:00",
        disponibilidad_horaria: [
          { dia: "LUNES", hora_inicio: "09:00", hora_fin: "13:00" },
        ],
        condiciones_acceso: expect.stringContaining(
          "Puede requerir permisos municipales"
        ),
        instrucciones_acceso: "Punto de encuentro en acceso norte",
      })
    )
  }, 10000)

  it("CP-SOL-011 valida disponibilidad del cliente antes de enviar", async () => {
    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)

    fillRequiredSolicitudFields(solicitudForm)
    fireEvent.change(
      solicitudForm.getByLabelText(/d.nde se realizar. el trabajo/i),
      {
        target: { value: "Casa" },
      }
    )
    fireEvent.change(
      solicitudForm.getByLabelText(/estacionamiento disponible/i),
      {
        target: { value: "SI" },
      }
    )
    fireEvent.change(solicitudForm.getByLabelText(/mascotas en el domicilio/i), {
      target: { value: "NO" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/instrucciones para ingresar/i), {
      target: { value: "Entrada por pasaje interior" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/instrucciones para ingresar/i), {
      target: { value: "Llamar al llegar" },
    })

    fireEvent.submit(form)

    expect(mockCreateSolicitud).not.toHaveBeenCalled()
    expect(
      screen.getByText(/selecciona al menos un d.a/i)
    ).toBeInTheDocument()
  })

  it("CP-SOL-012 valida instrucciones de acceso antes de enviar", async () => {
    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)

    fillRequiredSolicitudFields(solicitudForm)
    fireEvent.change(
      solicitudForm.getByLabelText(/d.nde se realizar. el trabajo/i),
      {
        target: { value: "Casa" },
      }
    )
    fireEvent.change(
      solicitudForm.getByLabelText(/estacionamiento disponible/i),
      {
        target: { value: "NO" },
      }
    )
    fireEvent.change(solicitudForm.getByLabelText(/mascotas en el domicilio/i), {
      target: { value: "SI" },
    })
    selectAvailabilityDay(solicitudForm, /domingo/i)

    fireEvent.submit(form)

    expect(mockCreateSolicitud).not.toHaveBeenCalled()
    expect(screen.getByText(/indica c.mo ingresar al lugar/i)).toBeInTheDocument()
  })

  it("CP-SOL-013 permite seleccionar varios dias con horarios diferentes", async () => {
    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)

    fillRequiredSolicitudFields(solicitudForm)
    fillCasaContext(solicitudForm)
    selectAvailabilityDay(solicitudForm, /mi.rcoles/i)
    fireEvent.change(solicitudForm.getByLabelText(/desde mi.rcoles/i), {
      target: { value: "15:00" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/hasta mi.rcoles/i), {
      target: { value: "19:00" },
    })
    selectAvailabilityDay(solicitudForm, /s.bado/i)
    fireEvent.change(solicitudForm.getByLabelText(/desde s.bado/i), {
      target: { value: "10:00" },
    })
    fireEvent.change(solicitudForm.getByLabelText(/hasta s.bado/i), {
      target: { value: "14:00" },
    })

    expect(solicitudForm.getByRole("button", { name: /lunes/i })).toBeDisabled()
    expect(screen.getByText(/lunes de 09:00 a 13:00/i)).toBeInTheDocument()
    expect(screen.getByText(/mi.rcoles de 15:00 a 19:00/i)).toBeInTheDocument()
    expect(screen.getByText(/s.bado de 10:00 a 14:00/i)).toBeInTheDocument()

    await submitFormAndWaitForCreate(form)

    expect(mockCreateSolicitud).toHaveBeenCalledWith(
      expect.objectContaining({
        disponibilidad_horaria: [
          { dia: "LUNES", hora_inicio: "09:00", hora_fin: "13:00" },
          { dia: "MIERCOLES", hora_inicio: "15:00", hora_fin: "19:00" },
          { dia: "SABADO", hora_inicio: "10:00", hora_fin: "14:00" },
        ],
      })
    )
  })

  it("CP-SOL-014 valida que la hora de termino sea posterior al inicio", async () => {
    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)

    fillRequiredSolicitudFields(solicitudForm)
    fillCasaContext(solicitudForm)
    fireEvent.change(solicitudForm.getByLabelText(/hasta lunes/i), {
      target: { value: "09:00" },
    })

    fireEvent.submit(form)

    expect(mockCreateSolicitud).not.toHaveBeenCalled()
    expect(
      screen.getByText(/debe ser posterior a la hora de inicio/i)
    ).toBeInTheDocument()
    expect(solicitudForm.getByLabelText(/desde lunes/i)).toHaveValue("09:00")
    expect(solicitudForm.getByLabelText(/hasta lunes/i)).toHaveValue("09:00")
  })

  it("CP-SOL-015 valida que createSolicitud reciba el payload con los nuevos campos", async () => {
    renderSolicitudForm()
    await waitForSolicitudFormReady()

    const form = getSolicitudForm()
    const solicitudForm = within(form)

    fillRequiredSolicitudFields(solicitudForm)
    fillDepartamentoContext(solicitudForm)
    await submitFormAndWaitForCreate(form)

    expect(mockCreateSolicitud).toHaveBeenCalledWith({
      usuario_rut: "11.111.111-1",
      servicio_id_servicio: 100,
      comuna_id_comuna: 10,
      titulo_solicitud: "Gasfiteria - Fuga de agua",
      descripcion_problema: "Hay una fuga constante bajo el lavaplatos.",
      urgencia: "ALTA",
      direccion: "Av Siempre Viva 123",
      tipo_problema: "Fuga de agua",
      foto_problema: null,
      ubicacion_problema_referencia: "Cocina, bajo el lavaplatos",
      tipo_inmueble: "Departamento",
      detalle_inmueble: null,
      piso: "8",
      numero_departamento: "804",
      tiene_conserjeria: true,
      requiere_autorizacion: false,
      horario_disponible:
        "Disponibilidad cliente: miércoles de 15:00 a 19:00 | Horario permitido para trabajos: Lunes a viernes de 09:00 a 18:00",
      disponibilidad_horaria: [
        { dia: "MIERCOLES", hora_inicio: "15:00", hora_fin: "19:00" },
      ],
      condiciones_acceso: null,
      instrucciones_acceso: "Usar ascensor de visitas",
      persona_contacto: null,
      telefono_contacto: null,
      estacionamiento_disponible: null,
      tiene_mascotas: null,
    })
  })
})
