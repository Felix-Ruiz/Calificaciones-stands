"use client";

import { useEffect, useState, useRef } from "react";
import { getSession, signOut } from "next-auth/react";
import QRCodeStyling from "qr-code-styling";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Download, X, LogOut, Star, Printer, UserCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { obtenerCalificacionesStand } from "@/actions/ratingActions";
import { obtenerStands } from "@/actions/standActions";

export default function StandDashboard() {
  const [user, setUser] = useState<any>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [calificaciones, setCalificaciones] = useState<any[]>([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de Detalles del Cliente
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  const smallQrRef = useRef<HTMLDivElement>(null);
  const largeQrRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    const fetchSessionAndData = async () => {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user);
        const url = `${window.location.origin}/calificar/${session.user.id}`;
        
        const stands = await obtenerStands();
        const miStand = stands.find((s: any) => s.id === session.user.id);
        const standLogo = miStand?.logo || null;
        setLogo(standLogo);

        setCalificaciones(await obtenerCalificacionesStand(session.user.id));

        qrCodeInstance.current = new QRCodeStyling({
          width: 300,
          height: 300,
          data: url,
          image: standLogo || undefined,
          dotsOptions: {
            type: "dots",
            gradient: {
              type: "linear",
              rotation: Math.PI / 4,
              colorStops: [
                { offset: 0, color: "#d81b60" },
                { offset: 1, color: "#5b21b6" }
              ]
            }
          },
          cornersSquareOptions: { type: "dot" },
          cornersDotOptions: { type: "dot" },
          backgroundOptions: { color: "#ffffff" },
          imageOptions: {
            crossOrigin: "anonymous",
            margin: 0,
            imageSize: 0.3,
            hideBackgroundDots: false
          }
        });
      }
      setLoading(false);
    };
    fetchSessionAndData();
  }, []);

  useEffect(() => {
    if (smallQrRef.current && qrCodeInstance.current && !loading) {
      smallQrRef.current.innerHTML = ''; 
      qrCodeInstance.current.update({ width: 80, height: 80 });
      qrCodeInstance.current.append(smallQrRef.current);
    }
  }, [loading, user]);

  useEffect(() => {
    if (qrModalOpen && largeQrRef.current && qrCodeInstance.current) {
      largeQrRef.current.innerHTML = ''; 
      qrCodeInstance.current.update({ width: 300, height: 300 });
      qrCodeInstance.current.append(largeQrRef.current);
    } else if (!qrModalOpen && smallQrRef.current && qrCodeInstance.current) {
      smallQrRef.current.innerHTML = '';
      qrCodeInstance.current.update({ width: 80, height: 80 });
      qrCodeInstance.current.append(smallQrRef.current);
    }
  }, [qrModalOpen]);

  const exportarAExcel = () => {
    const dataParaExcel = calificaciones.map((c: any) => ({
      "Fecha": new Date(c.createdAt).toLocaleDateString(),
      "Nombres": c.cliente.nombres,
      "Apellidos": c.cliente.apellidos,
      "Institución": c.cliente.institucion,
      "Cargo": c.cliente.cargo,
      "Correo": c.cliente.correo,
      "Estrellas": c.estrellas || "N/A",
      "Comentario": c.comentario
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Calificaciones");
    XLSX.writeFile(workbook, `Calificaciones_${user?.name}.xlsx`);
  };

  // SOLUCIÓN DE IMPRESIÓN: Usamos "png" para evitar el recorte del SVG
  const imprimirQR = async () => {
    if (!qrCodeInstance.current) return;
    
    // Obtenemos un Blob de tipo PNG en lugar de SVG
    const blob = await qrCodeInstance.current.getRawData("png");
    if (!blob) return;

    // Creamos una URL temporal para la imagen
    const imgUrl = URL.createObjectURL(blob as Blob);

    const printWindow = window.open('', '', 'width=800,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Imprimir QR - ${user?.name}</title>
            <style>
              body { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif; text-align:center; }
              .qr-container { padding: 20px; border: 4px solid #c026d3; border-radius: 20px; margin-top: 10px; }
              img { width: 300px; height: 300px; object-fit: contain; }
              h1 { font-size: 32px; margin: 0 0 10px 0; }
              p { font-size: 18px; color: #666; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>${user?.name}</h1>
            <div class="qr-container">
              <img src="${imgUrl}" alt="QR Code" />
            </div>
            <p>Escanea este código para calificar nuestro stand</p>
            <script>
              // Esperamos que la imagen cargue para imprimir
              window.onload = function() {
                setTimeout(() => { window.print(); window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const abrirDetallesCliente = (cliente: any) => {
    setSelectedCliente(cliente);
    setIsClienteModalOpen(true);
  };

  if (loading) return <div className="min-h-screen bg-neutral-950 flex justify-center items-center text-fuchsia-500">Cargando panel...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <header className="bg-neutral-900/80 backdrop-blur-md border-b border-fuchsia-500/20 px-8 py-4 flex justify-between items-center relative z-10">
        <div>
          <p className="text-neutral-400 text-sm tracking-widest uppercase">Bienvenido, Stand</p>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-fuchsia-400 to-purple-500">
            {user?.name}
          </h1>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* NUEVA TARJETA PRÉMIUM EXCLUSIVA PARA TOTAL DE CALIFICACIONES */}
          <div className="md:col-span-2 relative bg-neutral-900/60 backdrop-blur-xl border border-fuchsia-500/30 rounded-3xl p-8 flex flex-col justify-center items-start shadow-[0_0_40px_rgba(217,70,239,0.15)] overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] opacity-10 pointer-events-none rotate-12">
              <Star className="w-64 h-64 text-fuchsia-500 fill-fuchsia-500" />
            </div>
            <p className="text-fuchsia-400 font-bold uppercase tracking-widest text-sm mb-2 flex items-center">
              <Star className="w-4 h-4 mr-2 fill-fuchsia-500" /> Rendimiento Global
            </p>
            <div className="flex items-baseline space-x-4 relative z-10">
              <h2 className="text-7xl font-black text-transparent bg-clip-text bg-linear-to-br from-white via-fuchsia-100 to-fuchsia-500 drop-shadow-lg">
                {calificaciones.length}
              </h2>
              <span className="text-neutral-400 text-lg font-medium leading-tight">calificaciones<br/>recibidas</span>
            </div>
          </div>

          <button onClick={() => setQrModalOpen(true)} className="group relative bg-linear-to-br from-fuchsia-600 to-purple-700 rounded-3xl p-8 flex flex-col justify-center items-center hover:from-fuchsia-500 hover:to-purple-600 transition-all shadow-[0_0_30px_rgba(217,70,239,0.2)] overflow-hidden">
            <div className="bg-white p-2 rounded-xl mb-4 relative z-10 overflow-hidden flex justify-center items-center min-w-20 min-h-20" ref={smallQrRef}>
            </div>
            <div className="flex items-center space-x-2 relative z-10">
              <Maximize2 className="w-5 h-5 text-white" />
              <span className="font-bold text-lg uppercase tracking-wider">Mostrar QR</span>
            </div>
          </button>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900">
            <h3 className="text-xl font-bold">Feedback de Visitantes</h3>
            <button onClick={exportarAExcel} disabled={calificaciones.length === 0} className="flex items-center space-x-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Exportar Excel</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/50">
                  <th className="p-4 font-semibold text-neutral-400">Visitante</th>
                  <th className="p-4 font-semibold text-neutral-400">Institución</th>
                  <th className="p-4 font-semibold text-neutral-400">Calificación</th>
                  <th className="p-4 font-semibold text-neutral-400">Comentario</th>
                </tr>
              </thead>
              <tbody>
                {calificaciones.length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center text-neutral-500">Aún no tienes calificaciones. ¡Muestra tu código QR!</td></tr>
                ) : (
                  calificaciones.map((c: any) => (
                    // FILA CLICABLE
                    <tr 
                      key={c.id} 
                      onClick={() => abrirDetallesCliente(c.cliente)}
                      className="border-b border-neutral-800/50 hover:bg-neutral-800/80 transition-colors cursor-pointer group"
                    >
                      <td className="p-4">
                        <p className="font-medium group-hover:text-fuchsia-400 transition-colors">{c.cliente.nombres} {c.cliente.apellidos}</p>
                        <p className="text-xs text-neutral-500">{c.cliente.cargo}</p>
                      </td>
                      <td className="p-4 text-neutral-300">{c.cliente.institucion}</td>
                      <td className="p-4">
                        {c.estrellas ? (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold">{c.estrellas}</span>
                          </div>
                        ) : <span className="text-neutral-500 text-sm">N/A</span>}
                      </td>
                      <td className="p-4 text-neutral-300 max-w-xs truncate" title={c.comentario}>{c.comentario}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL DE DETALLES DEL VISITANTE */}
      <AnimatePresence>
        {isClienteModalOpen && selectedCliente && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setIsClienteModalOpen(false)} className="absolute top-6 right-6 text-neutral-500 hover:text-white bg-neutral-800 p-2 rounded-full"><X className="w-5 h-5" /></button>
              
              <div className="flex items-center mb-6 border-b border-neutral-800 pb-4">
                <UserCircle className="w-10 h-10 text-fuchsia-500 mr-3" />
                <h2 className="text-2xl font-bold uppercase tracking-widest text-white">Perfil del Visitante</h2>
              </div>
              
              <div className="space-y-4 text-lg">
                <div><p className="text-neutral-500 text-sm uppercase font-bold">Nombres</p><p className="font-medium text-white">{selectedCliente.nombres}</p></div>
                <div><p className="text-neutral-500 text-sm uppercase font-bold">Apellidos</p><p className="font-medium text-white">{selectedCliente.apellidos}</p></div>
                <div><p className="text-neutral-500 text-sm uppercase font-bold">Institución</p><p className="font-medium text-white">{selectedCliente.institucion || "No registrada"}</p></div>
                <div><p className="text-neutral-500 text-sm uppercase font-bold">Cargo</p><p className="font-medium text-white">{selectedCliente.cargo || "No registrado"}</p></div>
                <div><p className="text-neutral-500 text-sm uppercase font-bold">Teléfono</p><p className="font-medium text-white">{selectedCliente.telefono || "No registrado"}</p></div>
                <div><p className="text-neutral-500 text-sm uppercase font-bold">Correo Electrónico</p><p className="font-medium text-fuchsia-400 break-all">{selectedCliente.correo || "No registrado"}</p></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DEL QR */}
      <AnimatePresence>
        {qrModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white rounded-3xl p-8 relative max-w-2xl w-full flex flex-col items-center shadow-[0_0_100px_rgba(217,70,239,0.3)]">
              
              <div className="absolute top-6 right-6 flex space-x-2">
                <button onClick={imprimirQR} className="text-neutral-600 hover:text-purple-600 transition-colors bg-neutral-100 hover:bg-purple-100 rounded-full p-2 flex items-center space-x-2 px-4">
                  <Printer className="w-5 h-5" /> <span className="font-bold">Imprimir</span>
                </button>
                <button onClick={() => setQrModalOpen(false)} className="text-neutral-400 hover:text-neutral-900 transition-colors bg-neutral-100 rounded-full p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <h3 className="text-2xl font-bold text-neutral-900 mb-8 mt-4 uppercase tracking-widest text-center">Escanea para calificar</h3>
              
              <div className="bg-neutral-100 p-8 rounded-2xl w-full max-w-md flex justify-center items-center mb-8 border-4 border-fuchsia-500">
                 <div ref={largeQrRef} className="w-full h-auto flex justify-center items-center"></div>
              </div>
              <p className="text-neutral-500 font-medium text-center">Stand: <span className="text-fuchsia-600 font-bold">{user?.name}</span></p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}