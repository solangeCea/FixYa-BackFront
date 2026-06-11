import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, ShieldCheck, Sparkles, Star, Wrench } from "lucide-react";
import { motion } from "framer-motion";

import Navbar from "../components/Navbar";

const heroImages = [
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1400&auto=format&fit=crop",
];

const services = [
  { title: "Electricidad", detail: "Instalaciones, fallas y mantencion", icon: "E" },
  { title: "Gasfiteria", detail: "Filtraciones, griferia y emergencias", icon: "G" },
  { title: "Refrigeracion", detail: "Diagnostico y reparacion tecnica", icon: "R" },
  { title: "Computacion", detail: "Soporte, redes y configuracion", icon: "C" },
];

const metrics = [
  { label: "Solicitudes ordenadas", value: "24/7" },
  { label: "Roles protegidos", value: "JWT" },
  { label: "Gestion trazable", value: "100%" },
];

function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.24),transparent_32rem),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.2),transparent_28rem)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-28">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-100 backdrop-blur">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                Plataforma tecnica para servicios del hogar
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">
                Servicios tecnicos, cotizaciones y seguimiento en un solo lugar.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                FixYa conecta clientes con tecnicos verificados para resolver problemas
                reales con solicitudes trazables, estados claros, reseñas y cotizaciones.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-6 py-4 font-bold text-white shadow-2xl shadow-blue-500/30 transition hover:-translate-y-0.5 hover:bg-blue-600"
                >
                  Solicitar servicio
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <Link
                  to="/tecnicos"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Ver tecnicos
                </Link>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <p className="text-2xl font-black text-white">{metric.value}</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-300">{metric.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-500/30 via-cyan-400/20 to-violet-500/30 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur">
                <div className="grid h-[31rem] grid-cols-[1.2fr_0.8fr] gap-3">
                  <img
                    src={heroImages[0]}
                    alt="Tecnico trabajando en el hogar"
                    className="h-full w-full rounded-[1.5rem] object-cover"
                  />
                  <div className="grid gap-3">
                    {heroImages.slice(1).map((image) => (
                      <img
                        key={image}
                        src={image}
                        alt="Servicio tecnico profesional"
                        className="h-full w-full rounded-[1.5rem] object-cover"
                      />
                    ))}
                  </div>
                </div>

                <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-white/15 bg-slate-950/78 p-5 shadow-2xl backdrop-blur">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-cyan-200">Solicitud activa</p>
                      <p className="mt-1 text-lg font-black">Reparacion electrica domiciliaria</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                      Asignada
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="servicios" className="bg-slate-50 py-20 text-slate-950">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-blue-600">Servicios</p>
                <h2 className="mt-2 text-4xl font-black tracking-tight">Categorias listas para operar</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                Cada solicitud conserva estado, comuna, tecnico asignado, cotizaciones y reseñas para
                que el flujo sea claro desde el primer contacto.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {services.map((service) => (
                <motion.div
                  key={service.title}
                  whileHover={{ y: -4 }}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-xl hover:shadow-slate-200/80"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
                    {service.icon}
                  </div>
                  <h3 className="text-lg font-black">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{service.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 text-slate-950">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 lg:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Tecnicos verificados", text: "Perfiles revisados desde administracion antes de operar." },
              { icon: Clock, title: "Seguimiento por estados", text: "Iniciado, asignado, en proceso, finalizado o cancelado." },
              { icon: Star, title: "Reseñas moderadas", text: "Experiencias visibles con control de reportes ofensivos." },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
                <item.icon className="h-8 w-8 text-blue-600" />
                <h3 className="mt-5 text-xl font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-950 px-6 py-16">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[2rem] border border-white/10 bg-white/10 p-8 backdrop-blur md:flex-row md:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2 text-cyan-200">
                <Wrench className="h-5 w-5" />
                <span className="text-sm font-bold uppercase tracking-wide">FixYa MVP</span>
              </div>
              <h2 className="text-3xl font-black text-white">Listo para solicitar, cotizar y gestionar servicios.</h2>
            </div>
            <Link
              to="/register"
              className="rounded-2xl bg-white px-6 py-4 font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-50"
            >
              Crear cuenta
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
