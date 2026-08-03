"use client";

import { useEffect, useState } from "react";
import { getSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Star, CheckCircle, MapPin, Activity, Camera, X, Sun, Moon, Globe, Award, Gift } from "lucide-react";
import { obtenerEstadisticasCliente } from "@/actions/clienteDashboard";
import { obtenerAjustes, obtenerHistorialGanadores } from "@/actions/lotteryActions";
import confetti from "canvas-confetti";

export default function ClienteDashboard() {
  const [user, setUser] = useState<any>(null);
  const [estadisticas, setEstadisticas] = useState({ total: 0, historial: [] as any[] });
  const [loading, setLoading] = useState(true);
  
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [escanerAbierto, setEscanerAbierto] = useState(false);
  const [language, setLanguage] = useState<"en" | "es">("en");
  
  // ESTADOS DE GAMIFICACIÓN Y SORTEO
  const [metaStands, setMetaStands] = useState(5);
  const [soyGanador, setSoyGanador] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem("cliente-theme") as "dark" | "light";
    if (savedTheme) setTheme(savedTheme);

    const savedLang = localStorage.getItem("app-lang") as "en" | "es";
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      setLanguage("en");
      localStorage.setItem("app-lang", "en");
    }

    const fetchUserData = async () => {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user);
        const data = await obtenerEstadisticasCliente(session.user.id);
        setEstadisticas(data);

        // Obtener la meta y chequear si hay que lanzar confeti
        const ajustes = await obtenerAjustes();
        setMetaStands(ajustes.requiredStandsForLottery);

        if (data.total >= ajustes.requiredStandsForLottery) {
          const yaCelebro = localStorage.getItem(`confetti_${session.user.id}`);
          if (!yaCelebro) {
            dispararConfeti();
            localStorage.setItem(`confetti_${session.user.id}`, "true");
          }
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

  // SISTEMA DE NOTIFICACIÓN EN TIEMPO REAL (Polling)
  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(async () => {
      const historial = await obtenerHistorialGanadores();
      const gane = historial.some((premio: any) => premio.clienteId === user.id);
      if (gane && !soyGanador) setSoyGanador(true);
    }, 10000); // Consulta cada 10 segundos
    return () => clearInterval(interval);
  }, [user, soyGanador]);

  const dispararConfeti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("cliente-theme", newTheme);
  };

  const toggleLanguage = () => {
    const newLang = language === "en" ? "es" : "en";
    setLanguage(newLang);
    localStorage.setItem("app-lang", newLang);
  };

  const isDark = theme === "dark";
  const t = (es: string, en: string) => language === "en" ? en : es;

  useEffect(() => {
    let html5QrCode: any = null;

    if (escanerAbierto) {
      import("html5-qrcode").then(({ Html5Qrcode }) => {
        html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCode.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            html5QrCode.stop().then(() => {
              setEscanerAbierto(false);
              try {
                const urlObj = new URL(decodedText);
                router.push(urlObj.pathname);
              } catch (e) {
                router.push(decodedText);
              }
            });
          },
          (err: any) => {}
        ).catch((err: any) => {
          console.error("No se pudo iniciar la cámara:", err);
        });
      });
    }

    return () => {
      if (html5QrCode) {
        try { html5QrCode.stop().catch(() => {}); } catch (error) {}
      }
    };
  }, [escanerAbierto, router]);

  if (loading) {
    return <div className={`min-h-screen flex justify-center items-center font-bold ${isDark ? "bg-neutral-950 text-[#c81474]" : "bg-gray-50 text-[#c81474]"}`}>{t("Cargando tu perfil...", "Loading your profile...")}</div>;
  }

  const progreso = Math.min((estadisticas.total / metaStands) * 100, 100);
  const completado = estadisticas.total >= metaStands;

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-neutral-950 text-white" : "bg-gray-50 text-gray-900"}`}>
      
      {isDark && (
        <>
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#c81474]/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        </>
      )}

      <header className={`px-6 py-4 flex justify-between items-center relative z-10 top-0 border-b ${isDark ? "bg-neutral-900/80 backdrop-blur-md border-[#c81474]/20" : "bg-white/90 backdrop-blur-md border-gray-200 shadow-sm"}`}>
        <div className="flex-1 mr-4 flex items-center space-x-4">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          <div>
            <p className={`text-xs tracking-widest uppercase font-bold ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{t("Bienvenido", "Welcome")}</p>
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-[#c81474] to-pink-500 wrap-break-word leading-tight">
              {user?.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button onClick={toggleLanguage} className={`p-2 rounded-full transition-colors ${isDark ? "bg-neutral-800/50 text-blue-400 hover:bg-neutral-700" : "bg-gray-100 text-blue-600 hover:bg-gray-200"}`} title={t("Cambiar Idioma", "Change Language")}>
            <Globe className="w-5 h-5" />
          </button>
          <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${isDark ? "bg-neutral-800/50 text-yellow-400 hover:bg-neutral-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`} title={t("Cambiar Tema", "Toggle Theme")}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={`p-2 rounded-full transition-colors ${isDark ? "text-neutral-400 hover:text-red-400 bg-neutral-800/50" : "text-gray-500 hover:text-red-500 bg-gray-100"}`}
            title={t("Cerrar Sesión", "Sign Out")}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full relative z-10 pb-20">
        
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setEscanerAbierto(true)}
          className="w-full mb-8 flex items-center justify-center space-x-3 bg-[#c81474] hover:bg-[#a61060] text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(200,20,116,0.4)] transition-all active:scale-95"
        >
          <Camera className="w-7 h-7" />
          <span>{t("Escanear Stand", "Scan Stand")}</span>
        </motion.button>

        {/* GAMIFICACIÓN: PASAPORTE DIGITAL */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-3xl p-8 text-center shadow-[0_0_30px_rgba(200,20,116,0.15)] mb-8 relative overflow-hidden ${isDark ? "bg-linear-to-br from-neutral-900 to-neutral-950 border-[#c81474]/30" : "bg-white border-gray-200"}`}
        >
          {completado && <div className="absolute inset-0 bg-linear-to-br from-yellow-400/10 to-yellow-600/10 pointer-events-none" />}
          
          <div className="flex justify-center mb-4 relative z-10">
            {completado ? (
              <div className="bg-yellow-500/20 p-4 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.4)] animate-pulse border border-yellow-500/50">
                <Award className="w-12 h-12 text-yellow-500" />
              </div>
            ) : (
              <Activity className="w-10 h-10 text-[#c81474]" />
            )}
          </div>
          
          <h2 className={`text-6xl font-black mb-2 relative z-10 ${completado ? "text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-yellow-600" : (isDark ? "text-white" : "text-gray-900")}`}>
            {estadisticas.total} <span className="text-2xl text-neutral-500">/ {metaStands}</span>
          </h2>
          <p className="text-[#c81474] font-bold uppercase tracking-widest text-sm relative z-10">{t("Pasaporte Digital", "Digital Passport")}</p>
          
          {/* BARRA DE PROGRESO */}
          <div className={`w-full rounded-full h-4 mb-2 mt-6 overflow-hidden border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-gray-200 border-gray-300"}`}>
            <div className="bg-linear-to-r from-[#c81474] to-pink-500 h-4 rounded-full transition-all duration-1000 relative" style={{ width: `${progreso}%` }}>
              <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]"></div>
            </div>
          </div>

          <p className={`mt-2 text-sm font-medium relative z-10 ${completado ? "text-yellow-600 font-bold" : (isDark ? "text-neutral-400" : "text-gray-500")}`}>
            {completado 
              ? t("¡Misión Cumplida! Ya participas en el sorteo.", "Mission Accomplished! You are in the draw.") 
              : t(`Faltan ${metaStands - estadisticas.total} stands para el sorteo.`, `${metaStands - estadisticas.total} stands left for the draw.`)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className={`text-lg font-bold mb-4 flex items-center uppercase tracking-widest ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
            <MapPin className="w-5 h-5 mr-2 text-[#c81474]" />
            {t("Tu Recorrido", "Your Tour")}
          </h3>

          <div className="space-y-4">
            {estadisticas.historial.length === 0 ? (
              <div className={`border rounded-2xl p-8 text-center ${isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-white border-gray-200 shadow-sm"}`}>
                <p className={isDark ? "text-neutral-500" : "text-gray-500"}>{t("Aún no has calificado ningún stand.", "You haven't rated any stands yet.")}</p>
              </div>
            ) : (
              estadisticas.historial.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`border rounded-2xl p-5 flex items-center justify-between ${isDark ? "bg-neutral-900/80 backdrop-blur-sm border-neutral-800" : "bg-white border-gray-200 shadow-sm"}`}
                >
                  <div className="flex-1">
                    <h4 className={`font-bold text-lg mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>{item.standNombre}</h4>
                    <p className={`text-xs font-medium ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
                      {new Date(item.fecha).toLocaleDateString(language === "en" ? 'en-US' : 'es-ES', { 
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
                    {item.estrellas && (
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${isDark ? "bg-yellow-500/10" : "bg-yellow-50 border border-yellow-200"}`}>
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-yellow-600 font-bold text-xs">{item.estrellas}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </main>

      <AnimatePresence>
        {escanerAbierto && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className={`border rounded-3xl p-6 relative max-w-md w-full shadow-2xl flex flex-col items-center ${isDark ? "bg-neutral-900 border-[#c81474]" : "bg-white border-[#c81474]"}`}
            >
              <button 
                onClick={() => setEscanerAbierto(false)} 
                className={`absolute top-4 right-4 p-2 rounded-full z-50 transition-colors ${isDark ? "text-neutral-400 hover:text-white bg-neutral-800" : "text-gray-500 hover:text-gray-900 bg-gray-100"}`}
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className={`text-xl font-bold mb-6 uppercase tracking-widest text-center mt-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                {t("Escanear Stand", "Scan Stand")}
              </h2>
              
              <div id="qr-reader" className="w-full max-w-sm rounded-2xl overflow-hidden border-4 border-[#c81474] min-h-75 flex items-center justify-center bg-black">
              </div>
              
              <p className={`mt-6 text-center text-sm font-medium ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
                {t("Apunta tu cámara al código QR proporcionado por el stand para evaluarlo.", "Point your camera at the QR code provided by the stand to evaluate it.")}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SÚPER MODAL: ¡ERES EL GANADOR! */}
      <AnimatePresence>
        {soyGanador && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-100 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <motion.div initial={{ scale: 0.5, y: 100 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", damping: 12 }} className="bg-linear-to-b from-yellow-400 to-yellow-600 rounded-3xl p-1 relative max-w-sm w-full shadow-[0_0_100px_rgba(234,179,8,0.6)]">
              <div className="bg-neutral-950 rounded-[22px] p-8 text-center relative overflow-hidden">
                <button onClick={() => setSoyGanador(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><X className="w-6 h-6" /></button>
                <Gift className="w-24 h-24 text-yellow-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] animate-bounce" />
                <h2 className="text-4xl font-black text-white uppercase tracking-widest mb-2">{t("¡FELICIDADES!", "CONGRATULATIONS!")}</h2>
                <h3 className="text-xl font-bold text-yellow-400 mb-6">{t("¡HAS GANADO EL SORTEO!", "YOU WON THE DRAW!")}</h3>
                <p className="text-neutral-300 font-medium mb-8 leading-relaxed">
                  {t("Tu ID fue seleccionado. Por favor, acércate a la tarima principal para reclamar tu reconocimiento.", "Your ID was selected. Please approach the main stage to claim your award.")}
                </p>
                <button onClick={() => setSoyGanador(false)} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-widest py-4 rounded-xl transition-colors">
                  {t("Entendido", "Got it")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}