"use client";

import { useEffect, useState, useRef } from "react";
import { getSession, signOut } from "next-auth/react";
import QRCodeStyling from "qr-code-styling";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Download, X, LogOut, Star, Printer, UserCircle, Sun, Moon, Globe } from "lucide-react";
import * as XLSX from "xlsx";
import { obtenerCalificacionesStand } from "@/actions/ratingActions";
import { obtenerStands } from "@/actions/standActions";

export default function StandDashboard() {
  const [user, setUser] = useState<any>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [calificaciones, setCalificaciones] = useState<any[]>([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [language, setLanguage] = useState<"en" | "es">("en");

  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  const smallQrRef = useRef<HTMLDivElement>(null);
  const largeQrRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("stand-theme") as "dark" | "light";
    if (savedTheme) setTheme(savedTheme);

    const savedLang = localStorage.getItem("stand-lang") as "en" | "es";
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      setLanguage("en");
      localStorage.setItem("stand-lang", "en");
    }

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
              colorStops: [{ offset: 0, color: "#c81474" }, { offset: 1, color: "#5b21b6" }]
            }
          },
          cornersSquareOptions: { type: "dot", color: "#c81474" },
          cornersDotOptions: { type: "dot", color: "#c81474" },
          backgroundOptions: { color: "#ffffff" },
          imageOptions: { crossOrigin: "anonymous", margin: 0, imageSize: 0.3, hideBackgroundDots: false }
        });
      }
      setLoading(false);
    };
    fetchSessionAndData();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("stand-theme", newTheme);
  };

  const toggleLanguage = () => {
    const newLang = language === "en" ? "es" : "en";
    setLanguage(newLang);
    localStorage.setItem("stand-lang", newLang);
  };

  const isDark = theme === "dark";
  const t = (es: string, en: string) => language === "en" ? en : es;

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
      [t("Fecha", "Date")]: new Date(c.createdAt).toLocaleDateString(language === "en" ? 'en-US' : 'es-ES'),
      [t("Nombres", "First Name")]: c.cliente.nombres,
      [t("Apellidos", "Last Name")]: c.cliente.apellidos,
      [t("Institución", "Institution")]: c.cliente.institucion,
      [t("Cargo", "Position")]: c.cliente.cargo,
      [t("Teléfono", "Phone")]: c.cliente.telefono || t("No registrado", "Not registered"),
      [t("Correo", "Email")]: c.cliente.correo,
      [t("Estrellas", "Stars")]: c.estrellas || "N/A",
      [t("Comentario", "Comment")]: c.comentario
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t("Calificaciones", "Ratings"));
    XLSX.writeFile(workbook, `Calificaciones_${user?.name}.xlsx`);
  };

  const imprimirQR = async () => {
    if (!qrCodeInstance.current) return;
    
    qrCodeInstance.current.update({ width: 1000, height: 1000 });
    const blob = await qrCodeInstance.current.getRawData("png");
    qrCodeInstance.current.update({ width: 300, height: 300 });
    
    if (!blob) return;

    const imgUrl = URL.createObjectURL(blob as Blob);
    const printWindow = window.open('', '', 'width=1000,height=1000');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${t("Imprimir QR", "Print QR")} - ${user?.name}</title>
            <style>
              @page { size: auto; margin: 0mm; } 
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; font-family: Arial, sans-serif; text-align: center; background: white; }
              .qr-container { padding: 30px; border: 6px solid #c81474; border-radius: 30px; margin: 30px 0; background: white; }
              img { width: 500px; height: 500px; object-fit: contain; }
              h1 { font-size: 50px; margin: 0; color: #000; font-weight: 900; text-transform: uppercase; }
              p { font-size: 26px; color: #333; margin: 0; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>${user?.name}</h1>
            <div class="qr-container"><img src="${imgUrl}" alt="QR Code" /></div>
            <p>${t("Escanea este código para calificar nuestro stand", "Scan this code to rate our stand")}</p>
            <script>window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 800); }</script>
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

  if (loading) return <div className={`min-h-screen flex justify-center items-center font-bold ${isDark ? "bg-neutral-950 text-[#c81474]" : "bg-gray-50 text-[#c81474]"}`}>{t("Cargando panel...", "Loading dashboard...")}</div>;

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-neutral-950 text-white" : "bg-gray-50 text-gray-900"}`}>
      {isDark && <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#c81474]/10 rounded-full blur-[120px] pointer-events-none" />}
      
      <header className={`px-8 py-4 flex justify-between items-center relative z-10 border-b ${isDark ? "bg-neutral-900/80 backdrop-blur-md border-[#c81474]/20" : "bg-white/90 backdrop-blur-md border-gray-200 shadow-sm"}`}>
        
        {/* LOGO + BIENVENIDA */}
        <div className="flex items-center space-x-4">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          <div>
            <p className={`text-sm tracking-widest uppercase font-bold ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{t("Bienvenido, Stand", "Welcome, Stand")}</p>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-[#c81474] to-pink-500 truncate">
              {user?.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button onClick={toggleLanguage} className={`p-2 rounded-full transition-colors ${isDark ? "bg-neutral-800/50 text-blue-400 hover:bg-neutral-700" : "bg-gray-100 text-blue-600 hover:bg-gray-200"}`} title={t("Cambiar Idioma", "Change Language")}>
            <Globe className="w-5 h-5" />
          </button>
          <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${isDark ? "bg-neutral-800/50 text-yellow-400 hover:bg-neutral-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`} title={t("Cambiar Tema", "Toggle Theme")}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-bold transition-colors ${isDark ? "text-red-400 hover:bg-red-500/10 hover:text-red-300" : "text-red-600 hover:bg-red-50"}`}>
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">{t("Cerrar Sesión", "Sign Out")}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          <div className={`md:col-span-2 relative border rounded-3xl p-8 flex flex-col justify-center items-start shadow-xl overflow-hidden ${isDark ? "bg-neutral-900/60 backdrop-blur-xl border-[#c81474]/30" : "bg-white border-gray-200"}`}>
            <div className="absolute top-[-20%] right-[-10%] opacity-10 pointer-events-none rotate-12">
              <Star className="w-64 h-64 text-[#c81474] fill-[#c81474]" />
            </div>
            <p className="text-[#c81474] font-bold uppercase tracking-widest text-sm mb-2 flex items-center">
              <Star className="w-4 h-4 mr-2 fill-[#c81474]" /> {t("Rendimiento Global", "Global Performance")}
            </p>
            <div className="flex items-baseline space-x-4 relative z-10">
              <h2 className={`text-7xl font-black text-transparent bg-clip-text drop-shadow-lg ${isDark ? "bg-linear-to-br from-white via-pink-100 to-[#c81474]" : "bg-linear-to-br from-gray-900 to-[#c81474]"}`}>
                {calificaciones.length}
              </h2>
              <span className={`text-lg font-medium leading-tight ${isDark ? "text-neutral-400" : "text-gray-500"}`} dangerouslySetInnerHTML={{ __html: t("calificaciones<br/>recibidas", "received<br/>ratings") }}></span>
            </div>
          </div>

          <button onClick={() => setQrModalOpen(true)} className="group relative bg-linear-to-br from-[#c81474] to-pink-700 rounded-3xl p-8 flex flex-col justify-center items-center hover:from-[#a61060] hover:to-pink-600 transition-all shadow-xl overflow-hidden">
            <div className="bg-white p-2 rounded-xl mb-4 relative z-10 overflow-hidden flex justify-center items-center min-w-20 min-h-20" ref={smallQrRef}>
            </div>
            <div className="flex items-center space-x-2 relative z-10">
              <Maximize2 className="w-5 h-5 text-white" />
              <span className="font-bold text-lg uppercase tracking-wider text-white">{t("Mostrar QR", "Show QR")}</span>
            </div>
          </button>
        </div>

        <div className={`border rounded-2xl overflow-hidden shadow-sm ${isDark ? "bg-neutral-900/50 backdrop-blur-md border-neutral-800" : "bg-white border-gray-200"}`}>
          <div className={`p-6 border-b flex justify-between items-center ${isDark ? "border-neutral-800 bg-neutral-900" : "border-gray-200 bg-gray-50"}`}>
            <h3 className="text-xl font-bold">{t("Feedback de Visitantes", "Visitor Feedback")}</h3>
            <button onClick={exportarAExcel} disabled={calificaciones.length === 0} className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 ${isDark ? "bg-neutral-800 hover:bg-neutral-700 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"}`}>
              <Download className="w-4 h-4" />
              <span className="text-sm">{t("Exportar Excel", "Export Excel")}</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${isDark ? "border-neutral-800 bg-neutral-950/50 text-neutral-400" : "border-gray-200 bg-white text-gray-500"}`}>
                  <th className="p-4 font-bold">{t("Visitante", "Visitor")}</th>
                  <th className="p-4 font-bold">{t("Institución", "Institution")}</th>
                  <th className="p-4 font-bold">{t("Calificación", "Rating")}</th>
                  <th className="p-4 font-bold">{t("Comentario", "Comment")}</th>
                </tr>
              </thead>
              <tbody>
                {calificaciones.length === 0 ? (
                  <tr><td colSpan={4} className={`p-12 text-center font-medium ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{t("Aún no tienes calificaciones. ¡Muestra tu código QR!", "You have no ratings yet. Show your QR code!")}</td></tr>
                ) : (
                  calificaciones.map((c: any) => (
                    <tr 
                      key={c.id} 
                      onClick={() => abrirDetallesCliente(c.cliente)}
                      className={`border-b transition-colors cursor-pointer group ${isDark ? "border-neutral-800/50 hover:bg-neutral-800/80" : "border-gray-100 hover:bg-gray-50"}`}
                    >
                      <td className="p-4">
                        <p className="font-bold group-hover:text-[#c81474] transition-colors">{c.cliente.nombres} {c.cliente.apellidos}</p>
                        <p className={`text-xs font-medium ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{c.cliente.cargo}</p>
                      </td>
                      <td className={`p-4 font-medium ${isDark ? "text-neutral-300" : "text-gray-700"}`}>{c.cliente.institucion}</td>
                      <td className="p-4">
                        {c.estrellas ? (
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full w-fit ${isDark ? "bg-yellow-500/10" : "bg-yellow-50 border border-yellow-200"}`}>
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold text-yellow-600">{c.estrellas}</span>
                          </div>
                        ) : <span className={`text-sm font-bold ${isDark ? "text-neutral-500" : "text-gray-400"}`}>N/A</span>}
                      </td>
                      <td className={`p-4 max-w-xs truncate ${isDark ? "text-neutral-300" : "text-gray-600"}`} title={c.comentario}>{c.comentario}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isClienteModalOpen && selectedCliente && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`border rounded-3xl p-8 max-w-lg w-full shadow-2xl relative ${isDark ? "bg-neutral-900 border-[#c81474]" : "bg-white border-[#c81474]"}`}>
              <button onClick={() => setIsClienteModalOpen(false)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${isDark ? "text-neutral-500 hover:text-white bg-neutral-800" : "text-gray-500 hover:text-gray-900 bg-gray-100"}`}><X className="w-5 h-5" /></button>
              
              <div className={`flex items-center mb-6 border-b pb-4 ${isDark ? "border-neutral-800" : "border-gray-200"}`}>
                <UserCircle className="w-10 h-10 text-[#c81474] mr-3" />
                <h2 className={`text-2xl font-bold uppercase tracking-widest ${isDark ? "text-white" : "text-gray-900"}`}>{t("Perfil del Visitante", "Visitor Profile")}</h2>
              </div>
              
              <div className="space-y-4 text-lg">
                <div><p className={`text-sm uppercase font-bold ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{t("Nombres", "First Name")}</p><p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{selectedCliente.nombres}</p></div>
                <div><p className={`text-sm uppercase font-bold ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{t("Apellidos", "Last Name")}</p><p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{selectedCliente.apellidos}</p></div>
                <div><p className={`text-sm uppercase font-bold ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{t("Institución", "Institution")}</p><p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{selectedCliente.institucion || t("No registrada", "Not registered")}</p></div>
                <div><p className={`text-sm uppercase font-bold ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{t("Cargo", "Position")}</p><p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{selectedCliente.cargo || t("No registrado", "Not registered")}</p></div>
                <div><p className={`text-sm uppercase font-bold ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{t("Teléfono", "Phone")}</p><p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{selectedCliente.telefono || t("No registrado", "Not registered")}</p></div>
                <div><p className={`text-sm uppercase font-bold ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{t("Correo Electrónico", "Email")}</p><p className="font-medium text-[#c81474] break-all">{selectedCliente.correo || t("No registrado", "Not registered")}</p></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {qrModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white rounded-3xl p-8 relative max-w-2xl w-full flex flex-col items-center shadow-[0_0_100px_rgba(200,20,116,0.3)]">
              
              <div className="absolute top-6 right-6 flex space-x-2">
                <button onClick={imprimirQR} className="text-neutral-600 hover:text-[#c81474] transition-colors bg-neutral-100 hover:bg-pink-100 rounded-full p-2 flex items-center space-x-2 px-4">
                  <Printer className="w-5 h-5" /> <span className="font-bold">{t("Imprimir", "Print")}</span>
                </button>
                <button onClick={() => setQrModalOpen(false)} className="text-neutral-400 hover:text-neutral-900 transition-colors bg-neutral-100 rounded-full p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <h3 className="text-2xl font-bold text-neutral-900 mb-8 mt-4 uppercase tracking-widest text-center">{t("Escanea para calificar", "Scan to rate")}</h3>
              
              <div className="bg-neutral-100 p-8 rounded-2xl w-full max-w-md flex justify-center items-center mb-8 border-4 border-[#c81474]">
                 <div ref={largeQrRef} className="w-full h-auto flex justify-center items-center"></div>
              </div>
              <p className="text-neutral-500 font-medium text-center">{t("Stand:", "Stand:")} <span className="text-[#c81474] font-bold">{user?.name}</span></p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}