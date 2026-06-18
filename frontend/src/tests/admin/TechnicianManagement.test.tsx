import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import TechnicianManagement from "../../pages/admin/TechnicianManagement"
import {
  approveTechnicianDocument,
  getTechnicianDocuments,
  getTechnicians,
} from "../../services/technicianService"
import type {
  DocumentoTecnico,
  Tecnico,
} from "../../services/technicianService"
import { getUsers } from "../../services/userService"
import type { UsuarioAdmin } from "../../services/userService"

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

vi.mock("../../services/technicianService", () => ({
  approveTechnician: vi.fn(),
  approveTechnicianDocument: vi.fn(),
  getTechnicianDocuments: vi.fn(),
  getTechnicians: vi.fn(),
}))

vi.mock("../../services/userService", () => ({
  getUsers: vi.fn(),
}))

const mockGetTechnicians = vi.mocked(getTechnicians)
const mockGetTechnicianDocuments = vi.mocked(getTechnicianDocuments)
const mockApproveTechnicianDocument = vi.mocked(approveTechnicianDocument)
const mockGetUsers = vi.mocked(getUsers)

const tecnicos: Tecnico[] = [
  {
    usuario_rut: "22.222.222-2",
    descripcion_perfil: "Especialista certificado en instalaciones electricas.",
    experiencia_anios: 5,
    nivel_tecnico: "Avanzado",
    tecnico_verificado: false,
  },
]

const usuarios: UsuarioAdmin[] = [
  {
    rut: "22.222.222-2",
    nombre_completo: "Tecnico FixYa",
    correo: "tecnico@fixya.cl",
    telefono: "+56922222222",
    tipo_usuario: "TECNICO",
    comuna_id_comuna: 20,
    estado_usuario: true,
  },
]

const documentos: DocumentoTecnico[] = [
  {
    id_documento: 501,
    tecnico_usuario_rut: "22.222.222-2",
    tipo_documento: "Certificado SEC",
    nombre_archivo: "certificado-sec.pdf",
    archivo_url: "/uploads/documentos_tecnicos/certificado-sec.pdf",
    fecha_subida: "2026-06-10T10:00:00",
    documento_aprobado: false,
    fecha_aprobacion: null,
    usuario_rut: null,
  },
]

function renderTechnicianManagement() {
  return render(<TechnicianManagement />)
}

describe("TechnicianManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetTechnicians.mockResolvedValue(tecnicos)
    mockGetUsers.mockResolvedValue(usuarios)
    mockGetTechnicianDocuments.mockResolvedValue(documentos)
    mockApproveTechnicianDocument.mockResolvedValue({
      ...documentos[0],
      documento_aprobado: true,
      fecha_aprobacion: "2026-06-15T12:00:00",
      usuario_rut: "33.333.333-3",
    })
  })

  it("CP-ADMIN-DOC-001 visualiza y valida documentos tecnicos desde administracion", async () => {
    const user = userEvent.setup()

    renderTechnicianManagement()

    expect(await screen.findByText("Tecnico FixYa")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: /ver perfil t.cnico/i })
    )

    const modal = screen.getByRole("dialog")

    expect(mockGetTechnicianDocuments).toHaveBeenCalledWith("22.222.222-2")
    expect(
      within(modal).getByRole("heading", { name: /tecnico fixya/i })
    ).toBeInTheDocument()
    expect(
      await within(modal).findByText(/documentos tecnicos/i)
    ).toBeInTheDocument()
    expect(within(modal).getByText("Certificado SEC")).toBeInTheDocument()
    expect(within(modal).getByText("certificado-sec.pdf")).toBeInTheDocument()
    expect(
      within(modal).getByText(/pendiente de validacion/i)
    ).toBeInTheDocument()
    expect(
      within(modal).getByRole("link", { name: /ver documento/i })
    ).toHaveAttribute(
      "href",
      "http://localhost:8000/uploads/documentos_tecnicos/certificado-sec.pdf"
    )

    await user.click(
      within(modal).getByRole("button", {
        name: /aprobar documento tecnico/i,
      })
    )

    expect(mockApproveTechnicianDocument).toHaveBeenCalledWith(
      501,
      "33.333.333-3"
    )
    expect(
      await within(modal).findByText(/^documento aprobado$/i)
    ).toBeInTheDocument()
  })

  it("CP-ADMIN-DOC-002 muestra falla controlada si no cargan los documentos tecnicos", async () => {
    const user = userEvent.setup()
    mockGetTechnicianDocuments.mockRejectedValueOnce(new Error("Error 500"))

    renderTechnicianManagement()

    expect(await screen.findByText("Tecnico FixYa")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: /ver perfil t.cnico/i })
    )

    const modal = screen.getByRole("dialog")

    expect(mockGetTechnicianDocuments).toHaveBeenCalledWith("22.222.222-2")
    expect(
      await within(modal).findByText(
        /no pudimos cargar los documentos del tecnico/i
      )
    ).toBeInTheDocument()
    expect(within(modal).queryByText("Certificado SEC")).not.toBeInTheDocument()
  })
})
