"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Users, Store, Gift, Settings, LogOut, Upload, Star, Trophy, History, Play, Plus, X, Eye, MessageSquare, Edit, Trash2, Download, ExternalLink, Printer, Copy, ChevronRight, ChevronLeft, Maximize, AlertTriangle, Search, Sun, Moon, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import QRCodeStyling from "qr-code-styling";
import { cargarStandsMasivos, obtenerStands, crearStandManual, actualizarStand, eliminarStand } from "@/actions/standActions";
import { cargarClientesMasivos, obtenerClientes, actualizarCliente, eliminarCliente, eliminarTodosClientes } from "@/actions/clienteActions";
import { obtenerAjustes, guardarAjustes, obtenerParticipantesSorteo, registrarGanador, obtenerHistorialGanadores, eliminarGanadorHistorial } from "@/actions/lotteryActions";
import { obtenerDetallesStandMaster, obtenerDetallesClienteMaster } from "@/actions/masterActions";

export default function MasterDashboard() {
  const [activeTab, setActiveTab] = useState("stands");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  
  // ESTADO DEL MENÚ MÓVIL (En Desktop usa CSS Hover)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // ESTADOS DE TEMA E IDIOMA
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [language, setLanguage] = useState<"en" | "es">("en");

  const [standsList, setStandsList] = useState<any[]>([]);
  const [clientesList, setClientesList] = useState<any[]>([]);
  const [historialPremios, setHistorialPremios] = useState<any[]>([]);
  
  const [searchStand, setSearchStand] = useState("");
  const [searchCliente, setSearchCliente] = useState("");

  const [pageStands, setPageStands] = useState(1);
  const [limitStands, setLimitStands] = useState(20);
  const [pageClientes, setPageClientes] = useState(1);
  const [limitClientes, setLimitClientes] = useState(20);

  const [ajustes, setAjustes] = useState({ requiredStandsForLottery: 5, activarEstrellas: true });
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningName, setSpinningName] = useState("¿QUIÉN SERÁ EL SELECCIONADO?");
  const [winner, setWinner] = useState<any>(null);

  const [isModalStandOpen, setIsModalStandOpen] = useState(false);
  const [nombreNuevoStand, setNombreNuevoStand] = useState("");
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  
  const [isEditStandModalOpen, setIsEditStandModalOpen] = useState(false);
  const [editingStand, setEditingStand] = useState<any>(null);
  const [isEditClienteModalOpen, setIsEditClienteModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: "", onConfirm: () => {} });

  const [detallesAbiertos, setDetallesAbiertos] = useState(false);
  const [tipoDetalle, setTipoDetalle] = useState<"STAND" | "CLIENTE" | "GANADOR" | null>(null);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState<any>(null);
  const [historialDetallado, setHistorialDetallado] = useState<any[]>([]);

  const fileInputRefStands = useRef<HTMLInputElement>(null);
  const fileInputRefClientes = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("master-theme") as "dark" | "light";
    if (savedTheme) setTheme(savedTheme);

    const savedLang = localStorage.getItem("master-lang") as "en" | "es";
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      setLanguage("en");
      localStorage.setItem("master-lang", "en");
    }

    setMensaje("");
    if (activeTab === "stands") cargarListaStands();
    if (activeTab === "clientes") cargarListaClientes();
    if (activeTab === "sorteo" || activeTab === "historial") cargarDatosSorteo();
    if (activeTab === "ajustes") cargarAjustes();
  }, [activeTab]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("master-theme", newTheme);
  };

  const toggleLanguage = () => {
    const newLang = language === "en" ? "es" : "en";
    setLanguage(newLang);
    localStorage.setItem("master-lang", newLang);
  };

  const isDark = theme === "dark";
  const t = (es: string, en: string) => language === "en" ? en : es;

  const cargarListaStands = async () => setStandsList(await obtenerStands());
  const cargarListaClientes = async () => setClientesList(await obtenerClientes());
  const cargarAjustes = async () => setAjustes(await obtenerAjustes());
  
  const cargarDatosSorteo = async () => {
    const config = await obtenerAjustes();
    setAjustes(config);
    setParticipantes(await obtenerParticipantesSorteo(config.requiredStandsForLottery));
    setHistorialPremios(await obtenerHistorialGanadores());
    setWinner(null);
  };

  const guardarConfiguracion = async () => {
    setLoading(true);
    await guardarAjustes(ajustes.requiredStandsForLottery, ajustes.activarEstrellas);
    setMensaje(t("Configuración guardada.", "Settings saved."));
    setTimeout(() => setMensaje(""), 3000);
    setLoading(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEditLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditingStand({ ...editingStand, logo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleCrearStandManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevoStand.trim()) return;
    setLoading(true);
    const res = await crearStandManual(nombreNuevoStand, logoBase64 || undefined);
    setMensaje(res.message);
    setTimeout(() => setMensaje(""), 3000);
    if (res.success) {
      cargarListaStands();
      setIsModalStandOpen(false);
      setNombreNuevoStand("");
      setLogoBase64(null);
    }
    setLoading(false);
  };

  const handleEliminarStand = (id: string, nombre: string) => {
    setConfirmDialog({
      isOpen: true,
      message: t(`¿Estás seguro de que deseas eliminar el stand "${nombre}"? También se borrarán todas sus calificaciones.`, `Are you sure you want to delete the stand "${nombre}"? All of its ratings will also be deleted.`),
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setLoading(true);
        const res = await eliminarStand(id);
        setMensaje(res.message);
        setTimeout(() => setMensaje(""), 3000);
        if (res.success) cargarListaStands();
        setLoading(false);
      }
    });
  };

  const guardarEdicionStand = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await actualizarStand(editingStand.id, editingStand.nombreStand, editingStand.password, editingStand.logo);
    setMensaje(res.message);
    setTimeout(() => setMensaje(""), 3000);
    if (res.success) {
      cargarListaStands();
      setIsEditStandModalOpen(false);
    }
    setLoading(false);
  };

  const handleEliminarCliente = (id: string, nombre: string) => {
    setConfirmDialog({
      isOpen: true,
      message: t(`¿Estás seguro de eliminar al visitante "${nombre}"? Sus calificaciones y premios también se borrarán.`, `Are you sure you want to delete the visitor "${nombre}"? Their ratings and awards will also be deleted.`),
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setLoading(true);
        const res = await eliminarCliente(id);
        setMensaje(res.message);
        setTimeout(() => setMensaje(""), 3000);
        if (res.success) cargarListaClientes();
        setLoading(false);
      }
    });
  };

  const handleEliminarTodosClientes = () => {
    if (clientesList.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      message: t(`¡ATENCIÓN! Vas a eliminar a TODOS los visitantes registrados (${clientesList.length}) junto con sus calificaciones y premios. Esta acción es destructiva y NO se puede deshacer.`, `WARNING! You are about to delete ALL registered visitors (${clientesList.length}) along with their ratings and awards. This action is destructive and CANNOT be undone.`),
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setLoading(true);
        const res = await eliminarTodosClientes();
        setMensaje(res.message);
        setTimeout(() => setMensaje(""), 3000);
        if (res.success) cargarListaClientes();
        setLoading(false);
      }
    });
  };

  const handleEliminarGanador = (e: React.MouseEvent, id: string, nombre: string) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      message: t(`¿Estás seguro de borrar a "${nombre}" del historial de ganadores? Esto NO eliminará al visitante, solo su registro de premio.`, `Are you sure you want to delete "${nombre}" from the winner history? This will NOT delete the visitor, only their award record.`),
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setLoading(true);
        const res = await eliminarGanadorHistorial(id);
        setMensaje(res.message);
        setTimeout(() => setMensaje(""), 3000);
        if (res.success) setHistorialPremios(await obtenerHistorialGanadores());
        setLoading(false);
      }
    });
  };

  const guardarEdicionCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await actualizarCliente(editingCliente.id, editingCliente);
    setMensaje(res.message);
    setTimeout(() => setMensaje(""), 3000);
    if (res.success) {
      cargarListaClientes();
      setIsEditClienteModalOpen(false);
    }
    setLoading(false);
  };

  const copiarDatosLogin = (s: any) => {
    const texto = `${t("Usuario", "User")}: ${s.username}\n${t("Contraseña", "Password")}: ${s.password}\n${t("Link de acceso", "Login Link")}: ${window.location.origin}/login`;
    navigator.clipboard.writeText(texto);
    setMensaje(t(`Datos copiados al portapapeles.`, `Data copied to clipboard.`));
    setTimeout(() => setMensaje(""), 3000);
  };

  const imprimirQRDesdeMaster = async (s: any) => {
    const url = `${window.location.origin}/calificar/${s.id}`;
    const qrCode = new QRCodeStyling({
      width: 1000, height: 1000, data: url, image: s.logo || undefined,
      dotsOptions: { type: "dots", gradient: { type: "linear", rotation: Math.PI / 4, colorStops: [{ offset: 0, color: "#c81474" }, { offset: 1, color: "#5b21b6" }] } },
      cornersSquareOptions: { type: "dot", color: "#c81474" },
      cornersDotOptions: { type: "dot", color: "#c81474" },
      backgroundOptions: { color: "#ffffff" },
      imageOptions: { crossOrigin: "anonymous", margin: 0, imageSize: 0.3, hideBackgroundDots: false }
    });
    const blob = await qrCode.getRawData("png");
    if (!blob) return;
    const imgUrl = URL.createObjectURL(blob as Blob);
    const printWindow = window.open('', '', 'width=1000,height=1000');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${t("Imprimir QR", "Print QR")} - ${s.nombreStand}</title>
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
            <h1>${s.nombreStand}</h1>
            <div class="qr-container"><img src="${imgUrl}" alt="QR" /></div>
            <p>${t("Escanea este código para calificar nuestro stand", "Scan this code to rate our stand")}</p>
            <script>window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 800); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const abrirDetalles = async (entidad: any, tipo: "STAND" | "CLIENTE" | "GANADOR") => {
    setLoading(true);
    setTipoDetalle(tipo);
    setEntidadSeleccionada(entidad);
    
    if (tipo === "STAND") setHistorialDetallado(await obtenerDetallesStandMaster(entidad.id));
    else if (tipo === "CLIENTE") setHistorialDetallado(await obtenerDetallesClienteMaster(entidad.id));
    
    setDetallesAbiertos(true);
    setLoading(false);
  };

  const toggleFullscreen = () => {
    const elem = document.getElementById("sorteo-container");
    if (!document.fullscreenElement) {
      elem?.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen();
    }
  };

  const iniciarSorteo = () => {
    if (participantes.length === 0) return;
    setIsSpinning(true);
    setWinner(null);
    let counter = 0;
    const duration = 10000; 
    const intervalTime = 100; 
    const totalTicks = duration / intervalTime;

    const interval = setInterval(() => {
      const randomUser = participantes[Math.floor(Math.random() * participantes.length)];
      setSpinningName(`${randomUser.nombres} ${randomUser.apellidos}`.toUpperCase());
      counter++;

      if (counter >= totalTicks) {
        clearInterval(interval);
        const ganadorFinal = participantes[Math.floor(Math.random() * participantes.length)];
        setWinner(ganadorFinal);
        setIsSpinning(false);
        setSpinningName("");
        registrarGanador(ganadorFinal.id, `Reconocimiento entregado. Requisito: ${ajustes.requiredStandsForLottery} stands.`);
      }
    }, intervalTime);
  };

  const handleFileUploadStands = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const sheet = XLSX.read(event.target?.result, { type: "binary" }).Sheets[XLSX.read(event.target?.result, { type: "binary" }).SheetNames[0]];
        const parsedData = XLSX.utils.sheet_to_json(sheet);
        const safeData = JSON.parse(JSON.stringify(parsedData)); 
        const standsArray = safeData.map((row: any) => ({ nombre: String(Object.values(row)[0]) }));
        const res = await cargarStandsMasivos(standsArray);
        setMensaje(res.message);
        setTimeout(() => setMensaje(""), 3000);
        if (res.success) cargarListaStands();
      } catch (error) { setMensaje(t("Error procesando Excel.", "Error processing Excel.")); }
      finally { setLoading(false); if (fileInputRefStands.current) fileInputRefStands.current.value = ""; }
    };
    reader.readAsBinaryString(file);
  };

  const handleFileUploadClientes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const sheet = XLSX.read(event.target?.result, { type: "binary" }).Sheets[XLSX.read(event.target?.result, { type: "binary" }).SheetNames[0]];
        const parsedData = XLSX.utils.sheet_to_json(sheet);
        const safeData = JSON.parse(JSON.stringify(parsedData)); 
        const res = await cargarClientesMasivos(safeData);
        setMensaje(res.message);
        setTimeout(() => setMensaje(""), 3000);
        if (res.success) cargarListaClientes();
      } catch (error) { setMensaje(t("Error procesando Excel.", "Error processing Excel.")); }
      finally { setLoading(false); if (fileInputRefClientes.current) fileInputRefClientes.current.value = ""; }
    };
    reader.readAsBinaryString(file);
  };

  const exportarStandsExcel = () => {
    const data = standsList.map((s: any) => ({ [t("Nombre del Stand", "Stand Name")]: s.nombreStand, [t("Usuario", "User")]: s.username, [t("Contraseña", "Password")]: s.password }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("Stands", "Stands"));
    XLSX.writeFile(wb, "Reporte_Stands.xlsx");
  };

  const exportarClientesExcel = () => {
    const data = clientesList.map((c: any) => ({ 
      [t("Nombres", "First Name")]: c.nombres, [t("Apellidos", "Last Name")]: c.apellidos, [t("Documento", "Document")]: c.username, 
      [t("Institución", "Institution")]: c.institucion, [t("Cargo", "Position")]: c.cargo, [t("Teléfono", "Phone")]: c.telefono, [t("Correo", "Email")]: c.correo,
      [t("Stands Calificados", "Rated Stands")]: c._count.calificacionesDadas
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("Visitantes", "Visitors"));
    XLSX.writeFile(wb, "Reporte_Visitantes.xlsx");
  };

  const filteredStands = standsList.filter(s => 
    s.nombreStand?.toLowerCase().includes(searchStand.toLowerCase()) || 
    s.username?.toLowerCase().includes(searchStand.toLowerCase())
  );
  const paginatedStands = filteredStands.slice((pageStands - 1) * limitStands, pageStands * limitStands);
  const totalPagesStands = Math.ceil(filteredStands.length / limitStands);
  
  const filteredClientes = clientesList.filter(c => 
    c.nombres?.toLowerCase().includes(searchCliente.toLowerCase()) || 
    c.apellidos?.toLowerCase().includes(searchCliente.toLowerCase()) || 
    c.username?.toLowerCase().includes(searchCliente.toLowerCase()) || 
    c.institucion?.toLowerCase().includes(searchCliente.toLowerCase())
  );
  const paginatedClientes = filteredClientes.slice((pageClientes - 1) * limitClientes, pageClientes * limitClientes);
  const totalPagesClientes = Math.ceil(filteredClientes.length / limitClientes);

  const tabs = [
    { id: "stands", label: t("Stands", "Stands"), icon: Store },
    { id: "clientes", label: t("Visitantes", "Visitors"), icon: Users },
    { id: "sorteo", label: t("Sorteo Dinámico", "Dynamic Draw"), icon: Gift },
    { id: "historial", label: t("Historial Sorteos", "Draw History"), icon: History },
    { id: "ajustes", label: t("Configuración", "Settings"), icon: Settings },
  ];

  return (
    <div className={`h-screen flex overflow-hidden transition-colors duration-300 ${isDark ? "bg-neutral-950 text-white" : "bg-gray-50 text-gray-900"}`}>
      
      {/* ==================================================== */}
      {/* MENÚ LATERAL (AUTOCOLLAPSABLE EN DESKTOP / ARROW EN MÓVIL) */}
      {/* ==================================================== */}
      <aside 
        className={`fixed md:relative z-50 h-full flex flex-col border-r shadow-2xl transition-all duration-300 ease-in-out group 
        ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"} 
        ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-20 md:hover:w-64"}`}
      >
        {/* Flechita para abrir/cerrar en Móvil */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`md:hidden absolute top-6 -right-12 w-12 h-14 flex items-center justify-center rounded-r-xl shadow-lg border-y border-r transition-colors z-50 ${isDark ? "bg-neutral-900 border-neutral-800 text-[#c81474]" : "bg-white border-gray-200 text-[#c81474]"}`}
        >
          {sidebarOpen ? <ChevronLeft className="w-6 h-6"/> : <ChevronRight className="w-6 h-6"/>}
        </button>

        {/* LOGO EN VEZ DE TEXTO */}
        <div className="h-24 flex items-center justify-center shrink-0 border-b border-transparent overflow-hidden px-4">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className={`object-contain transition-all duration-300 ${sidebarOpen ? "w-20 h-20" : "md:w-10 md:h-10 md:group-hover:w-20 md:group-hover:h-20"}`} 
          />
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: "none" }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }} 
                className={`relative w-full flex items-center p-3 rounded-xl transition-all overflow-hidden font-bold
                ${isActive ? "bg-[#c81474] text-white shadow-lg" : (isDark ? "hover:bg-neutral-800 text-neutral-400 hover:text-white" : "hover:bg-gray-100 text-gray-600 hover:text-[#c81474]")}`}
              >
                <div className="w-10 flex justify-center shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`whitespace-nowrap transition-all duration-300 ${sidebarOpen ? "opacity-100 ml-2" : "md:opacity-0 md:group-hover:opacity-100 md:ml-2"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* BOTÓN SALIR */}
        <div className="p-3 shrink-0 mb-4">
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })} 
            className={`relative w-full flex items-center p-3 rounded-xl transition-colors font-bold overflow-hidden
            ${isDark ? "hover:bg-red-500/10 text-red-500" : "hover:bg-red-50 text-red-600"}`}
          >
            <div className="w-10 flex justify-center shrink-0">
              <LogOut className="w-6 h-6" />
            </div>
            <span className={`whitespace-nowrap transition-all duration-300 ${sidebarOpen ? "opacity-100 ml-2" : "md:opacity-0 md:group-hover:opacity-100 md:ml-2"}`}>
              {t("Cerrar Sesión", "Sign Out")}
            </span>
          </button>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* CONTENIDO PRINCIPAL Y MARCA DE AGUA */}
      {/* ==================================================== */}
      <main className="flex-1 h-full overflow-y-auto relative flex flex-col p-6 md:p-10">
        
        {/* LOGO DE FONDO (MARCA DE AGUA GLOBAL) */}
        <div className={`absolute inset-0 z-0 flex justify-center items-center pointer-events-none ${isDark ? "opacity-10" : "opacity-[0.03]"}`}>
          <img src="/logo.png" alt="WEEF Background" className="w-[80%] h-[80%] object-contain" />
        </div>

        {/* CABECERA TOP-RIGHT (Botones globales) */}
        <div className="flex justify-between items-start mb-8 relative z-10 w-full min-h-12">
          {/* Mensajes de Alerta a la izquierda */}
          <div className="flex-1 max-w-md">
            <AnimatePresence>
              {mensaje && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`p-3 rounded-xl font-bold text-center shadow-lg ${isDark ? "bg-neutral-900 border border-[#c81474] text-[#c81474]" : "bg-green-50 border border-green-200 text-green-700"}`}>
                  {mensaje}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Botones Tema/Idioma a la derecha */}
          <div className="flex items-center space-x-3 shrink-0 ml-4">
            <button onClick={toggleLanguage} className={`p-2.5 rounded-full transition-colors shadow-sm border ${isDark ? "bg-neutral-900 border-[#c81474]/50 text-[#c81474] hover:bg-neutral-800" : "bg-white border-[#c81474]/30 text-[#c81474] hover:bg-gray-100"}`} title={t("Cambiar Idioma", "Change Language")}>
              <Globe className="w-5 h-5" />
            </button>
            <button onClick={toggleTheme} className={`p-2.5 rounded-full transition-colors shadow-sm border ${isDark ? "bg-neutral-900 border-[#c81474]/50 text-yellow-400 hover:bg-neutral-800" : "bg-white border-[#c81474]/30 text-yellow-500 hover:bg-gray-100"}`} title={t("Cambiar Tema", "Toggle Theme")}>
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="relative z-10 flex-1">
          {/* STANDS */}
          {activeTab === "stands" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                  <h1 className="text-4xl font-black uppercase">{t("Gestión de Stands", "Stand Management")}</h1>
                  <p className={`font-bold mt-1 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{t("Total registrados:", "Total registered:")} {standsList.length}</p>
                </div>
                <div className="flex space-x-3 flex-wrap gap-y-2">
                  <button onClick={() => setIsModalStandOpen(true)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all border ${isDark ? "bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
                    <Plus className="w-5 h-5" /><span>{t("Manual", "Manual")}</span>
                  </button>
                  <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRefStands} onChange={handleFileUploadStands} />
                  <button onClick={() => fileInputRefStands.current?.click()} disabled={loading} className="flex items-center space-x-2 bg-[#c81474] hover:bg-[#a61060] text-white px-4 py-2 rounded-xl font-bold transition-all shadow-md">
                    <Upload className="w-5 h-5" /><span>{t("Excel", "Excel")}</span>
                  </button>
                </div>
              </div>

              <div className="relative w-full md:w-96 mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className={`h-5 w-5 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
                </div>
                <input
                  type="text"
                  placeholder={t("Buscar stand por nombre o usuario...", "Search stand by name or user...")}
                  value={searchStand}
                  onChange={(e) => { setSearchStand(e.target.value); setPageStands(1); }}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-[#c81474] transition-colors shadow-inner ${isDark ? "bg-neutral-900 border border-neutral-700 text-white" : "bg-white/80 backdrop-blur-md border border-gray-300 text-gray-900"}`}
                />
              </div>

              <div className={`flex justify-between items-center mb-4 text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
                <div className="flex items-center space-x-2">
                  <span>{t("Mostrar:", "Show:")}</span>
                  <select value={limitStands} onChange={(e) => {setLimitStands(Number(e.target.value)); setPageStands(1);}} className={`rounded-lg p-1 outline-none border ${isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-700"}`}>
                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
                  </select>
                </div>
                <button onClick={exportarStandsExcel} className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all border ${isDark ? "bg-green-600/20 text-green-500 border-green-500/50 hover:bg-green-600/30" : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"}`}>
                  <Download className="w-4 h-4" /><span>{t("Exportar", "Export")}</span>
                </button>
              </div>

              <div className={`border rounded-2xl overflow-hidden shadow-xl ${isDark ? "bg-neutral-900/80 backdrop-blur-md border-neutral-800" : "bg-white/90 backdrop-blur-md border-gray-200"}`}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b ${isDark ? "bg-black/50 border-neutral-800 text-neutral-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                      <th className="p-4 font-bold">{t("Stand", "Stand")}</th>
                      <th className="p-4 font-bold">{t("Usuario", "User")}</th>
                      <th className="p-4 font-bold">{t("Contraseña", "Password")}</th>
                      <th className="p-4 font-bold text-right">{t("Acciones", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStands.length === 0 ? (
                      <tr><td colSpan={4} className={`p-8 text-center ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{t("No se encontraron stands con esos datos.", "No stands found with that data.")}</td></tr>
                    ) : (
                      paginatedStands.map((s: any) => (
                        <tr key={s.id} className={`border-b transition-colors ${isDark ? "border-neutral-800/50 hover:bg-neutral-800/50" : "border-gray-100 hover:bg-gray-50"}`}>
                          <td className="p-4 font-medium flex items-center space-x-3">
                            {s.logo ? <img src={s.logo} alt="logo" className={`w-8 h-8 rounded-full object-cover border ${isDark ? "border-neutral-700" : "border-gray-300"}`} /> : <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border ${isDark ? "bg-neutral-800 border-neutral-700 text-neutral-500" : "bg-gray-100 border-gray-300 text-gray-500"}`}>S</div>}
                            <span>{s.nombreStand}</span>
                          </td>
                          <td className={`p-4 font-mono font-bold ${isDark ? "text-[#c81474]" : "text-[#c81474]"}`}>{s.username}</td>
                          <td className={`p-4 font-mono ${isDark ? "text-purple-400" : "text-purple-600"}`}>{s.password}</td>
                          <td className="p-4">
                            <div className="flex justify-end space-x-2">
                              <button onClick={() => copiarDatosLogin(s)} className={`p-2 rounded-lg transition-colors ${isDark ? "text-neutral-400 bg-neutral-800 hover:text-white" : "text-gray-500 bg-gray-100 hover:text-gray-900"}`} title={t("Copiar Datos Login", "Copy Login Data")}><Copy className="w-4 h-4" /></button>
                              <a href={`/calificar/${s.id}`} target="_blank" rel="noopener noreferrer" className={`p-2 rounded-lg transition-colors flex items-center justify-center ${isDark ? "text-neutral-400 bg-neutral-800 hover:text-green-400" : "text-gray-500 bg-gray-100 hover:text-green-600"}`} title={t("Link Calificar", "Rating Link")}><ExternalLink className="w-4 h-4" /></a>
                              <button onClick={() => imprimirQRDesdeMaster(s)} className={`p-2 rounded-lg transition-colors ${isDark ? "text-neutral-400 bg-neutral-800 hover:text-[#c81474]" : "text-gray-500 bg-gray-100 hover:text-[#c81474]"}`} title={t("Imprimir QR", "Print QR")}><Printer className="w-4 h-4" /></button>
                              <button onClick={() => abrirDetalles(s, "STAND")} className={`p-2 rounded-lg transition-colors ${isDark ? "text-neutral-400 bg-neutral-800 hover:text-[#c81474]" : "text-gray-500 bg-gray-100 hover:text-[#c81474]"}`} title={t("Ver Comentarios", "View Comments")}><Eye className="w-4 h-4" /></button>
                              <button onClick={() => { setEditingStand(s); setIsEditStandModalOpen(true); }} className={`p-2 rounded-lg transition-colors ${isDark ? "text-neutral-400 bg-neutral-800 hover:text-blue-400" : "text-gray-500 bg-gray-100 hover:text-blue-600"}`} title={t("Editar", "Edit")}><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleEliminarStand(s.id, s.nombreStand)} className={`p-2 rounded-lg transition-colors ${isDark ? "text-neutral-400 bg-neutral-800 hover:text-red-400" : "text-gray-500 bg-gray-100 hover:text-red-600"}`} title={t("Eliminar", "Delete")}><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-4 pb-10">
                <button disabled={pageStands === 1} onClick={() => setPageStands(pageStands - 1)} className={`px-4 py-2 border rounded-lg text-sm font-bold disabled:opacity-50 transition-colors ${isDark ? "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}>{t("Anterior", "Previous")}</button>
                <span className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{t("Página", "Page")} {pageStands} {t("de", "of")} {totalPagesStands || 1}</span>
                <button disabled={pageStands === totalPagesStands || totalPagesStands === 0} onClick={() => setPageStands(pageStands + 1)} className={`px-4 py-2 border rounded-lg text-sm font-bold disabled:opacity-50 transition-colors ${isDark ? "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}>{t("Siguiente", "Next")}</button>
              </div>
            </motion.div>
          )}

          {/* CLIENTES */}
          {activeTab === "clientes" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                  <h1 className="text-4xl font-black uppercase">{t("Gestión de Visitantes", "Visitor Management")}</h1>
                  <p className={`font-bold mt-1 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{t("Total registrados:", "Total registered:")} {clientesList.length}</p>
                </div>
                <div className="flex space-x-3 flex-wrap gap-y-2">
                  <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRefClientes} onChange={handleFileUploadClientes} />
                  <button onClick={() => fileInputRefClientes.current?.click()} disabled={loading} className="flex items-center space-x-2 bg-[#c81474] hover:bg-[#a61060] text-white px-4 py-2 rounded-xl font-bold transition-all shadow-md">
                    <Upload className="w-5 h-5" /><span>{t("Excel Visitantes", "Visitor Excel")}</span>
                  </button>
                  <button onClick={handleEliminarTodosClientes} disabled={loading || clientesList.length === 0} className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all border disabled:opacity-50 ${isDark ? "bg-red-600/20 text-red-500 border-red-500/50 hover:bg-red-600/30" : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"}`}>
                    <Trash2 className="w-5 h-5" /><span>{t("Eliminar Todos", "Delete All")}</span>
                  </button>
                </div>
              </div>

              <div className="relative w-full md:w-lg mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className={`h-5 w-5 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
                </div>
                <input
                  type="text"
                  placeholder={t("Buscar visitante por nombre, documento o institución...", "Search visitor by name, document or institution...")}
                  value={searchCliente}
                  onChange={(e) => { setSearchCliente(e.target.value); setPageClientes(1); }}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-[#c81474] transition-colors shadow-inner ${isDark ? "bg-neutral-900 border border-neutral-700 text-white" : "bg-white/80 backdrop-blur-md border border-gray-300 text-gray-900"}`}
                />
              </div>

              <div className={`flex justify-between items-center mb-4 text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
                <div className="flex items-center space-x-2">
                  <span>{t("Mostrar:", "Show:")}</span>
                  <select value={limitClientes} onChange={(e) => {setLimitClientes(Number(e.target.value)); setPageClientes(1);}} className={`rounded-lg p-1 outline-none border ${isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-700"}`}>
                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
                  </select>
                </div>
                <button onClick={exportarClientesExcel} className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all border ${isDark ? "bg-green-600/20 text-green-500 border-green-500/50 hover:bg-green-600/30" : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"}`}>
                  <Download className="w-4 h-4" /><span>{t("Exportar", "Export")}</span>
                </button>
              </div>

              <div className={`border rounded-2xl overflow-hidden shadow-xl ${isDark ? "bg-neutral-900/80 backdrop-blur-md border-neutral-800" : "bg-white/90 backdrop-blur-md border-gray-200"}`}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b ${isDark ? "bg-black/50 border-neutral-800 text-neutral-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                      <th className="p-4 font-bold">{t("Nombre Completo", "Full Name")}</th>
                      <th className="p-4 font-bold">{t("Documento", "Document")}</th>
                      <th className="p-4 font-bold">{t("Institución", "Institution")}</th>
                      <th className="p-4 font-bold">{t("Calif.", "Ratings")}</th>
                      <th className="p-4 font-bold text-right">{t("Acciones", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClientes.length === 0 ? (
                      <tr><td colSpan={5} className={`p-8 text-center ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{t("No se encontraron visitantes con esos datos.", "No visitors found with that data.")}</td></tr>
                    ) : (
                      paginatedClientes.map((c: any) => (
                        <tr key={c.id} className={`border-b transition-colors ${isDark ? "border-neutral-800/50 hover:bg-neutral-800/50" : "border-gray-100 hover:bg-gray-50"}`}>
                          <td className="p-4 font-bold">{c.nombres} {c.apellidos}</td>
                          <td className={`p-4 font-mono font-bold ${isDark ? "text-[#c81474]" : "text-[#c81474]"}`}>{c.username}</td>
                          <td className={`p-4 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{c.institucion}</td>
                          <td className="p-4">
                            <span className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-600 font-black px-3 py-1 rounded-full flex items-center w-fit space-x-1">
                              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /><span>{c._count.calificacionesDadas}</span>
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end space-x-2">
                              <button onClick={() => abrirDetalles(c, "CLIENTE")} className={`p-2 rounded-lg transition-colors ${isDark ? "text-neutral-400 bg-neutral-800 hover:text-[#c81474]" : "text-gray-500 bg-gray-100 hover:text-[#c81474]"}`} title={t("Ver Auditoría", "View Audit")}><Eye className="w-4 h-4" /></button>
                              <button onClick={() => { setEditingCliente(c); setIsEditClienteModalOpen(true); }} className={`p-2 rounded-lg transition-colors ${isDark ? "text-neutral-400 bg-neutral-800 hover:text-blue-400" : "text-gray-500 bg-gray-100 hover:text-blue-600"}`} title={t("Editar", "Edit")}><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleEliminarCliente(c.id, `${c.nombres} ${c.apellidos}`)} className={`p-2 rounded-lg transition-colors ${isDark ? "text-neutral-400 bg-neutral-800 hover:text-red-400" : "text-gray-500 bg-gray-100 hover:text-red-600"}`} title={t("Eliminar", "Delete")}><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-4 pb-10">
                <button disabled={pageClientes === 1} onClick={() => setPageClientes(pageClientes - 1)} className={`px-4 py-2 border rounded-lg text-sm font-bold disabled:opacity-50 transition-colors ${isDark ? "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}>{t("Anterior", "Previous")}</button>
                <span className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{t("Página", "Page")} {pageClientes} {t("de", "of")} {totalPagesClientes || 1}</span>
                <button disabled={pageClientes === totalPagesClientes || totalPagesClientes === 0} onClick={() => setPageClientes(pageClientes + 1)} className={`px-4 py-2 border rounded-lg text-sm font-bold disabled:opacity-50 transition-colors ${isDark ? "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}>{t("Siguiente", "Next")}</button>
              </div>
            </motion.div>
          )}

          {/* SORTEO */}
          {activeTab === "sorteo" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-[70vh]">
              <div className="text-center mb-6">
                <h1 className={`text-5xl font-black text-transparent bg-clip-text uppercase tracking-widest drop-shadow-sm ${isDark ? "bg-linear-to-r from-yellow-400 to-[#c81474]" : "bg-linear-to-r from-[#c81474] to-pink-500"}`}>
                  {t("Sorteo de Reconocimientos", "Awards Draw")}
                </h1>
                <p className={`mt-4 text-lg ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
                  {t("Participantes:", "Participants:")} <span className={`font-black text-2xl ml-2 ${isDark ? "text-white" : "text-gray-900"}`}>{participantes.length}</span>
                </p>
                <p className={`text-sm ${isDark ? "text-[#c81474]/70" : "text-gray-500"}`}>{t("(Requisito actual: Haber calificado", "(Current requirement: Rated")} {ajustes.requiredStandsForLottery} {t("stands o más)", "stands or more)")}</p>
              </div>

              <button onClick={toggleFullscreen} className={`mb-6 flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-bold ${isDark ? "text-neutral-400 hover:text-white bg-neutral-800" : "text-gray-600 hover:text-gray-900 bg-white border border-gray-300"}`}>
                <Maximize className="w-5 h-5" /> <span>{t("Proyectar en Pantalla Completa", "Project Full Screen")}</span>
              </button>

              <div id="sorteo-container" className={`relative w-full max-w-4xl min-h-112.5 py-12 px-6 border-2 shadow-2xl flex flex-col justify-center items-center overflow-hidden mb-12 rounded-[3rem] [&:fullscreen]:rounded-none [&:fullscreen]:border-none [&:fullscreen]:max-w-none [&:fullscreen]:w-screen [&:fullscreen]:h-screen [&:fullscreen]:flex [&:fullscreen]:items-center [&:fullscreen]:justify-center ${isDark ? "bg-neutral-950/90 backdrop-blur-3xl border-neutral-800 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] [&:fullscreen]:bg-neutral-950" : "bg-white/90 backdrop-blur-3xl border-gray-100 [&:fullscreen]:bg-white"}`}>
                <div className={`absolute inset-0 bg-[conic-gradient(from_90deg,transparent,rgba(200,20,116,0.2),transparent)] ${isSpinning ? 'animate-spin' : ''} duration-3000 pointer-events-none`} />

                {!isSpinning && !winner && (
                  <button onClick={iniciarSorteo} disabled={participantes.length === 0} className="relative group disabled:opacity-50 disabled:cursor-not-allowed z-10">
                    <div className={`absolute inset-0 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300 animate-pulse ${isDark ? "bg-linear-to-r from-yellow-400 via-[#c81474] to-purple-600 opacity-70 group-hover:opacity-100" : "bg-linear-to-r from-pink-400 via-[#c81474] to-purple-500 opacity-50 group-hover:opacity-80"}`} />
                    <div className={`relative border-4 border-[#c81474] rounded-full w-52 h-52 p-4 flex flex-col items-center justify-center transform group-hover:scale-110 transition-transform shadow-xl ${isDark ? "bg-linear-to-br from-neutral-900 to-black" : "bg-white"}`}>
                      <Play className="w-12 h-12 text-[#c81474] ml-2 mb-2 shrink-0" />
                      <span className={`font-black text-lg uppercase tracking-wider text-center leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>{t("Iniciar", "Start")}<br/>{t("Selección", "Selection")}</span>
                    </div>
                  </button>
                )}

                {isSpinning && (
                  <motion.div key={spinningName} initial={{ opacity: 0, scale: 0.5, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.5, y: -50 }} transition={{ duration: 0.1 }} className={`text-5xl md:text-8xl font-black uppercase tracking-tighter text-center px-4 w-full z-10 ${isDark ? "text-transparent bg-clip-text bg-linear-to-b from-white to-neutral-500" : "text-gray-900"}`}>
                    {spinningName}
                  </motion.div>
                )}

                {winner && (
                  <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 15 }} className="text-center z-10 w-full px-4 flex flex-col items-center">
                    <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 drop-shadow-md" />
                    <h2 className={`text-4xl md:text-7xl font-black uppercase tracking-tighter mb-2 leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                      {winner.nombres} {winner.apellidos}
                    </h2>
                    <p className={`text-2xl md:text-4xl font-mono tracking-widest mb-4 ${isDark ? "text-purple-400" : "text-gray-600"}`}>
                      CC: {winner.username}
                    </p>
                    <p className="text-xl md:text-3xl text-[#c81474] font-bold uppercase tracking-widest">
                      {winner.institucion || t("Sin Institución", "No Institution")}
                    </p>
                    <button onClick={() => {setWinner(null); cargarDatosSorteo();}} className="mt-10 bg-[#c81474] text-white px-8 py-3 rounded-full font-bold hover:bg-[#a61060] transition-all shadow-lg">
                      {t("Realizar otra selección", "Draw another selection")}
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* HISTORIAL */}
          {activeTab === "historial" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-black uppercase">{t("Historial de Sorteos", "Draw History")}</h1>
                <p className={`font-bold mt-1 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{t("Total Entregados:", "Total Awarded:")} {historialPremios.length}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                {historialPremios.length === 0 ? (
                  <p className={`col-span-full text-center py-10 ${isDark ? "text-neutral-500" : "text-gray-400"}`}>{t("Aún no hay sorteos registrados.", "No draws registered yet.")}</p>
                ) : (
                  historialPremios.map((premio: any) => (
                    <div key={premio.id} onClick={() => abrirDetalles(premio.cliente, "GANADOR")} className={`border p-6 rounded-3xl cursor-pointer transition-all hover:border-[#c81474] hover:shadow-xl group relative overflow-hidden ${isDark ? "bg-neutral-900/80 backdrop-blur-md border-neutral-800" : "bg-white/90 backdrop-blur-md border-gray-200"}`}>
                      
                      <button 
                        onClick={(e) => handleEliminarGanador(e, premio.id, `${premio.cliente.nombres} ${premio.cliente.apellidos}`)}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100 z-10 ${isDark ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" : "bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex justify-between items-start mb-4 pr-8">
                        <Trophy className="w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform" />
                        <div className="text-right">
                          <p className={`text-sm font-bold ${isDark ? "text-neutral-300" : "text-gray-700"}`}>{new Date(premio.createdAt).toLocaleDateString(language === "en" ? 'en-US' : 'es-ES')}</p>
                          <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{new Date(premio.createdAt).toLocaleTimeString(language === "en" ? 'en-US' : 'es-ES')}</p>
                        </div>
                      </div>
                      <h3 className={`text-xl font-black uppercase leading-tight mb-2 truncate ${isDark ? "text-white" : "text-gray-900"}`} title={`${premio.cliente.nombres} ${premio.cliente.apellidos}`}>
                        {premio.cliente.nombres} {premio.cliente.apellidos}
                      </h3>
                      <p className="text-[#c81474] font-mono font-bold text-sm mb-2">ID: {premio.cliente.username}</p>
                      <p className={`text-sm truncate ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{premio.cliente.institucion}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* AJUSTES */}
          {activeTab === "ajustes" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mt-4">
              <div className={`border p-10 rounded-3xl shadow-xl ${isDark ? "bg-neutral-900/80 backdrop-blur-xl border-neutral-800" : "bg-white/90 backdrop-blur-md border-gray-200"}`}>
                <h1 className={`text-3xl font-black uppercase mb-8 flex items-center border-b pb-4 ${isDark ? "border-neutral-800" : "border-gray-200"}`}>
                  <Settings className="w-8 h-8 mr-4 text-[#c81474]" /> {t("Configuración Global", "Global Settings")}
                </h1>
                
                <div className="space-y-8">
                  <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? "bg-black/30 border-neutral-800" : "bg-gray-50 border-gray-200"}`}>
                    <div>
                      <h3 className="font-bold text-lg">{t("Calificación por Estrellas", "Star Rating")}</h3>
                      <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{t("Permitir a los visitantes dar 1 a 5 estrellas.", "Allow visitors to give 1 to 5 stars.")}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" className="sr-only peer" checked={ajustes.activarEstrellas} onChange={(e) => setAjustes({...ajustes, activarEstrellas: e.target.checked})} />
                      <div className={`w-14 h-7 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#c81474] ${isDark ? "bg-neutral-700" : "bg-gray-300"}`}></div>
                    </label>
                  </div>
                  
                  <div className={`p-4 rounded-2xl border ${isDark ? "bg-black/30 border-neutral-800" : "bg-gray-50 border-gray-200"}`}>
                    <h3 className="font-bold text-lg mb-2">{t("Requisito para Participación", "Participation Requirement")}</h3>
                    <p className={`text-sm mb-4 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{t("¿Cuántos stands debe calificar un visitante para entrar al sorteo?", "How many stands must a visitor rate to enter the draw?")}</p>
                    <input type="number" min="1" value={ajustes.requiredStandsForLottery} onChange={(e) => setAjustes({...ajustes, requiredStandsForLottery: Number(e.target.value)})} className={`w-full rounded-xl p-4 text-2xl font-bold text-center focus:outline-none focus:border-[#c81474] transition-colors shadow-inner border ${isDark ? "bg-neutral-950/80 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
                  </div>
                  
                  <button onClick={guardarConfiguracion} disabled={loading} className="w-full py-4 bg-[#c81474] hover:bg-[#a61060] text-white font-black text-lg uppercase tracking-widest rounded-xl transition-all shadow-lg disabled:opacity-50">
                    {loading ? t("Guardando...", "Saving...") : t("Guardar Cambios", "Save Changes")}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* ==================================================== */}
      {/* MODALES GLOBALES */}
      {/* ==================================================== */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`border rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"}`} onClick={(e) => e.stopPropagation()}>
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-3">{t("¿Estás seguro?", "Are you sure?")}</h3>
              <p className={`mb-8 ${isDark ? "text-neutral-400" : "text-gray-600"}`}>{confirmDialog.message}</p>
              <div className="flex space-x-4">
                <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${isDark ? "bg-neutral-800 hover:bg-neutral-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-900"}`}>{t("Cancelar", "Cancel")}</button>
                <button onClick={confirmDialog.onConfirm} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all">{t("Confirmar", "Confirm")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalStandOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => { setIsModalStandOpen(false); setLogoBase64(null); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`border rounded-3xl p-8 max-w-md w-full shadow-2xl relative ${isDark ? "bg-neutral-900 border-[#c81474]" : "bg-white border-[#c81474]"}`} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setIsModalStandOpen(false); setLogoBase64(null); }} className={`absolute top-6 right-6 hover:text-[#c81474] ${isDark ? "text-neutral-500" : "text-gray-400"}`}><X className="w-6 h-6" /></button>
              <h2 className="text-2xl font-bold mb-2">{t("Agregar Stand Manual", "Add Manual Stand")}</h2>
              <form onSubmit={handleCrearStandManual} className="space-y-6 mt-6">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>{t("Nombre del Stand", "Stand Name")}</label>
                  <input type="text" required value={nombreNuevoStand} onChange={(e) => setNombreNuevoStand(e.target.value)} className={`w-full border rounded-xl p-3 focus:outline-none focus:border-[#c81474] transition-colors ${isDark ? "bg-neutral-950 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>{t("Logo del Stand (Opcional)", "Stand Logo (Optional)")}</label>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className={`w-full border rounded-xl p-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#c81474] file:text-white hover:file:bg-[#a61060] ${isDark ? "bg-neutral-950 border-neutral-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"}`} />
                  {logoBase64 && <div className="mt-3 flex justify-center"><img src={logoBase64} alt="Preview" className="h-16 w-16 object-cover rounded-full border-2 border-[#c81474]" /></div>}
                </div>
                <button type="submit" disabled={loading || !nombreNuevoStand.trim()} className="w-full bg-[#c81474] hover:bg-[#a61060] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md disabled:opacity-50">{t("Crear Stand", "Create Stand")}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditStandModalOpen && editingStand && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsEditStandModalOpen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`border rounded-3xl p-8 max-w-md w-full shadow-2xl relative ${isDark ? "bg-neutral-900 border-[#c81474]" : "bg-white border-[#c81474]"}`} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setIsEditStandModalOpen(false)} className={`absolute top-6 right-6 hover:text-[#c81474] ${isDark ? "text-neutral-500" : "text-gray-400"}`}><X className="w-6 h-6" /></button>
              <h2 className="text-2xl font-bold mb-6">{t("Editar Stand", "Edit Stand")}</h2>
              <form onSubmit={guardarEdicionStand} className="space-y-4">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>{t("Nombre del Stand", "Stand Name")}</label>
                  <input type="text" required value={editingStand.nombreStand} onChange={(e) => setEditingStand({...editingStand, nombreStand: e.target.value})} className={`w-full border rounded-xl p-3 focus:outline-none focus:border-[#c81474] ${isDark ? "bg-neutral-950 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>{t("Logo del Stand (Opcional)", "Stand Logo (Optional)")}</label>
                  <input type="file" accept="image/*" onChange={handleEditLogoUpload} className={`w-full border rounded-xl p-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#c81474] file:text-white hover:file:bg-[#a61060] ${isDark ? "bg-neutral-950 border-neutral-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"}`} />
                  {editingStand.logo && <div className="mt-3 flex justify-center"><img src={editingStand.logo} alt="Preview" className="h-16 w-16 object-cover rounded-full border-2 border-[#c81474]" /></div>}
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>{t("Nueva Contraseña (Opcional)", "New Password (Optional)")}</label>
                  <input type="text" placeholder="" value={editingStand.password} onChange={(e) => setEditingStand({...editingStand, password: e.target.value})} className={`w-full border rounded-xl p-3 focus:outline-none focus:border-[#c81474] ${isDark ? "bg-neutral-950 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-[#c81474] hover:bg-[#a61060] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md disabled:opacity-50 mt-4">{t("Guardar Cambios", "Save Changes")}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditClienteModalOpen && editingCliente && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsEditClienteModalOpen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`border rounded-3xl p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] flex flex-col ${isDark ? "bg-neutral-900 border-[#c81474]" : "bg-white border-[#c81474]"}`} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setIsEditClienteModalOpen(false)} className={`absolute top-6 right-6 hover:text-[#c81474] ${isDark ? "text-neutral-500" : "text-gray-400"}`}><X className="w-6 h-6" /></button>
              
              <h2 className="text-2xl font-bold mb-6 shrink-0">{t("Editar Visitante", "Edit Visitor")}</h2>
              
              <form onSubmit={guardarEdicionCliente} className="flex flex-col flex-1 overflow-hidden">
                <div className="space-y-4 overflow-y-auto pr-2 pb-4 flex-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#c81474 transparent" }}>
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>{t("Nombres", "First Name")}</label>
                    <input type="text" required value={editingCliente.nombres} onChange={(e) => setEditingCliente({...editingCliente, nombres: e.target.value})} className={`w-full border rounded-xl p-3 focus:outline-none focus:border-[#c81474] ${isDark ? "bg-neutral-950 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>{t("Apellidos", "Last Name")}</label>
                    <input type="text" required value={editingCliente.apellidos} onChange={(e) => setEditingCliente({...editingCliente, apellidos: e.target.value})} className={`w-full border rounded-xl p-3 focus:outline-none focus:border-[#c81474] ${isDark ? "bg-neutral-950 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>{t("Documento (Usuario/Pass)", "Document (User/Pass)")}</label>
                    <input type="text" required value={editingCliente.username} onChange={(e) => setEditingCliente({...editingCliente, username: e.target.value})} className={`w-full border rounded-xl p-3 focus:outline-none focus:border-[#c81474] ${isDark ? "bg-neutral-950 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>{t("Institución", "Institution")}</label>
                    <input type="text" value={editingCliente.institucion || ""} onChange={(e) => setEditingCliente({...editingCliente, institucion: e.target.value})} className={`w-full border rounded-xl p-3 focus:outline-none focus:border-[#c81474] ${isDark ? "bg-neutral-950 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>{t("Cargo", "Position")}</label>
                    <input type="text" value={editingCliente.cargo || ""} onChange={(e) => setEditingCliente({...editingCliente, cargo: e.target.value})} className={`w-full border rounded-xl p-3 focus:outline-none focus:border-[#c81474] ${isDark ? "bg-neutral-950 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>{t("Teléfono", "Phone")}</label>
                    <input type="text" value={editingCliente.telefono || ""} onChange={(e) => setEditingCliente({...editingCliente, telefono: e.target.value})} className={`w-full border rounded-xl p-3 focus:outline-none focus:border-[#c81474] ${isDark ? "bg-neutral-950 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>{t("Correo Electrónico", "Email")}</label>
                    <input type="email" value={editingCliente.correo || ""} onChange={(e) => setEditingCliente({...editingCliente, correo: e.target.value})} className={`w-full border rounded-xl p-3 focus:outline-none focus:border-[#c81474] ${isDark ? "bg-neutral-950 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
                  </div>
                </div>
                
                <div className={`pt-4 mt-2 border-t shrink-0 ${isDark ? "border-neutral-800" : "border-gray-200"}`}>
                  <button type="submit" disabled={loading} className="w-full bg-[#c81474] hover:bg-[#a61060] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md disabled:opacity-50">{t("Guardar Cambios", "Save Changes")}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detallesAbiertos && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setDetallesAbiertos(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`border rounded-3xl p-8 max-w-4xl w-full shadow-2xl relative max-h-[80vh] flex flex-col ${isDark ? "bg-neutral-900 border-[#c81474]" : "bg-white border-[#c81474]"}`} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setDetallesAbiertos(false)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${isDark ? "text-neutral-500 hover:text-white bg-neutral-800 hover:bg-neutral-700" : "text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200"}`}><X className="w-5 h-5" /></button>
              
              {tipoDetalle === "GANADOR" ? (
                <div>
                  <h2 className={`text-3xl font-bold mb-6 uppercase tracking-widest border-b pb-4 flex items-center ${isDark ? "text-yellow-400 border-neutral-800" : "text-yellow-600 border-gray-200"}`}>
                    <Trophy className="w-8 h-8 mr-3" /> {t("Perfil del Ganador", "Winner Profile")}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
                    <div><p className={`text-sm ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{t("Nombres", "First Name")}</p><p className="font-bold">{entidadSeleccionada?.nombres}</p></div>
                    <div><p className={`text-sm ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{t("Apellidos", "Last Name")}</p><p className="font-bold">{entidadSeleccionada?.apellidos}</p></div>
                    <div><p className={`text-sm ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{t("Documento", "Document")}</p><p className="font-mono text-[#c81474]">{entidadSeleccionada?.username}</p></div>
                    <div><p className={`text-sm ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{t("Institución", "Institution")}</p><p className="font-bold">{entidadSeleccionada?.institucion || "N/A"}</p></div>
                    <div><p className={`text-sm ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{t("Cargo", "Position")}</p><p className="font-bold">{entidadSeleccionada?.cargo || "N/A"}</p></div>
                    <div><p className={`text-sm ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{t("Teléfono", "Phone")}</p><p className="font-bold">{entidadSeleccionada?.telefono || "N/A"}</p></div>
                    <div className="md:col-span-2"><p className={`text-sm ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{t("Correo Electrónico", "Email")}</p><p className="font-bold text-[#c81474]">{entidadSeleccionada?.correo || "N/A"}</p></div>
                    <div className={`md:col-span-2 mt-4 p-4 border rounded-xl ${isDark ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}>
                      <p className="font-bold flex items-center"><Star className={`w-5 h-5 mr-2 ${isDark ? "fill-yellow-500" : "fill-yellow-500"}`} /> {t("Stands Calificados:", "Rated Stands:")} {entidadSeleccionada?._count?.calificacionesDadas}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-[#c81474] mb-2 uppercase tracking-widest">
                    {t("Auditoría:", "Audit:")} {tipoDetalle === "STAND" ? entidadSeleccionada?.nombreStand : `${entidadSeleccionada?.nombres} ${entidadSeleccionada?.apellidos}`}
                  </h2>
                  <p className={`mb-6 border-b pb-4 ${isDark ? "text-neutral-400 border-neutral-800" : "text-gray-500 border-gray-200"}`}>{t("Total de registros:", "Total records:")} {historialDetallado.length}</p>

                  <div className="overflow-y-auto flex-1 pr-2 space-y-4">
                    {historialDetallado.length === 0 ? (
                      <p className={`text-center py-10 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>No hay registros para mostrar.</p>
                    ) : (
                      historialDetallado.map((h: any) => (
                        <div key={h.id} className={`border rounded-xl p-5 ${isDark ? "bg-neutral-950/50 border-neutral-800" : "bg-gray-50 border-gray-200"}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                                {tipoDetalle === "STAND" ? `${h.cliente.nombres} ${h.cliente.apellidos}` : h.stand.nombreStand}
                              </p>
                              {tipoDetalle === "STAND" && (
                                <p className="text-xs text-[#c81474] font-mono">Doc: {h.cliente.username} - {h.cliente.institucion}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className={`text-xs block mb-1 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{new Date(h.createdAt).toLocaleDateString(language === "en" ? 'en-US' : 'es-ES')} {new Date(h.createdAt).toLocaleTimeString(language === "en" ? 'en-US' : 'es-ES')}</span>
                              {h.estrellas && (
                                <span className={`font-bold px-2 py-1 rounded-md inline-flex items-center text-sm ${isDark ? "bg-yellow-500/20 text-yellow-500" : "bg-yellow-100 text-yellow-700 border border-yellow-200"}`}>
                                  {h.estrellas} <Star className="w-3 h-3 ml-1 fill-yellow-500" />
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`p-3 rounded-lg flex items-start space-x-3 border ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"}`}>
                            <MessageSquare className={`w-4 h-4 mt-1 shrink-0 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
                            <p className={`text-sm italic ${isDark ? "text-neutral-300" : "text-gray-700"}`}>"{h.comentario}"</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}