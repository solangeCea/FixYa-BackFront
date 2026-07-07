import { render, screen } from "@testing-library/react"
import type { HTMLAttributes } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import UserManagement from "../../pages/admin/UserManagement"
import { getComunas } from "../../services/catalogService"
import { getUsers } from "../../services/userService"
import type { Comuna } from "../../services/catalogService"
import type { UsuarioAdmin } from "../../services/userService"

vi.mock("framer-motion", () => ({
  motion: {
    tr: ({
      children,
      initial: _initial,
      animate: _animate,
      transition: _transition,
      ...props
    }: HTMLAttributes<HTMLTableRowElement> & {
      initial?: unknown
      animate?: unknown
      transition?: unknown
    }) => <tr {...props}>{children}</tr>,
  },
}))

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    usuario: {
      rut: "33.333.333-3",
      nombre_completo: "Admin FixYa",
      correo: "admin@fixya.cl",
      telefono: "+56933333333",
      tipo_usuario: "ADMIN",
      comuna_id_comuna: 10,
      estado_usuario: true,
    },
    setUsuario: () => undefined,
    loading: false,
    logout: () => undefined,
  }),
}))

vi.mock("../../services/userService", () => ({
  getUsers: vi.fn(),
  setUserEstado: vi.fn(),
}))

vi.mock("../../services/catalogService", () => ({
  getComunas: vi.fn(),
}))

const mockGetUsers = vi.mocked(getUsers)
const mockGetComunas = vi.mocked(getComunas)

const comunas: Comuna[] = [
  {
    id_comuna: 10,
    nombre_comuna: "Santiago",
    region_id_region: 1,
  },
  {
    id_comuna: 20,
    nombre_comuna: "Providencia",
    region_id_region: 1,
  },
]

const usuarios: UsuarioAdmin[] = [
  {
    rut: "11.111.111-1",
    nombre_completo: "Cliente FixYa",
    correo: "cliente@fixya.cl",
    telefono: "+56911111111",
    tipo_usuario: "CLIENTE",
    comuna_id_comuna: 10,
    estado_usuario: true,
  },
  {
    rut: "22.222.222-2",
    nombre_completo: "Tecnico FixYa",
    correo: "tecnico@fixya.cl",
    telefono: "+56922222222",
    tipo_usuario: "TECNICO",
    comuna_id_comuna: 20,
    estado_usuario: true,
  },
  {
    rut: "33.333.333-3",
    nombre_completo: "Admin FixYa",
    correo: "admin@fixya.cl",
    telefono: "+56933333333",
    tipo_usuario: "ADMIN",
    comuna_id_comuna: 10,
    estado_usuario: false,
  },
]

function renderUserManagement() {
  return render(<UserManagement />)
}

describe("UserManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUsers.mockResolvedValue(usuarios)
    mockGetComunas.mockResolvedValue(comunas)
  })

  it("CP-ADMIN-004 renderiza la pantalla de gestion de usuarios", async () => {
    renderUserManagement()

    expect(
      await screen.findByRole("heading", { name: /gesti.n de usuarios/i })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/revisa clientes, t.cnicos y administradores/i)
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/buscar por nombre, correo o rut/i)
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /todos/i })).toBeInTheDocument()
  })

  it("CP-ADMIN-005 lista usuarios con roles ADMIN, CLIENTE y TECNICO", async () => {
    renderUserManagement()

    expect(await screen.findByText("Cliente FixYa")).toBeInTheDocument()
    expect(screen.getByText("Tecnico FixYa")).toBeInTheDocument()
    expect(screen.getByText("Admin FixYa")).toBeInTheDocument()
    expect(screen.getByText("cliente@fixya.cl")).toBeInTheDocument()
    expect(screen.getByText("tecnico@fixya.cl")).toBeInTheDocument()
    expect(screen.getByText("admin@fixya.cl")).toBeInTheDocument()
    expect(screen.getByText("Cliente")).toBeInTheDocument()
    expect(screen.getAllByText(/t.cnico/i).length).toBeGreaterThan(0)
    expect(screen.getByText("Administrador")).toBeInTheDocument()
    expect(screen.getAllByText("Santiago").length).toBeGreaterThan(0)
    expect(screen.getByText("Providencia")).toBeInTheDocument()
    expect(mockGetUsers).toHaveBeenCalledTimes(1)
    expect(mockGetComunas).toHaveBeenCalledTimes(1)
  })

  it("CP-ADMIN-006 muestra error controlado si falla el listado de usuarios", async () => {
    mockGetUsers.mockRejectedValueOnce(new Error("Error 500"))

    renderUserManagement()

    expect(
      await screen.findByText(/no pudimos cargar los usuarios registrados/i)
    ).toBeInTheDocument()
    expect(screen.queryByText("Cliente FixYa")).not.toBeInTheDocument()
    expect(screen.queryByText("Tecnico FixYa")).not.toBeInTheDocument()
    expect(screen.queryByText("Admin FixYa")).not.toBeInTheDocument()
  })
})
