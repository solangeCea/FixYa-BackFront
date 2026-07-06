import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AuthProvider, useAuth } from "../../context/AuthContext"
import { login, obtenerUsuarioActual } from "../../services/authService"
import type { Usuario } from "../../types/auth"
import Login from "../../pages/auth/Login"

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock("../../services/authService", () => ({
  login: vi.fn(),
  obtenerUsuarioActual: vi.fn(),
}))

const mockLogin = vi.mocked(login)
const mockObtenerUsuarioActual = vi.mocked(obtenerUsuarioActual)

function buildUsuario(tipoUsuario: string, correo: string): Usuario {
  return {
    rut: "11.111.111-1",
    nombre_completo: `${tipoUsuario} FixYa`,
    correo,
    telefono: "+56911111111",
    tipo_usuario: tipoUsuario,
    comuna_id_comuna: 1,
    estado_usuario: true,
  }
}

function AuthStateProbe() {
  const { usuario } = useAuth()

  return (
    <output aria-label="session-status">
      {usuario ? `sesion-activa:${usuario.tipo_usuario}` : "sesion-inactiva"}
    </output>
  )
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <AuthStateProbe />
        <Login />
      </AuthProvider>
    </MemoryRouter>
  )
}

function getRoleButton(roleName: string | RegExp) {
  const roleHeading = screen.getByRole("heading", { name: roleName })
  const roleButton = roleHeading.closest("button")

  if (!roleButton) {
    throw new Error(`No se encontro el boton del rol ${String(roleName)}`)
  }

  return roleButton
}

async function submitLogin({
  roleName,
  correo,
  contrasena,
}: {
  roleName?: string | RegExp
  correo: string
  contrasena: string
}) {
  const user = userEvent.setup()

  if (roleName) {
    await user.click(getRoleButton(roleName))
  }

  await user.type(screen.getByPlaceholderText("tu@email.com"), correo)
  await user.type(screen.getByPlaceholderText("********"), contrasena)
  await user.click(screen.getByRole("button", { name: /iniciar/i }))
}

