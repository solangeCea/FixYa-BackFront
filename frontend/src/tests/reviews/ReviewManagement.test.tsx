import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import ReviewManagement from "../../pages/admin/ReviewManagement"
import {
  approveReview,
  getReviews,
  hideReview,
} from "../../services/reviewService"
import type { Review } from "../../services/reviewService"

vi.mock("../../services/reviewService", () => ({
  approveReview: vi.fn(),
  getReviews: vi.fn(),
  hideReview: vi.fn(),
}))

const mockApproveReview = vi.mocked(approveReview)
const mockGetReviews = vi.mocked(getReviews)
const mockHideReview = vi.mocked(hideReview)

const reportedReview: Review = {
  id_resena: 101,
  solicitud_id_solicitud: 9001,
  usuario_rut: "11.111.111-1",
  calificacion: 2,
  comentario: "El tecnico llego tarde y dejo el trabajo incompleto.",
  fecha_resena: "2026-06-14",
  resena_activa: "S",
  resena_reportada: "S",
  motivo_reporte: "Lenguaje inapropiado",
  fecha_reporte: "2026-06-14",
  reporte_resuelto: "N",
  fecha_resolucion: null,
  usuario_rut_reporta: "22.222.222-2",
  admin_rut_resuelve: null,
}

const approvedReview: Review = {
  ...reportedReview,
  resena_activa: "S",
  reporte_resuelto: "S",
  fecha_resolucion: "2026-06-14",
  admin_rut_resuelve: "99.999.999-9",
}

const hiddenReview: Review = {
  ...reportedReview,
  resena_activa: "N",
  reporte_resuelto: "S",
  fecha_resolucion: "2026-06-14",
  admin_rut_resuelve: "99.999.999-9",
}

function renderReviewManagement() {
  return render(<ReviewManagement />)
}

async function waitForPanelReady() {
  expect(
    await screen.findByRole("heading", { name: /gesti.n de rese.as/i })
  ).toBeInTheDocument()
}

describe("ReviewManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetReviews.mockResolvedValue([])
    mockApproveReview.mockResolvedValue({})
    mockHideReview.mockResolvedValue({})
  })

  it("CP-REV-001 renderiza el panel de gestion de reseñas", async () => {
    renderReviewManagement()

    await waitForPanelReady()

    expect(
      screen.getByText(/revisa rese.as reportadas/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: /rese.as del sistema/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /actualizar rese.as/i })
    ).toBeInTheDocument()
  })

  it("CP-REV-002 lista reseñas devueltas por el servicio", async () => {
    mockGetReviews.mockResolvedValue([reportedReview])

    renderReviewManagement()
    await waitForPanelReady()

    expect(screen.getByText(/rese.a #101/i)).toBeInTheDocument()
    expect(
      screen.getByText("El tecnico llego tarde y dejo el trabajo incompleto.")
    ).toBeInTheDocument()
    expect(screen.getByText(/solicitud: 9001/i)).toBeInTheDocument()
    expect(screen.getByText(/reportada pendiente/i)).toBeInTheDocument()
    expect(screen.getByText(/motivo: lenguaje inapropiado/i)).toBeInTheDocument()
  })

  it("CP-REV-003 aprueba una reseña reportada pendiente", async () => {
    const user = userEvent.setup()
    mockGetReviews
      .mockResolvedValueOnce([reportedReview])
      .mockResolvedValueOnce([approvedReview])

    renderReviewManagement()
    await waitForPanelReady()

    await user.click(
      screen.getByRole("button", { name: /aprobar rese.a reportada/i })
    )

    await waitFor(() => {
      expect(mockApproveReview).toHaveBeenCalledWith(101)
    })
    expect(
      await screen.findByText(/rese.a aprobada/i)
    ).toBeInTheDocument()
    expect(screen.getByText("Aprobada")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /aprobar rese.a reportada/i })
    ).not.toBeInTheDocument()
  })

  it("CP-REV-004 oculta una reseña reportada pendiente", async () => {
    const user = userEvent.setup()
    mockGetReviews
      .mockResolvedValueOnce([reportedReview])
      .mockResolvedValueOnce([hiddenReview])

    renderReviewManagement()
    await waitForPanelReady()

    await user.click(
      screen.getByRole("button", { name: /ocultar rese.a reportada/i })
    )

    await waitFor(() => {
      expect(mockHideReview).toHaveBeenCalledWith(101)
    })
    expect(
      await screen.findByText(/rese.a ocultada/i)
    ).toBeInTheDocument()
    expect(screen.getByText("Ocultada")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /ocultar rese.a reportada/i })
    ).not.toBeInTheDocument()

    const reviewCard = screen.getByText(/rese.a #101/i).closest("div")
    expect(reviewCard).not.toBeNull()
    expect(
      within(reviewCard as HTMLElement).queryByText(/reportada pendiente/i)
    ).not.toBeInTheDocument()
  })
})
