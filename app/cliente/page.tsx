"use client";

import { useEffect, useState } from "react";
import { getSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Star, CheckCircle, MapPin, Activity, Camera, X, Sun, Moon } from "lucide-react";
import { obtenerEstadisticasCliente } from "@/actions/clienteDashboard";

export default function ClienteDashboard() {
  const [user, setUser] = useState<any>(null);
  const [estadisticas, setEstadisticas] = useState({ total: 0, historial: [] as any[] });
  const [loading, setLoading] = useState(true);
  
  // Estados nuevos: Tema y Escáner
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [escanerAbierto, setEscanerAbierto] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Cargar preferencia de tema
    const savedTheme = localStorage.getItem("cliente-theme") as "dark" | "light";
    if (savedTheme) setTheme(savedTheme);

    const fetchUserData = async () => {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user);
        const data = await obtenerEstadisticasCliente(session.user.id);
        setEstadisticas(data);
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("cliente-theme", newTheme);
  };

  const isDark = theme === "dark";

  // Lógica del Escáner Nativo Integrado (Inmediato)
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
          (err: any) => {
            // Se ignoran los errores de búsqueda en tiempo real
          }
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
    return <div className={`min-h-screen flex justify-center items-center font-bold ${isDark ? "bg-neutral-950 text-[#c81474]" : "bg-gray-50 text-[#c81474]"}`}>Cargando tu perfil...</div>;
  }

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-neutral-950 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Luces de fondo (Solo en modo oscuro) */}
      {isDark && (
        <>
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#c81474]/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        </>
      )}

      {/* Navbar Móvil */}
      <header className={`px-6 py-4 flex justify-between items-center relative z-10 top-0 border-b ${isDark ? "bg-neutral-900/80 backdrop-blur-md border-[#c81474]/20" : "bg-white/90 backdrop-blur-md border-gray-200 shadow-sm"}`}>
        <div className="flex-1 mr-4">
          <p className={`text-xs tracking-widest uppercase font-bold ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Visitante VIP</p>
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-[#c81474] to-pink-500 wrap-break-word leading-tight">
            {user?.name}
          </h1>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${isDark ? "bg-neutral-800/50 text-yellow-400 hover:bg-neutral-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={`flex items-center space-x-2 p-2 rounded-full transition-colors ${isDark ? "text-neutral-400 hover:text-red-400 bg-neutral-800/50" : "text-gray-500 hover:text-red-500 bg-gray-100"}`}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full relative z-10">
        
        {/* BOTÓN DE ESCÁNER DE CÁMARA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setEscanerAbierto(true)}
          className="w-full mb-8 flex items-center justify-center space-x-3 bg-[#c81474] hover:bg-[#a61060] text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(200,20,116,0.4)] transition-all active:scale-95"
        >
          <Camera className="w-7 h-7" />
          <span>Escanear Stand</span>
        </motion.button>

        {/* Tarjeta de Progreso */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-3xl p-8 text-center shadow-[0_0_30px_rgba(200,20,116,0.15)] mb-8 ${isDark ? "bg-linear-to-br from-neutral-900 to-neutral-950 border-[#c81474]/30" : "bg-white border-gray-200"}`}
        >
          <Activity className="w-10 h-10 text-[#c81474] mx-auto mb-4" />
          <h2 className={`text-6xl font-black mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>{estadisticas.total}</h2>
          <p className="text-[#c81474] font-bold uppercase tracking-widest text-sm">Stands Calificados</p>
          <p className={`mt-4 text-sm font-medium ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
            ¡Sigue escaneando códigos QR para completar tu recorrido!
          </p>
        </motion.div>

        {/* Historial de Calificaciones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className={`text-lg font-bold mb-4 flex items-center uppercase tracking-widest ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
            <MapPin className="w-5 h-5 mr-2 text-[#c81474]" />
            Tu Recorrido
          </h3>

          <div className="space-y-4">
            {estadisticas.historial.length === 0 ? (
              <div className={`border rounded-2xl p-8 text-center ${isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-white border-gray-200 shadow-sm"}`}>
                <p className={isDark ? "text-neutral-500" : "text-gray-500"}>Aún no has calificado ningún stand.</p>
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
                      {new Date(item.fecha).toLocaleDateString('es-ES', { 
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

      {/* MODAL DEL ESCÁNER DE CÁMARA */}
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
                Escanear Stand
              </h2>
              
              <div id="qr-reader" className="w-full max-w-sm rounded-2xl overflow-hidden border-4 border-[#c81474] min-h-75 flex items-center justify-center bg-black">
                {/* La librería inyectará el video aquí */}
              </div>
              
              <p className={`mt-6 text-center text-sm font-medium ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
                Apunta tu cámara al código QR proporcionado por el stand para evaluarlo.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}