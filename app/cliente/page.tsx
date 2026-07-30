"use client";

import { useEffect, useState } from "react";
import { getSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { LogOut, Star, CheckCircle, MapPin, Activity } from "lucide-react";
import { obtenerEstadisticasCliente } from "@/actions/clienteDashboard";

export default function ClienteDashboard() {
  const [user, setUser] = useState<any>(null);
  const [estadisticas, setEstadisticas] = useState({ total: 0, historial: [] as any[] });
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 flex justify-center items-center text-fuchsia-500">Cargando tu perfil...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col relative overflow-hidden">
      {/* Luces de fondo */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar Móvil */}
      <header className="bg-neutral-900/80 backdrop-blur-md border-b border-fuchsia-500/20 px-6 py-4 flex justify-between items-center relative z-10 top-0">
        <div>
          <p className="text-neutral-400 text-xs tracking-widest uppercase">Visitante VIP</p>
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-fuchsia-400 to-purple-500 truncate max-w-50">
            {user?.name}
          </h1>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center space-x-2 text-neutral-400 hover:text-red-400 transition-colors bg-neutral-800/50 p-2 rounded-full"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full relative z-10">
        
        {/* Tarjeta de Progreso */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-br from-neutral-900 to-neutral-950 border border-fuchsia-500/30 rounded-3xl p-8 text-center shadow-[0_0_30px_rgba(217,70,239,0.15)] mb-8"
        >
          <Activity className="w-10 h-10 text-fuchsia-500 mx-auto mb-4" />
          <h2 className="text-6xl font-black text-white mb-2">{estadisticas.total}</h2>
          <p className="text-fuchsia-400 font-bold uppercase tracking-widest text-sm">Stands Calificados</p>
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
            <MapPin className="w-5 h-5 mr-2 text-fuchsia-500" />
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
    </div>
  );
}