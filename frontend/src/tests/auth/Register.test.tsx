import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { login } from "../../services/authService"
import {
  getComunas,
  getRegiones,
  getServicios,
} from "../../services/catalogService"
import {
  createTechnicianProfile,
  uploadTechnicianDocument,
} from "../../services/technicianService"
import { createUser } from "../../services/userService"
import Register from "../../pages/auth/Register"

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock("../../services/catalogService", () => ({
  getComunas: vi.fn(),
  getRegiones: vi.fn(),
  getServicios: vi.fn(),
}))

vi.mock("../../services/userService", () => ({
  createUser: vi.fn(),
}))

vi.mock("../../services/authService", () => ({
  login: vi.fn(),
}))

vi.mock("../../services/technicianService", () => ({
  createTechnicianProfile: vi.fn(),
  uploadTechnicianDocument: vi.fn(),
}))

const mockGetRegiones = vi.mocked(getRegiones)
const mockGetComunas = vi.mocked(getComunas)
const mockGetServicios = vi.mocked(getServicios)
const mockCreateUser = vi.mocked(createUser)
const mockLogin = vi.mocked(login)
const mockCreateTechnicianProfile = vi.mocked(createTechnicianProfile)
const mockUploadTechnicianDocument = vi.mocked(uploadTechnicianDocument)

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Register />
    </MemoryRouter>
  )
}

function getInputByLabel(label: string | RegExp) {
  const input = screen.getByLabelText(label)

  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`El campo ${String(label)} no es un input`)
  }

  return input
}

function getSelectByLabel(label: string | RegExp) {
  const select = screen.getByLabelText(label)

  if (!(select instanceof HTMLSelectElement)) {
    throw new Error(`El campo ${String(label)} no es un select`)
  }

  return select
}

function getFieldContainer(control: HTMLElement) {
  const directContainer = control.closest("div")
  const fieldContainer =
    control.id === "contrasena" || control.id === "confirmarContrasena"
      ? directContainer?.parentElement
      : directContainer

  if (!fieldContainer) {
    throw new Error(`No se encontro el contenedor del campo ${control.id}`)
  }

  return fieldContainer
}

function getSubmitButton() {
  return screen.getByRole("button", { name: /crear cuenta cliente/i })
}

async function waitForRegisterReady() {
  await waitFor(() => {
    expect(getSubmitButton()).toBeEnabled()
  })
}

function fillValidClienteForm() {
  fireEvent.change(getInputByLabel(/nombre completo/i), {
    target: { value: "Cliente FixYa" },
  })
  fireEvent.change(getInputByLabel(/^rut$/i), {
    target: { value: "12345678-5" },
  })
  fireEvent.change(getInputByLabel(/fecha de nacimiento/i), {
    target: { value: "1990-01-01" },
  })
  fireEvent.change(getSelectByLabel(/g.nero/i), {
    target: { value: "Masculino" },
  })
  fireEvent.change(getInputByLabel(/correo/i), {
    target: { value: "cliente@fixya.cl" },
  })
  fireEvent.change(getInputByLabel(/tel.fono/i), {
    target: { value: "912345678" },
  })
  fireEvent.change(getInputByLabel(/^contrase.a$/i), {
    target: { value: "Cliente1234" },
  })
  fireEvent.change(getInputByLabel(/confirmar contrase.a/i), {
    target: { value: "Cliente1234" },
  })
}

