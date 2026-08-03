"use client";

import { useEffect, useState } from "react";
import { getSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Star, CheckCircle, MapPin, Activity, Camera, X } from "lucide-react";
import { obtenerEstadisticasCliente } from "@/actions/clienteDashboard";

export default function ClienteDashboard() {
  const [user, setUser] = useState<any>(null);
  const [estadisticas, setEstadisticas] = useState({ total: 0, historial: [] as any[] });
  const [loading, setLoading] = useState(true);
  
  // Nuevo estado para el modal del escáner
  const [escanerAbierto, setEscanerAbierto] = useState(false);

  useEffect(() => {
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

  // Lógica de importación dinámica para evitar errores de SSR en Next.js con el escáner
  useEffect(() => {
    if (escanerAbierto) {
      let scanner: any = null;
      import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
        scanner = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );
        scanner.render(
          (decodedText: string) => {
            scanner.clear();
            setEscanerAbierto(false);
            window.location.href = decodedText; // Te lleva directo a calificar el stand
          },
          (err: any) => {
            // Ignoramos errores de lectura en tiempo real
          }
        );
      });

      return () => {
        if (scanner) {
          scanner.clear().catch((e: any) => console.log("Cerrando escáner...", e));
        }
      };
    }
  }, [escanerAbierto]);

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 flex justify-center items-center text-[#c81474]">Cargando tu perfil...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col relative overflow-hidden">
      {/* Luces de fondo actualizadas a color #c81474 */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#c81474]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar Móvil */}
      <header className="bg-neutral-900/80 backdrop-blur-md border-b border-[#c81474]/20 px-6 py-4 flex justify-between items-center relative z-10 top-0">
        <div className="flex-1 mr-4">
          <p className="text-neutral-400 text-xs tracking-widest uppercase">Visitante VIP</p>
          {/* SOLUCIÓN: Quitamos 'truncate max-w-50' y agregamos 'break-words leading-tight' para mostrar el nombre completo */}
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-[#c81474] to-pink-500 wrap-break-word leading-tight">
            {user?.name}
          </h1>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center space-x-2 text-neutral-400 hover:text-red-400 transition-colors bg-neutral-800/50 p-2 rounded-full shrink-0"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full relative z-10">
        
        {/* BOTÓN DE ESCÁNER DE CÁMARA NATIVO */}
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
          transition={{ delay: 0.1 }}
          className="bg-linear-to-br from-neutral-900 to-neutral-950 border border-[#c81474]/30 rounded-3xl p-8 text-center shadow-[0_0_30px_rgba(200,20,116,0.15)] mb-8"
        >
          <Activity className="w-10 h-10 text-[#c81474] mx-auto mb-4" />
          <h2 className="text-6xl font-black text-white mb-2">{estadisticas.total}</h2>
          <p className="text-[#c81474] font-bold uppercase tracking-widest text-sm">Stands Calificados</p>
          <p className="text-neutral-400 mt-4 text-sm">
            ¡Sigue escaneando códigos QR para completar tu recorrido!
          </p>
        </motion.div>

        {/* Historial de Calificaciones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-bold mb-4 flex items-center text-neutral-300 uppercase tracking-widest">
            <MapPin className="w-5 h-5 mr-2 text-[#c81474]" />
            Tu Recorrido
          </h3>

          <div className="space-y-4">
            {estadisticas.historial.length === 0 ? (
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 text-center">
                <p className="text-neutral-500">Aún no has calificado ningún stand.</p>
              </div>
            ) : (
              estadisticas.historial.map((item, index) => (
                <div 
                  key={item.id} 
                  className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-2xl p-5 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-white mb-1">{item.standNombre}</h4>
                    <p className="text-xs text-neutral-500">
                      {new Date(item.fecha).toLocaleDateString('es-ES', { 
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
                    {item.estrellas && (
                      <div className="flex items-center space-x-1 bg-yellow-500/10 px-2 py-1 rounded-full">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-yellow-500 font-bold text-xs">{item.estrellas}</span>
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
              className="bg-neutral-900 border border-[#c81474] rounded-3xl p-6 relative max-w-md w-full shadow-2xl flex flex-col items-center"
            >
              <button 
                onClick={() => setEscanerAbierto(false)} 
                className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-neutral-800 p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest text-center mt-2">
                Escanear Stand
              </h2>
              
              {/* Contenedor donde la librería de HTML5 inyecta el video de la cámara */}
              <div id="qr-reader" className="w-full max-w-sm rounded-2xl overflow-hidden border-4 border-[#c81474]"></div>
              
              <p className="text-neutral-400 mt-6 text-center text-sm font-medium">
                Apunta tu cámara al código QR proporcionado por el stand para evaluarlo.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}