"use client";

import { useEffect, useState } from "react";
import { getSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Star, CheckCircle, MapPin, Activity, Camera, X, Sun, Moon, Globe, Award, Gift, Download } from "lucide-react";
import { obtenerEstadisticasCliente } from "@/actions/clienteDashboard";
import { obtenerAjustes, obtenerHistorialGanadores } from "@/actions/lotteryActions";
import confetti from "canvas-confetti";

export default function ClienteDashboard() {
  const [user, setUser] = useState<any>(null);
  const [estadisticas, setEstadisticas] = useState({ total: 0, historial: [] as any[] });
  const [loading, setLoading] = useState(true);
  
  // Estados para Tema, Escáner y PWA
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [escanerAbierto, setEscanerAbierto] = useState(false);
  const [language, setLanguage] = useState<"en" | "es">("en");
  
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(true);

  // Estados de Gamificación y Sorteo
  const [metaStands, setMetaStands] = useState(5);
  const [soyGanador, setSoyGanador] = useState(false);
  const [premioActualId, setPremioActualId] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    // 1. Cargar preferencias visuales
    const savedTheme = localStorage.getItem("cliente-theme") as "dark" | "light";
    if (savedTheme) setTheme(savedTheme);

    const savedLang = localStorage.getItem("app-lang") as "en" | "es";
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      setLanguage("en");
      localStorage.setItem("app-lang", "en");
    }

    // 2. Detección de PWA (Solo para el botón flotante)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsAppInstalled(isStandalone);

    // 3. Cargar datos del usuario
    const fetchUserData = async () => {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user);
        const data = await obtenerEstadisticasCliente(session.user.id);
        setEstadisticas(data);

        // Obtener la meta configurada en el Master
        const ajustes = await obtenerAjustes();
        setMetaStands(ajustes.requiredStandsForLottery);

        // Disparar confeti si acaba de llegar a la meta
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

  // SISTEMA DE NOTIFICACIÓN EN TIEMPO REAL (Polling sin reabrir modals pasados)
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(async () => {
      const historial = await obtenerHistorialGanadores();
      const misPremios = historial.filter((p: any) => p.clienteId === user.id);
      
      if (misPremios.length > 0) {
        // Tomamos el ID de nuestro premio más reciente
        const lastPremioId = misPremios[0].id;
        
        // Verificamos si ya cerramos este popup específico
        const acknowledged = localStorage.getItem(`premio_ack_${lastPremioId}`);
        if (!acknowledged) {
          setPremioActualId(lastPremioId);
          setSoyGanador(true);
        }
      }
    }, 10000); 
    
    return () => clearInterval(interval);
  }, [user]);

  const cerrarSorteo = () => {
    setSoyGanador(false);
    if (premioActualId) {
      // Guardamos en caché que el usuario ya cerró este premio
      localStorage.setItem(`premio_ack_${premioActualId}`, "true");
    }
  };

  const cerrarPwaPrompt = () => {
    setShowPwaPrompt(false);
    localStorage.setItem('pwa-prompt-seen', "true");
  };

  const dispararConfeti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    // Usamos los colores de la marca para el confeti
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0, colors: ['#c81474', '#9d105b', '#e83b96'] };
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

  // Lógica del Escáner
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
    return (
      <div className={`min-h-screen flex justify-center items-center font-bold ${isDark ? "bg-neutral-950 text-[#c81474]" : "bg-gray-50 text-[#c81474]"}`}>
        {t("Cargando tu perfil...", "Loading your profile...")}
      </div>
    );
  }

  const progreso = Math.min((estadisticas.total / metaStands) * 100, 100);
  const completado = estadisticas.total >= metaStands;

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-neutral-950 text-white" : "bg-gray-50 text-gray-900"}`}>
      
      {/* Luces de fondo (Optimizadas para móvil) */}
      {isDark && (
        <>
          <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-[#c81474]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* MARCA DE AGUA DEL LOGO EN EL FONDO */}
      <div className={`absolute inset-0 z-0 flex justify-center items-center pointer-events-none ${isDark ? "opacity-10" : "opacity-[0.03]"}`}>
        <img src="/logo.png" alt="WEEF Background" className="w-[80%] h-[80%] object-contain" />
      </div>

      {/* BOTÓN FLOTANTE PWA */}
      {!isAppInstalled && (
        <button 
          onClick={() => setShowPwaPrompt(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-[#c81474] text-white rounded-full shadow-[0_0_20px_rgba(200,20,116,0.4)] hover:bg-[#a61060] hover:scale-105 transition-all"
          title={t("Instalar App", "Install App")}
        >
          <Download className="w-6 h-6" />
        </button>
      )}

      <header className={`px-6 py-4 flex justify-between items-center relative z-10 top-0 border-b ${isDark ? "bg-neutral-900/80 backdrop-blur-md border-[#c81474]/20" : "bg-white/90 backdrop-blur-md border-gray-200 shadow-sm"}`}>
        
        {/* LOGO + BIENVENIDA */}
        <div className="flex-1 mr-4 flex items-center space-x-4">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          <div>
            <p className={`text-xs tracking-widest uppercase font-bold ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
              {t("Bienvenido", "Welcome")}
            </p>
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-[#c81474] to-pink-500 wrap-break-word leading-tight">
              {user?.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button 
            onClick={toggleLanguage} 
            className={`p-2 rounded-full transition-colors ${isDark ? "bg-neutral-800/50 text-[#c81474] hover:bg-neutral-700" : "bg-gray-100 text-[#c81474] hover:bg-gray-200"}`} 
            title={t("Cambiar Idioma", "Change Language")}
          >
            <Globe className="w-5 h-5" />
          </button>
          <button 
            onClick={toggleTheme} 
            className={`p-2 rounded-full transition-colors ${isDark ? "bg-neutral-800/50 text-[#c81474] hover:bg-neutral-700" : "bg-gray-100 text-[#c81474] hover:bg-gray-200"}`} 
            title={t("Cambiar Tema", "Toggle Theme")}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={`p-2 rounded-full transition-colors ${isDark ? "text-neutral-400 hover:text-[#c81474] bg-neutral-800/50" : "text-gray-500 hover:text-[#c81474] bg-gray-100"}`}
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

        {/* GAMIFICACIÓN Y ESTADÍSTICAS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-3xl p-8 text-center shadow-[0_0_30px_rgba(200,20,116,0.15)] mb-8 relative overflow-hidden ${isDark ? "bg-linear-to-br from-neutral-900 to-neutral-950 border-[#c81474]/30" : "bg-white border-gray-200"}`}
        >
          {completado && (
            <div className="absolute inset-0 bg-linear-to-br from-[#c81474]/10 to-purple-600/10 pointer-events-none" />
          )}
          
          <div className="flex justify-center mb-4 relative z-10">
            {completado ? (
              <div className="bg-[#c81474]/20 p-4 rounded-full shadow-[0_0_20px_rgba(200,20,116,0.4)] animate-pulse border border-[#c81474]/50">
                <Award className="w-12 h-12 text-[#c81474]" />
              </div>
            ) : (
              <Activity className="w-10 h-10 text-[#c81474]" />
            )}
          </div>
          
          <h2 className={`text-6xl font-black mb-2 relative z-10 ${completado ? "text-transparent bg-clip-text bg-linear-to-r from-[#c81474] to-purple-500" : (isDark ? "text-white" : "text-gray-900")}`}>
            {estadisticas.total} <span className="text-2xl text-neutral-500">/ {metaStands}</span>
          </h2>
          
          <p className="text-[#c81474] font-bold uppercase tracking-widest text-sm relative z-10">
            {t("Estadísticas de Stands", "Stand Statistics")}
          </p>
          
          {/* BARRA DE PROGRESO */}
          <div className={`w-full rounded-full h-4 mb-2 mt-6 overflow-hidden border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-gray-200 border-gray-300"}`}>
            <div 
              className="bg-linear-to-r from-[#c81474] to-purple-600 h-4 rounded-full transition-all duration-1000 relative" 
              style={{ width: `${progreso}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]"></div>
            </div>
          </div>

          <p className={`mt-2 text-sm font-bold relative z-10 ${completado ? "text-[#c81474]" : (isDark ? "text-neutral-400" : "text-gray-500")}`}>
            {completado 
              ? t("¡Misión Cumplida! Ya puedes participar en el sorteo.", "Mission Accomplished! You can now participate in the draw.") 
              : t(`Faltan ${metaStands - estadisticas.total} stands para poder participar en el sorteo.`, `${metaStands - estadisticas.total} stands left to participate in the draw.`)}
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
                <p className={isDark ? "text-neutral-500" : "text-gray-500"}>
                  {t("Aún no has calificado ningún stand.", "You haven't rated any stands yet.")}
                </p>
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
                    <CheckCircle className="w-6 h-6 text-[#c81474] mb-2" />
                    {item.estrellas && (
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${isDark ? "bg-[#c81474]/10" : "bg-pink-50 border border-pink-200"}`}>
                        <Star className="w-3 h-3 text-[#c81474] fill-[#c81474]" />
                        <span className="text-[#c81474] font-bold text-xs">{item.estrellas}</span>
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

      {/* SÚPER MODAL: ¡ERES EL GANADOR! (Corregidos Colores y Centrado) */}
      <AnimatePresence>
        {soyGanador && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
          >
            <motion.div 
              initial={{ scale: 0.5, y: 100 }} 
              animate={{ scale: 1, y: 0 }} 
              transition={{ type: "spring", damping: 12 }} 
              className="bg-linear-to-b from-[#c81474] to-purple-600 rounded-3xl p-1 relative max-w-sm w-full shadow-[0_0_100px_rgba(200,20,116,0.6)]"
            >
              <div className="bg-neutral-950 rounded-[22px] p-8 flex flex-col items-center text-center relative overflow-hidden">
                
                <button 
                  onClick={cerrarSorteo} 
                  className="absolute top-4 right-4 text-neutral-500 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
                
                <Gift className="w-24 h-24 text-[#c81474] mx-auto mb-6 drop-shadow-[0_0_15px_rgba(200,20,116,0.8)] animate-bounce" />
                
                <h2 className="text-4xl font-black text-white uppercase tracking-widest mb-2 w-full">
                  {t("¡FELICIDADES!", "CONGRATULATIONS!")}
                </h2>
                <h3 className="text-xl font-bold text-[#c81474] mb-6 w-full">
                  {t("¡HAS GANADO EL SORTEO!", "YOU WON THE DRAW!")}
                </h3>
                <p className="text-neutral-300 font-medium mb-8 leading-relaxed w-full">
                  {t("Tu ID fue seleccionado. Por favor, acércate a la tarima principal para reclamar tu reconocimiento.", "Your ID was selected. Please approach the main stage to claim your award.")}
                </p>
                
                <button 
                  onClick={cerrarSorteo} 
                  className="w-full bg-linear-to-r from-[#c81474] to-purple-600 hover:from-[#a61060] hover:to-purple-500 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-colors"
                >
                  {t("Entendido", "Got it")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP DE PWA (INSTALAR APP EN MÓVIL) */}
      <AnimatePresence>
        {showPwaPrompt && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }} 
            className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 md:max-w-md mx-auto"
          >
            <div className={`border rounded-3xl p-6 shadow-2xl relative ${isDark ? "bg-neutral-900 border-[#c81474]" : "bg-white border-[#c81474]"}`}>
              <button 
                onClick={cerrarPwaPrompt} 
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDark ? "text-neutral-400 hover:text-white bg-neutral-800" : "text-gray-500 hover:text-gray-900 bg-gray-100"}`}
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-4 mb-4">
                <img src="/icon.png" alt="App Icon" className="w-16 h-16 rounded-2xl shadow-md" />
                <div>
                  <h3 className={`font-black text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                    {t("Instala WEEF 2026", "Install WEEF 2026")}
                  </h3>
                  <p className={`text-sm font-medium ${isDark ? "text-[#c81474]" : "text-[#c81474]"}`}>
                    {t("Para una experiencia fluida", "For a seamless experience")}
                  </p>
                </div>
              </div>
              
              <div className={`text-sm mb-6 space-y-2 font-medium ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
                <p>1. {t("Toca el icono de Compartir", "Tap the Share icon")} <Download className="inline w-4 h-4 mx-1 text-[#c81474]"/> {t("en el menú inferior.", "in the bottom menu.")}</p>
                <p>2. {t("Selecciona 'Agregar a Inicio'.", "Select 'Add to Home Screen'.")}</p>
              </div>
              
              <button 
                onClick={cerrarPwaPrompt} 
                className="w-full font-bold uppercase tracking-widest py-3 rounded-xl border border-[#c81474] text-[#c81474] hover:bg-[#c81474]/10 transition-colors"
              >
                {t("Continuar en web", "Continue on web")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}