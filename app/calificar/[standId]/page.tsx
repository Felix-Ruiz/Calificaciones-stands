"use client";

import { useEffect, useState, use } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, Send, CheckCircle, AlertTriangle, Loader2, Globe, Sun, Moon } from "lucide-react";
import { obtenerInfoEncuesta, enviarCalificacion } from "@/actions/ratingActions";

export default function CalificarPage({ params }: { params: Promise<{ standId: string }> }) {
  const router = useRouter();
  
  const { standId } = use(params);

  // Estados de sesión
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Estados de datos
  const [loadingData, setLoadingData] = useState(true);
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

  // Estados de Tema e Idioma (Por defecto en inglés)
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedLang = localStorage.getItem("app-lang") as "en" | "es";
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      setLanguage("en");
      localStorage.setItem("app-lang", "en");
    }

    const savedTheme = localStorage.getItem("app-theme") as "dark" | "light";
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme("dark");
      localStorage.setItem("app-theme", "dark");
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "es" : "en";
    setLanguage(newLang);
    localStorage.setItem("app-lang", newLang);
    localStorage.setItem("master-lang", newLang);
    localStorage.setItem("cliente-lang", newLang);
    localStorage.setItem("stand-lang", newLang);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("app-theme", newTheme);
    localStorage.setItem("master-theme", newTheme);
    localStorage.setItem("cliente-theme", newTheme);
    localStorage.setItem("stand-theme", newTheme);
  };

  const isDark = theme === "dark";
  const t = (es: string, en: string) => language === "en" ? en : es;

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const session = await getSession();
        
        if (!session?.user?.id) {
          const callback = encodeURIComponent(`/calificar/${standId}`);
          window.location.href = `/login?callbackUrl=${callback}`;
          return;
        }
        
        setUserId(session.user.id);
        setLoadingAuth(false);
        cargarDatos(session.user.id);
        
      } catch (error) {
        setErrorInfo(t("Error al verificar tu cuenta.", "Error verifying your account."));
        setLoadingAuth(false);
      }
    };

    if (standId) {
      verificarSesion();
    }
  }, [standId, language]);

  const cargarDatos = async (clienteId: string) => {
    try {
      const data = await obtenerInfoEncuesta(standId, clienteId);
      if (data.error) {
        setErrorInfo(data.error);
      } else {
        setStandNombre(data.standNombre || "Stand");
        setYaCalifico(data.yaCalifico!);
        setActivarEstrellas(data.activarEstrellas!);
      }
    } catch (error) {
      setErrorInfo(t("Error de conexión al cargar la encuesta. Intenta de nuevo.", "Connection error loading the survey. Please try again."));
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentario.trim() || !userId) return;
    
    setEnviando(true);
    try {
      const res = await enviarCalificacion(
        userId,
        standId,
        comentario,
        activarEstrellas ? estrellas : null
      );

      if (res.success) {
        setExito(true);
        setTimeout(() => {
          router.push("/cliente");
        }, 3000);
      } else {
        setEnviando(false);
      }
    } catch (error) {
      setEnviando(false);
      setErrorInfo(t("Hubo un error al enviar tu calificación.", "There was an error submitting your rating."));
    }
  };

  if (loadingAuth) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center ${isDark ? "bg-neutral-950 text-[#c81474]" : "bg-gray-50 text-[#c81474]"}`}>
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold tracking-widest uppercase text-sm animate-pulse">
          {t("Verificando acceso...", "Verifying access...")}
        </p>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center ${isDark ? "bg-neutral-950 text-[#c81474]" : "bg-gray-50 text-[#c81474]"}`}>
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold tracking-widest uppercase text-sm animate-pulse">
          {t("Cargando encuesta...", "Loading survey...")}
        </p>
      </div>
    );
  }

  if (errorInfo) return (
    <div className={`min-h-screen flex flex-col justify-center items-center text-center p-6 ${isDark ? "bg-neutral-950" : "bg-gray-50"}`}>
      <AlertTriangle className="w-16 h-16 text-[#c81474] mb-4" />
      <h1 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
        {t("Ups, algo salió mal", "Oops, something went wrong")}
      </h1>
      <p className={`mb-6 ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
        {errorInfo}
      </p>
      <button 
        onClick={() => window.location.reload()} 
        className="bg-neutral-800 text-white px-6 py-2 rounded-lg hover:bg-neutral-700 transition-colors"
      >
        {t("Reintentar", "Retry")}
      </button>
    </div>
  );

  if (yaCalifico) return (
    <div className={`min-h-screen flex flex-col justify-center items-center text-center p-6 relative overflow-hidden ${isDark ? "bg-neutral-950" : "bg-gray-50"}`}>
      <div className="absolute inset-0 bg-linear-to-b from-[#c81474]/20 to-transparent pointer-events-none" />
      <CheckCircle className="w-24 h-24 text-[#c81474] mb-6 relative z-10" />
      <h1 className={`text-3xl font-bold mb-4 relative z-10 ${isDark ? "text-white" : "text-gray-900"}`}>
        {t("¡Ya calificaste este Stand!", "You have already rated this Stand!")}
      </h1>
      <p className={`mb-8 relative z-10 max-w-md ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
        {t("Gracias por tu participación. No puedes calificar el mismo stand más de una vez.", "Thank you for participating. You cannot rate the same stand more than once.")}
      </p>
      <button 
        onClick={() => router.push("/cliente")} 
        className="relative z-10 bg-[#c81474] hover:bg-[#a61060] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md"
      >
        {t("Volver a mi inicio", "Return to Home")}
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-gray-50"}`}>
      
      {/* Botones de Idioma y Tema */}
      <div className="absolute top-6 right-6 z-50 flex items-center space-x-3">
        <button 
          onClick={toggleLanguage} 
          className={`flex items-center space-x-2 border px-4 py-2 rounded-full transition-colors shadow-lg ${isDark ? "bg-neutral-900 border-[#c81474]/50 text-[#c81474] hover:bg-neutral-800" : "bg-white border-[#c81474]/30 text-[#c81474] hover:bg-gray-100"}`}
          title={t("Cambiar Idioma", "Change Language")}
        >
          <Globe className="w-5 h-5" />
          <span className="font-bold uppercase tracking-widest text-sm">{language === "en" ? "EN" : "ES"}</span>
        </button>

        <button 
          onClick={toggleTheme} 
          className={`flex items-center justify-center p-2.5 rounded-full transition-colors shadow-lg border ${isDark ? "bg-neutral-900 border-[#c81474]/50 text-[#c81474] hover:bg-neutral-800" : "bg-white border-[#c81474]/30 text-[#c81474] hover:bg-gray-100"}`}
          title={t("Cambiar Tema", "Toggle Theme")}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Luces de fondo */}
      {isDark && (
        <>
          <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-[#c81474]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* Marca de agua */}
      <div className={`absolute inset-0 z-0 flex justify-center items-center pointer-events-none ${isDark ? "opacity-10" : "opacity-[0.03]"}`}>
        <img src="/logo.png" alt="STANDS Background" className="w-[80%] h-[80%] object-contain" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        {exito ? (
          <div className={`backdrop-blur-xl border border-[#c81474]/30 rounded-3xl p-10 text-center shadow-[0_0_50px_rgba(200,20,116,0.15)] ${isDark ? "bg-neutral-900/80" : "bg-white/90"}`}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
              <CheckCircle className="w-20 h-20 text-[#c81474] mx-auto mb-6" />
            </motion.div>
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              {t("¡Calificación Enviada!", "Rating Submitted!")}
            </h2>
            <p className={isDark ? "text-neutral-400" : "text-gray-500"}>
              {t("Redirigiendo a tu panel...", "Redirecting to your dashboard...")}
            </p>
          </div>
        ) : (
          <div className={`backdrop-blur-xl border rounded-3xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.2)] ${isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white/90 border-gray-200"}`}>
            <div className="text-center mb-8">
              <p className="text-[#c81474] text-sm font-bold tracking-widest uppercase mb-2">
                {t("Estás calificando a:", "You are rating:")}
              </p>
              <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {standNombre}
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {activarEstrellas && (
                <div className="flex flex-col items-center mb-8">
                  <p className={`mb-4 text-sm uppercase tracking-wider font-bold ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
                    {t("Tu puntuación", "Your rating")}
                  </p>
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
                              ? "text-[#c81474] fill-[#c81474] drop-shadow-[0_0_10px_rgba(200,20,116,0.5)]" 
                              : (isDark ? "text-neutral-700" : "text-gray-300")
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-sm font-bold mb-2 ml-1 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
                  {t("Comentarios (Obligatorio)", "Comments (Required)")}
                </label>
                <textarea
                  required
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  className={`w-full border rounded-xl p-4 focus:outline-none focus:border-[#c81474] transition-all resize-none ${isDark ? "bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600" : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"}`}
                  rows={4}
                  placeholder={t("¿Qué te pareció este stand?", "What did you think of this stand?")}
                />
              </div>

              <button
                type="submit"
                disabled={enviando || !comentario.trim() || (activarEstrellas && estrellas === 0)}
                className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(200,20,116,0.3)] text-white font-bold bg-linear-to-r from-[#c81474] to-purple-600 hover:from-[#a61060] hover:to-purple-500 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {enviando ? (
                  <span>{t("Enviando...", "Submitting...")}</span>
                ) : (
                  <>
                    <span>{t("Enviar Feedback", "Submit Feedback")}</span>
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