describe("Register", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()

    mockGetRegiones.mockResolvedValue([
      {
        id_region: 1,
        nombre_region: "Region Metropolitana",
      },
    ])
    mockGetComunas.mockResolvedValue([
      {
        id_comuna: 10,
        nombre_comuna: "Santiago",
        region_id_region: 1,
      },
    ])
    mockGetServicios.mockResolvedValue([
      {
        id_servicio: 100,
        nombre_servicio: "Gasfiteria",
        estado_servicio: true,
      },
    ])
    mockCreateUser.mockResolvedValue({
      rut: "12345678-5",
      nombre_completo: "Cliente FixYa",
      correo: "cliente@fixya.cl",
      telefono: "912345678",
      tipo_usuario: "CLIENTE",
      comuna_id_comuna: 10,
      estado_usuario: true,
    })
    mockLogin.mockResolvedValue({
      access_token: "tecnico-token",
      token_type: "bearer",
    })
    mockCreateTechnicianProfile.mockResolvedValue({
      usuario_rut: "12345678-5",
      descripcion_perfil: "Tecnico especialista",
      experiencia_anios: 1,
      nivel_tecnico: "Inicial",
      tecnico_verificado: false,
    })
    mockUploadTechnicianDocument.mockResolvedValue({})
  })

  it("CP-REG-001 renderiza correctamente el formulario de registro", async () => {
    renderRegister()

    expect(
      screen.getByRole("heading", { name: /crear cuenta en fixya/i })
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^rut$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fecha de nacimiento/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/g.nero/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tel.fono/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/regi.n/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/comuna/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^contrase.a$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirmar contrase.a/i)).toBeInTheDocument()

    await waitForRegisterReady()

    expect(getSubmitButton()).toBeInTheDocument()
  })

  it("CP-REG-002 valida campos obligatorios antes de enviar al backend", async () => {
    const user = userEvent.setup()

    renderRegister()
    await waitForRegisterReady()

    await user.click(getSubmitButton())

    expect(mockCreateUser).not.toHaveBeenCalled()
    expect(screen.getAllByText(/obligatorio/i).length).toBeGreaterThanOrEqual(4)
    expect(
      screen.getByText(/selecciona tu fecha de nacimiento/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/confirma tu contrase.a/i)).toBeInTheDocument()

    expect(
      within(getFieldContainer(getInputByLabel(/nombre completo/i))).getByText(
        /obligatorio/i
      )
    ).toBeInTheDocument()
    expect(
      within(getFieldContainer(getInputByLabel(/^rut$/i))).getByText(
        /obligatorio/i
      )
    ).toBeInTheDocument()
    expect(
      within(getFieldContainer(getInputByLabel(/correo/i))).getByText(
        /obligatorio/i
      )
    ).toBeInTheDocument()
  })

  it("CP-REG-003 valida correo invalido cerca del campo correo", async () => {
    const user = userEvent.setup()

    renderRegister()
    await waitForRegisterReady()

    await user.type(getInputByLabel(/correo/i), "correo-invalido")
    await user.click(getSubmitButton())

    expect(mockCreateUser).not.toHaveBeenCalled()
    expect(
      within(getFieldContainer(getInputByLabel(/correo/i))).getByText(
        /correo v.lido/i
      )
    ).toBeInTheDocument()
  })

  it("CP-REG-004 valida contrasena debil o incompleta cerca del campo contrasena", async () => {
    const user = userEvent.setup()

    renderRegister()
    await waitForRegisterReady()

    await user.type(getInputByLabel(/^contrase.a$/i), "abc")
    await user.click(getSubmitButton())

    expect(mockCreateUser).not.toHaveBeenCalled()
    expect(
      within(getFieldContainer(getInputByLabel(/^contrase.a$/i))).getByText(
        /al menos 8 caracteres/i
      )
    ).toBeInTheDocument()
  })

  it("CP-REG-005 permite mostrar y ocultar la contrasena", async () => {
    const user = userEvent.setup()

    renderRegister()

    const passwordInput = getInputByLabel(/^contrase.a$/i)
    const togglePasswordButton = screen.getByRole("button", {
      name: /mostrar contrase.a/i,
    })

    expect(passwordInput).toHaveAttribute("type", "password")

    await user.click(togglePasswordButton)

    expect(passwordInput).toHaveAttribute("type", "text")

    await user.click(
      screen.getByRole("button", { name: /ocultar contrase.a/i })
    )

    expect(passwordInput).toHaveAttribute("type", "password")
  })

  it("CP-REG-006 registra correctamente un usuario Cliente", async () => {
    const user = userEvent.setup()

    renderRegister()
    await waitForRegisterReady()

    fillValidClienteForm()
    await user.click(getSubmitButton())

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith({
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
    })

    expect(screen.queryByText(/obligatorio/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/correo v.lido/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/al menos 8 caracteres/i)).not.toBeInTheDocument()
    expect(mockNavigate).toHaveBeenCalledWith("/login")
  })
})
