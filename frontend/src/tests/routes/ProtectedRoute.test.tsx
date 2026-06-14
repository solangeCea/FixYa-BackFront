import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AuthProvider } from "../../context/AuthContext"
import ProtectedRoute from "../../routes/ProtectedRoute"
import { obtenerUsuarioActual } from "../../services/authService"
import type { Usuario } from "../../types/auth"

vi.mock("../../services/authService", () => ({
  obtenerUsuarioActual: vi.fn(),
}))

const mockObtenerUsuarioActual = vi.mocked(obtenerUsuarioActual)

function buildUsuario(tipoUsuario: string): Usuario {
  return {
    rut: "11.111.111-1",
    nombre_completo: `${tipoUsuario} FixYa`,
    correo: `${tipoUsuario.toLowerCase()}@fixya.cl`,
    telefono: "+56911111111",
    tipo_usuario: tipoUsuario,
    comuna_id_comuna: 1,
    estado_usuario: true,
  }
}

function renderProtectedRoutes(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<h1>Login publico</h1>} />
          <Route
            path="/cliente/dashboard"
            element={
              <ProtectedRoute allowedRoles={["CLIENTE"]}>
                <h1>Contenido cliente</h1>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tecnico/dashboard"
            element={
              <ProtectedRoute allowedRoles={["TECNICO"]}>
                <h1>Contenido tecnico</h1>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/panel"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <h1>Contenido admin</h1>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<h1>Home publico</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

function authenticateAs(tipoUsuario: string) {
  localStorage.setItem("token", `${tipoUsuario.toLowerCase()}-token`)
  mockObtenerUsuarioActual.mockResolvedValue(buildUsuario(tipoUsuario))
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it("CP-ROUTE-001 redirige a login cuando un usuario no autenticado entra a una ruta protegida", async () => {
    renderProtectedRoutes("/cliente/dashboard")

    expect(
      await screen.findByRole("heading", { name: /login publico/i })
    ).toBeInTheDocument()
    expect(screen.queryByText("Contenido cliente")).not.toBeInTheDocument()
    expect(mockObtenerUsuarioActual).not.toHaveBeenCalled()
  })

  it("CP-ROUTE-002 permite que un usuario CLIENTE entre a la ruta de cliente", async () => {
    authenticateAs("CLIENTE")

    renderProtectedRoutes("/cliente/dashboard")

    expect(
      await screen.findByRole("heading", { name: /contenido cliente/i })
    ).toBeInTheDocument()
    expect(mockObtenerUsuarioActual).toHaveBeenCalledWith("cliente-token")
  })

  it("CP-ROUTE-003 bloquea a un usuario CLIENTE cuando intenta entrar a una ruta ADMIN", async () => {
    authenticateAs("CLIENTE")

    renderProtectedRoutes("/admin/panel")

    expect(
      await screen.findByRole("heading", { name: /contenido cliente/i })
    ).toBeInTheDocument()
    expect(screen.queryByText("Contenido admin")).not.toBeInTheDocument()
    expect(mockObtenerUsuarioActual).toHaveBeenCalledWith("cliente-token")
  })

  it("CP-ROUTE-004 permite que un usuario TECNICO entre a la ruta tecnico", async () => {
    authenticateAs("TECNICO")

    renderProtectedRoutes("/tecnico/dashboard")

    expect(
      await screen.findByRole("heading", { name: /contenido tecnico/i })
    ).toBeInTheDocument()
    expect(mockObtenerUsuarioActual).toHaveBeenCalledWith("tecnico-token")
  })

  it("CP-ROUTE-005 permite que un usuario ADMIN entre a la ruta admin", async () => {
    authenticateAs("ADMIN")

    renderProtectedRoutes("/admin/panel")

    expect(
      await screen.findByRole("heading", { name: /contenido admin/i })
    ).toBeInTheDocument()
    expect(mockObtenerUsuarioActual).toHaveBeenCalledWith("admin-token")
  })

  it("CP-ROUTE-006 redirige a login y limpia sesion cuando el token es invalido", async () => {
    localStorage.setItem("token", "token-invalido")
    mockObtenerUsuarioActual.mockRejectedValue(new Error("Token invalido"))

    renderProtectedRoutes("/admin/panel")

    expect(
      await screen.findByRole("heading", { name: /login publico/i })
    ).toBeInTheDocument()
    expect(screen.queryByText("Contenido admin")).not.toBeInTheDocument()
    expect(mockObtenerUsuarioActual).toHaveBeenCalledWith("token-invalido")

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBeNull()
    })
  })
})
