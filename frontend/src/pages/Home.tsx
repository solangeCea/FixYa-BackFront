import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Hammer,
  KeyRound,
  PlugZap,
  ShieldCheck,
  ShowerHead,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";

import Navbar from "../components/Navbar";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const heroImages = [
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1400&auto=format&fit=crop",
];

const services = [
  {
    title: "Electricidad",
    detail: "Fallas, enchufes, luminarias y revisiones seguras.",
    icon: PlugZap,
  },
  {
    title: "Gasfitería",
    detail: "Filtraciones, grifería, cañerías y emergencias.",
    icon: ShowerHead,
  },
  {
    title: "Carpintería",
    detail: "Puertas, muebles, marcos y reparaciones a medida.",
    icon: Hammer,
  },
  {
    title: "Cerrajería",
    detail: "Aperturas, cambios de chapa y seguridad de acceso.",
    icon: KeyRound,
  },
];

const trustSignals = [
  { value: "Verificados", label: "Todos los técnicos pasan por revisión de FixYa." },
  { value: "Reseñas reales", label: "Opiniones de clientes que ya contrataron el servicio." },
  { value: "Seguimiento", label: "Conoce el estado de tu solicitud en todo momento." },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Técnicos verificados",
    text: "Revisamos la documentación de cada técnico antes de publicarlo. Contratas con respaldo.",
  },
  {
    icon: Clock,
    title: "Avance claro",
    text: "Sabes si tu solicitud fue enviada, asignada, está en proceso o finalizada. Sin incertidumbre.",
  },
  {
    icon: Star,
    title: "Experiencias reales",
    text: "Lees calificaciones y comentarios de otros clientes para decidir con confianza.",
  },
];

function Home() {
  useDocumentTitle("FixYa · Técnicos verificados para el hogar");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main>
        {/* HERO */}
        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-teal-900 to-cyan-800"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.22),transparent_32rem),radial-gradient(circle_at_bottom_right,rgba(8,145,178,0.2),transparent_28rem)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-28">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-100 backdrop-blur">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                Ayuda confiable para tu hogar
              </p>

              <h1
                id="hero-title"
                className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl"
              >
                Técnicos verificados para resolver los problemas de tu hogar.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                Publica tu solicitud, elige un especialista por sus reseñas
                reales y sigue el avance del servicio paso a paso. Sin llamadas a
                ciegas ni esperas sin respuesta.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4 font-bold text-white shadow-2xl shadow-cyan-500/25 transition hover:-translate-y-0.5 hover:brightness-105"
                >
                  Solicitar un servicio
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <Link
                  to="/tecnicos"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Ver técnicos verificados
                </Link>
              </div>

              <ul className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                {trustSignals.map((signal) => (
                  <li
                    key={signal.value}
                    className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                  >
                    <p className="text-lg font-black text-white">{signal.value}</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-200">
                      {signal.label}
                    </p>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-teal-500/25 via-cyan-400/20 to-emerald-500/25 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur">
                <div className="grid h-[31rem] grid-cols-[1.2fr_0.8fr] gap-3">
                  <img
                    src={heroImages[0]}
                    alt="Técnico eléctrico realizando una reparación en un hogar"
                    loading="eager"
                    className="h-full w-full rounded-[1.5rem] object-cover"
                  />
                  <div className="grid gap-3">
                    <img
                      src={heroImages[1]}
                      alt="Especialista en gasfitería reparando una cañería"
                      loading="lazy"
                      className="h-full w-full rounded-[1.5rem] object-cover"
                    />
                    <img
                      src={heroImages[2]}
                      alt="Técnico de FixYa trabajando con herramientas"
                      loading="lazy"
                      className="h-full w-full rounded-[1.5rem] object-cover"
                    />
                  </div>
                </div>

                <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-white/15 bg-slate-950/80 p-5 shadow-2xl backdrop-blur">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-cyan-200">
                        Solicitud activa
                      </p>
                      <p className="mt-1 text-lg font-black">
                        Reparación eléctrica domiciliaria
                      </p>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                      Asignada
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SERVICIOS */}
        <section
          id="servicios"
          aria-labelledby="servicios-title"
          className="bg-slate-50 py-20 text-slate-950"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-teal-700">
                  Oficios
                </p>
                <h2
                  id="servicios-title"
                  className="mt-2 text-3xl font-black tracking-tight sm:text-4xl"
                >
                  Los oficios más solicitados
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                Elige el tipo de ayuda que necesitas, indica tu comuna y sigue el
                avance de la solicitud sin tener que adivinar qué está pasando.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((service) => (
                <motion.article
                  key={service.title}
                  whileHover={{ y: -4 }}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-xl hover:shadow-teal-100/60"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {service.detail}
                  </p>
                </motion.article>
              ))}
            </div>

            <div className="mt-10">
              <Link
                to="/servicios"
                className="inline-flex items-center gap-2 rounded-2xl border border-teal-200 bg-white px-5 py-3 text-sm font-bold text-teal-700 transition hover:bg-teal-50"
              >
                Ver todos los servicios
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* BENEFICIOS */}
        <section
          aria-labelledby="beneficios-title"
          className="bg-white py-20 text-slate-950"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wide text-teal-700">
                Por qué FixYa
              </p>
              <h2
                id="beneficios-title"
                className="mt-2 text-3xl font-black tracking-tight sm:text-4xl"
              >
                Contrata con confianza, sin incertidumbre
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {benefits.map((item) => (
                <article
                  key={item.title}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-7 transition hover:border-teal-200 hover:bg-white hover:shadow-lg hover:shadow-teal-100/50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section aria-labelledby="cta-title" className="bg-slate-950 px-6 py-16">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[2rem] border border-white/10 bg-gradient-to-br from-teal-800 to-cyan-700 p-8 shadow-2xl md:flex-row md:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2 text-cyan-100">
                <Wrench className="h-5 w-5" />
                <span className="text-sm font-bold uppercase tracking-wide">
                  FixYa para el hogar
                </span>
              </div>
              <h2 id="cta-title" className="text-2xl font-black text-white sm:text-3xl">
                Publica tu solicitud y recibe ayuda hoy mismo.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-cyan-50">
                Crear tu cuenta es gratis y toma menos de un minuto.
              </p>
            </div>
            <Link
              to="/register"
              className="rounded-2xl bg-white px-6 py-4 font-black text-teal-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