describe("Login", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it("CP-AUTH-001 permite iniciar sesion con rol CLIENTE correcto", async () => {
    mockLogin.mockResolvedValue({
      access_token: "cliente-token",
      token_type: "bearer",
    })
    mockObtenerUsuarioActual.mockResolvedValue(
      buildUsuario("CLIENTE", "cliente@fixya.cl")
    )

    renderLogin()

    await submitLogin({
      roleName: "Cliente",
      correo: "cliente@fixya.cl",
      contrasena: "Cliente1234",
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/cliente/dashboard")
    })

    expect(mockLogin).toHaveBeenCalledWith("cliente@fixya.cl", "Cliente1234")
    expect(mockObtenerUsuarioActual).toHaveBeenCalledWith("cliente-token")
    expect(screen.getByLabelText("session-status")).toHaveTextContent(
      "sesion-activa:CLIENTE"
    )
    expect(localStorage.getItem("token")).toBe("cliente-token")
  })

  it("CP-AUTH-002 permite iniciar sesion con rol TECNICO correcto", async () => {
    mockLogin.mockResolvedValue({
      access_token: "tecnico-token",
      token_type: "bearer",
    })
    mockObtenerUsuarioActual.mockResolvedValue(
      buildUsuario("TECNICO", "tecnico@fixya.cl")
    )

    renderLogin()

    await submitLogin({
      roleName: /t.cnico/i,
      correo: "tecnico@fixya.cl",
      contrasena: "Tecnico1234",
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/tecnico/dashboard")
    })

    expect(mockLogin).toHaveBeenCalledWith("tecnico@fixya.cl", "Tecnico1234")
    expect(mockObtenerUsuarioActual).toHaveBeenCalledWith("tecnico-token")
    expect(screen.getByLabelText("session-status")).toHaveTextContent(
      "sesion-activa:TECNICO"
    )
    expect(localStorage.getItem("token")).toBe("tecnico-token")
  })

  it("CP-AUTH-003 permite iniciar sesion como ADMIN desde el acceso administrativo", async () => {
    mockLogin.mockResolvedValue({
      access_token: "admin-token",
      token_type: "bearer",
    })
    mockObtenerUsuarioActual.mockResolvedValue(
      buildUsuario("ADMIN", "admin@fixya.cl")
    )

    renderLogin()
    const user = userEvent.setup()

    // La tarjeta de administrador ya no existe en la pantalla principal.
    expect(
      screen.queryByRole("heading", { name: "Administrador" })
    ).not.toBeInTheDocument()

    // Se accede mediante el ícono discreto que abre el modal administrativo.
    await user.click(
      screen.getByRole("button", { name: /acceso administrativo/i })
    )

    const dialog = await screen.findByRole("dialog")
    await user.type(
      within(dialog).getByPlaceholderText("admin@fixya.cl"),
      "admin@fixya.cl"
    )
    await user.type(within(dialog).getByPlaceholderText("********"), "Admin1234")
    await user.click(
      within(dialog).getByRole("button", { name: /ingresar al panel/i })
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/admin/panel")
    })

    expect(mockLogin).toHaveBeenCalledWith("admin@fixya.cl", "Admin1234")
    expect(mockObtenerUsuarioActual).toHaveBeenCalledWith("admin-token")
    expect(screen.getByLabelText("session-status")).toHaveTextContent(
      "sesion-activa:ADMIN"
    )
    expect(localStorage.getItem("token")).toBe("admin-token")
  })

  it("CP-AUTH-007 bloquea el acceso administrativo con credenciales no administrativas", async () => {
    mockLogin.mockResolvedValue({
      access_token: "cliente-token",
      token_type: "bearer",
    })
    mockObtenerUsuarioActual.mockResolvedValue(
      buildUsuario("CLIENTE", "cliente@fixya.cl")
    )

    renderLogin()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("button", { name: /acceso administrativo/i })
    )

    const dialog = await screen.findByRole("dialog")
    await user.type(
      within(dialog).getByPlaceholderText("admin@fixya.cl"),
      "cliente@fixya.cl"
    )
    await user.type(within(dialog).getByPlaceholderText("********"), "Cliente1234")
    await user.click(
      within(dialog).getByRole("button", { name: /ingresar al panel/i })
    )

    await waitFor(() => {
      expect(mockObtenerUsuarioActual).toHaveBeenCalledWith("cliente-token")
    })

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(
      within(dialog).getByText(/no corresponden a una cuenta administrativa/i)
    ).toBeInTheDocument()
    expect(screen.getByLabelText("session-status")).toHaveTextContent(
      "sesion-inactiva"
    )
    expect(localStorage.getItem("token")).toBeNull()
  })

  it("CP-AUTH-004 bloquea credenciales correctas cuando el rol seleccionado no coincide", async () => {
    mockLogin.mockResolvedValue({
      access_token: "admin-token",
      token_type: "bearer",
    })
    mockObtenerUsuarioActual.mockResolvedValue(
      buildUsuario("ADMIN", "admin@fixya.cl")
    )

    renderLogin()

    await submitLogin({
      roleName: "Cliente",
      correo: "admin@fixya.cl",
      contrasena: "Admin1234",
    })

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("admin@fixya.cl", "Admin1234")
      expect(mockObtenerUsuarioActual).toHaveBeenCalledWith("admin-token")
    })

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(
      screen.queryByText(/rol seleccionado no corresponde/i)
    ).toBeInTheDocument()
    expect(screen.getByLabelText("session-status")).toHaveTextContent(
      "sesion-inactiva"
    )
    expect(localStorage.getItem("token")).toBeNull()
  })

  it("CP-AUTH-005 bloquea el login cuando no se selecciona rol", async () => {
    renderLogin()

    await submitLogin({
      correo: "cliente@fixya.cl",
      contrasena: "Cliente1234",
    })

    expect(mockLogin).not.toHaveBeenCalled()
    expect(mockObtenerUsuarioActual).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(screen.getByText(/selecciona/i)).toBeInTheDocument()
    expect(screen.getByLabelText("session-status")).toHaveTextContent(
      "sesion-inactiva"
    )
    expect(localStorage.getItem("token")).toBeNull()
  })

  it("CP-AUTH-006 muestra error y no inicia sesion con credenciales invalidas", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined)

    mockLogin.mockRejectedValue(new Error("Credenciales incorrectas"))

    renderLogin()

    await submitLogin({
      roleName: "Cliente",
      correo: "cliente@fixya.cl",
      contrasena: "clave-incorrecta",
    })

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        "cliente@fixya.cl",
        "clave-incorrecta"
      )
    })

    expect(mockObtenerUsuarioActual).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(
      screen.getByText(/correo o la contrase.a no coinciden/i)
    ).toBeInTheDocument()
    expect(screen.getByLabelText("session-status")).toHaveTextContent(
      "sesion-inactiva"
    )
    expect(localStorage.getItem("token")).toBeNull()

    consoleErrorSpy.mockRestore()
  })
})
