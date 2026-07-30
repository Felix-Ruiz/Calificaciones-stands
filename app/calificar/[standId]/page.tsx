"use client";

import { useEffect, useState, use } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, Send, CheckCircle, AlertTriangle } from "lucide-react";
import { obtenerInfoEncuesta, enviarCalificacion } from "@/actions/ratingActions";

export default function CalificarPage({ params }: { params: Promise<{ standId: string }> }) {
  const router = useRouter();
  const { standId } = use(params);

  // Estados de sesión y datos
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [standNombre, setStandNombre] = useState("");
  const [yaCalifico, setYaCalifico] = useState(false);
  const [activarEstrellas, setActivarEstrellas] = useState(true);
  const [errorInfo, setErrorInfo] = useState("");

  // Estados del Formulario
  const [comentario, setComentario] = useState("");
  const [estrellas, setEstrellas] = useState(0);
  const [hoverEstrellas, setHoverEstrellas] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    // Usamos getSession para mantener la consistencia con el resto de la app
    const iniciar = async () => {
      const session = await getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
        await cargarDatos(session.user.id);
      } else {
        setErrorInfo("Sesión inválida. Por favor, inicia sesión nuevamente.");
        setLoading(false);
      }
    };
    iniciar();
  }, []);

  const cargarDatos = async (clienteId: string) => {
    const data = await obtenerInfoEncuesta(standId, clienteId);
    if (data.error) {
      setErrorInfo(data.error);
    } else {
      setStandNombre(data.standNombre || "Stand");
      setYaCalifico(data.yaCalifico!);
      setActivarEstrellas(data.activarEstrellas!);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentario.trim() || !userId) return;
    
    setEnviando(true);
    const res = await enviarCalificacion(
      userId,
      standId,
      comentario,
      activarEstrellas ? estrellas : null
    );

    if (res.success) {
      setExito(true);
      setTimeout(() => {
        router.push("/cliente"); // Al terminar, lo mandamos a su inicio
      }, 3000);
    } else {
      setEnviando(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-neutral-950 flex justify-center items-center text-fuchsia-500">Cargando encuesta...</div>;

  if (errorInfo) return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center text-center p-6">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">Ups, algo salió mal</h1>
      <p className="text-neutral-400">{errorInfo}</p>
    </div>
  );

  if (yaCalifico) return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center text-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-fuchsia-900/20 to-neutral-950" />
      <CheckCircle className="w-24 h-24 text-green-500 mb-6 relative z-10" />
      <h1 className="text-3xl font-bold text-white mb-4 relative z-10">¡Ya calificaste este Stand!</h1>
      <p className="text-neutral-400 mb-8 relative z-10">Gracias por tu participación. No puedes calificar el mismo stand más de una vez.</p>
      <button onClick={() => router.push("/cliente")} className="relative z-10 bg-neutral-800 text-white px-8 py-3 rounded-xl font-medium hover:bg-neutral-700 transition-all">
        Volver a mi inicio
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-fuchsia-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        {exito ? (
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-green-500/30 rounded-3xl p-10 text-center shadow-[0_0_50px_rgba(34,197,94,0.15)]">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Calificación Enviada!</h2>
            <p className="text-neutral-400">Redirigiendo a tu panel...</p>
          </div>
        ) : (
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-fuchsia-500/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(217,70,239,0.1)]">
            <div className="text-center mb-8">
              <p className="text-fuchsia-500 text-sm font-bold tracking-widest uppercase mb-2">Estás calificando a:</p>
              <h1 className="text-3xl font-bold text-white">{standNombre}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {activarEstrellas && (
                <div className="flex flex-col items-center mb-8">
                  <p className="text-neutral-400 mb-4 text-sm uppercase tracking-wider">Tu puntuación</p>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEstrellas(star)}
                        onMouseEnter={() => setHoverEstrellas(star)}
                        onMouseLeave={() => setHoverEstrellas(0)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star 
                          className={`w-10 h-10 transition-colors ${
                            star <= (hoverEstrellas || estrellas) 
                              ? "text-yellow-400 fill-yellow-400" 
                              : "text-neutral-700"
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-neutral-400 text-sm font-medium mb-2 ml-1">
                  Comentarios (Obligatorio)
                </label>
                <textarea
                  required
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  className="w-full bg-neutral-950/50 border border-neutral-700 rounded-xl p-4 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all resize-none"
                  rows={4}
                  placeholder="¿Qué te pareció este stand?"
                />
              </div>

              <button
                type="submit"
                disabled={enviando || !comentario.trim() || (activarEstrellas && estrellas === 0)}
                className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl shadow-lg text-white font-bold bg-linear-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviando ? (
                  <span>Enviando...</span>
                ) : (
                  <>
                    <span>Enviar Feedback</span>
                    <Send className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}