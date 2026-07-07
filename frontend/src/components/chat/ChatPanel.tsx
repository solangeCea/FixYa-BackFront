import { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, MessageCircle, Send } from "lucide-react";

import {
  enviarMensaje,
  getChatBySolicitud,
  getMensajes,
  type Chat,
  type MensajeChat,
} from "../../services/chatService";
import { formatDateTime } from "../../utils/format";

const POLL_MS = 4000;

interface ChatPanelProps {
  idSolicitud: number;
  miRut: string;
  // Nombre a mostrar para la contraparte (opcional).
  nombreContraparte?: string;
}

function ChatPanel({ idSolicitud, miRut, nombreContraparte }: ChatPanelProps) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const finRef = useRef<HTMLDivElement>(null);

  // Carga el chat de la solicitud una sola vez.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getChatBySolicitud(idSolicitud)
      .then((data) => {
        if (active) setChat(data);
      })
      .catch(() => {
        if (active) setError("No pudimos cargar el chat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [idSolicitud]);

  // Polling de mensajes mientras exista el chat.
  useEffect(() => {
    if (!chat) return;

    let active = true;

    async function cargar() {
      try {
        const data = await getMensajes(chat!.id_chat);
        if (active) setMensajes(data);
      } catch {
        // Silencioso en el polling; el usuario ya ve los mensajes previos.
      }
    }

    cargar();
    const id = setInterval(cargar, POLL_MS);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, [chat]);

  // Auto-scroll al último mensaje.
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  async function handleEnviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const contenido = texto.trim();
    if (!contenido || !chat) return;

    setEnviando(true);
    setError("");
    try {
      const nuevo = await enviarMensaje(chat.id_chat, contenido);
      setMensajes((prev) => [...prev, nuevo]);
      setTexto("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos enviar el mensaje."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
        Cargando chat...
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
        El chat se habilita cuando la cotización es aceptada.
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <MessageCircle className="h-4 w-4 text-teal-600" />
        <p className="text-sm font-bold text-slate-800">
          Chat de coordinación
          {nombreContraparte && (
            <span className="font-normal text-slate-500"> · {nombreContraparte}</span>
          )}
        </p>
      </div>

      <div className="flex h-72 flex-col gap-2 overflow-y-auto bg-slate-50/50 p-4">
        {mensajes.length === 0 ? (
          <p className="m-auto text-center text-sm text-slate-400">
            Aún no hay mensajes. Escribe el primero para coordinar el trabajo.
          </p>
        ) : (
          mensajes.map((m) => {
            if (m.es_sistema) {
              return (
                <div key={m.id_mensaje} className="flex justify-center">
                  <div className="max-w-[85%] rounded-full bg-amber-50 px-3 py-1.5 text-center text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                    {m.contenido}
                  </div>
                </div>
              );
            }
            const mio = m.emisor_rut === miRut;
            return (
              <div
                key={m.id_mensaje}
                className={`flex ${mio ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                    mio
                      ? "rounded-br-sm bg-teal-600 text-white"
                      : "rounded-bl-sm bg-white text-slate-800 ring-1 ring-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.contenido}</p>
                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                      mio ? "text-teal-100" : "text-slate-400"
                    }`}
                  >
                    <span>{formatDateTime(m.fecha_envio)}</span>
                    {mio &&
                      (m.leido ? (
                        <CheckCheck className="h-3 w-3" />
                      ) : (
                        <Check className="h-3 w-3" />
                      ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={finRef} />
      </div>

      {error && (
        <p className="border-t border-rose-100 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600">
          {error}
        </p>
      )}

      <form
        onSubmit={handleEnviar}
        className="flex items-center gap-2 border-t border-slate-100 p-3"
      >
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={1000}
          placeholder="Escribe un mensaje..."
          className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:bg-teal-300"
        >
          <Send className="h-4 w-4" />
          Enviar
        </button>
      </form>
    </div>
  );
}

export default ChatPanel;
