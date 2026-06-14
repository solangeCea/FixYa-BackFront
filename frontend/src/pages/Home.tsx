import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";

import Navbar from "../components/Navbar";

const heroImage =
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1800&auto=format&fit=crop";

const services = [
  {
    title: "Electricidad",
    detail: "Instalaciones, enchufes, luminarias y revisiones del hogar.",
    icon: Wrench,
  },
  {
    title: "Gasfitería",
    detail: "Filtraciones, grifería, cañerías y emergencias domésticas.",
    icon: MapPin,
  },
  {
    title: "Carpintería",
    detail: "Puertas, muebles, terminaciones y reparaciones de madera.",
    icon: Briefcase,
  },
  {
    title: "Cerrajería",
    detail: "Aperturas, cambios de chapa y seguridad de acceso.",
    icon: ShieldCheck,
  },
];

const steps = [
  {
    title: "Elige lo que necesitas",
    text: "Selecciona un servicio y la comuna donde quieres recibir ayuda.",
    icon: Search,
  },
  {
    title: "Compara técnicos",
    text: "Revisa perfiles verificados, experiencia, cobertura y calificación.",
    icon: Star,
  },
  {
    title: "Sigue tu solicitud",
    text: "Gestiona cotizaciones, avances y cierre del trabajo desde tu panel.",
    icon: ClipboardList,
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#102033]">
      <Navbar />

      <main>
        <section className="relative overflow-hidden">
          <img
            src={heroImage}
            alt="Técnico profesional trabajando en una instalación del hogar"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0E1B2A]/72" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#F8F5EF] to-transparent" />

          <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="max-w-3xl"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-[#F0C16C]" />
                Técnicos verificados para tu hogar
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                FixYa conecta tu problema con el técnico correcto.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">
                Encuentra servicios disponibles por comuna, revisa técnicos
                verificados y crea solicitudes con seguimiento claro de principio
                a fin.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/register" className="fixya-btn-accent px-6 py-4">
                  Solicitar servicio
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <Link
                  to="/servicios"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white px-6 py-4 font-extrabold text-[#123F66] transition hover:-translate-y-0.5 hover:bg-[#F8F5EF]"
                >
                  Ver servicios
                </Link>
              </div>

              <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
                {[
                  ["Servicios por zona", "Filtra por comuna"],
                  ["Perfiles verificados", "Más confianza"],
                  ["Panel simple", "Todo ordenado"],
                ].map(([title, text]) => (
                  <div
                    key={title}
                    className="rounded-lg border border-white/20 bg-white/10 p-4 text-white backdrop-blur"
                  >
                    <p className="font-black">{title}</p>
                    <p className="mt-1 text-sm text-white/75">{text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="-mt-8 bg-[#F8F5EF] pb-16">
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <motion.article
                  key={step.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  className="fixya-card rounded-lg p-6"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#123F66] text-white">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-black text-[#C8872D]">
                      Paso {index + 1}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-[#0E1B2A]">
                    {step.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#5F6B7A]">
                    {step.text}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-black uppercase text-[#C8872D]">
                  Servicios
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0E1B2A] md:text-4xl">
                  Un catálogo simple para resolver problemas reales
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-[#5F6B7A]">
                FixYa ordena la búsqueda por servicio y ubicación para que
                encuentres profesionales disponibles sin revisar listas
                genéricas.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((service) => (
                <motion.article
                  key={service.title}
                  whileHover={{ y: -3 }}
                  className="rounded-lg border border-[#E6E0D6] bg-[#FBFAF7] p-6 transition hover:border-[#C8872D]/60 hover:shadow-lg"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[#123F66] text-white">
                    <service.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-black text-[#102033]">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5F6B7A]">
                    {service.detail}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F8F5EF] py-16">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase text-[#C8872D]">
                Confianza y claridad
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#0E1B2A] md:text-4xl">
                Menos incertidumbre antes, durante y después del servicio.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#5F6B7A]">
                Cada solicitud queda ordenada por estado, cotizaciones y
                reseñas. Tú ves qué está pasando y el técnico sabe qué necesita
                responder.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Verificados",
                  text: "Perfiles revisados antes de aparecer en el catálogo.",
                },
                {
                  icon: CheckCircle2,
                  title: "Seguimiento",
                  text: "Estados claros para cada solicitud creada.",
                },
                {
                  icon: Star,
                  title: "Reseñas",
                  text: "Opiniones para decidir con más contexto.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="fixya-card rounded-lg p-5"
                >
                  <item.icon className="h-7 w-7 text-[#C8872D]" />
                  <h3 className="mt-5 font-black text-[#102033]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5F6B7A]">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#0E1B2A] px-6 py-14">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[#F0C16C]">
                <Wrench className="h-5 w-5" />
                <span className="text-sm font-black uppercase">
                  FixYa para el hogar
                </span>
              </div>
              <h2 className="max-w-3xl text-3xl font-black text-white">
                Elige un servicio, encuentra técnicos disponibles y crea tu
                solicitud en pocos pasos.
              </h2>
            </div>
            <Link to="/servicios" className="fixya-btn-accent px-6 py-4">
              Ver servicios
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
