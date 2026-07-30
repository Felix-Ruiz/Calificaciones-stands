"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Users, Store, Gift, Settings, LogOut, Upload, Star, Trophy, History, Play, Plus, X, Eye, MessageSquare, Edit, Trash2, Download, ExternalLink, Printer, Copy, Menu, Maximize, AlertTriangle, Search } from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Listados Originales
  const [standsList, setStandsList] = useState<any[]>([]);
  const [clientesList, setClientesList] = useState<any[]>([]);
  const [historialPremios, setHistorialPremios] = useState<any[]>([]);
  
  // Estados de Búsqueda
  const [searchStand, setSearchStand] = useState("");
  const [searchCliente, setSearchCliente] = useState("");

  // Paginación
  const [pageStands, setPageStands] = useState(1);
  const [limitStands, setLimitStands] = useState(20);
  const [pageClientes, setPageClientes] = useState(1);
  const [limitClientes, setLimitClientes] = useState(20);

  // Configuración y Sorteo
  const [ajustes, setAjustes] = useState({ requiredStandsForLottery: 5, activarEstrellas: true });
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningName, setSpinningName] = useState("¿QUIÉN SERÁ EL SELECCIONADO?");
  const [winner, setWinner] = useState<any>(null);

  // Modales
  const [isModalStandOpen, setIsModalStandOpen] = useState(false);
  const [nombreNuevoStand, setNombreNuevoStand] = useState("");
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  
  const [isEditStandModalOpen, setIsEditStandModalOpen] = useState(false);
  const [editingStand, setEditingStand] = useState<any>(null);
  const [isEditClienteModalOpen, setIsEditClienteModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);

  // Modal Global de Confirmación
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: "", onConfirm: () => {} });

  // Detalles Auditoría y Ganador
  const [detallesAbiertos, setDetallesAbiertos] = useState(false);
  const [tipoDetalle, setTipoDetalle] = useState<"STAND" | "CLIENTE" | "GANADOR" | null>(null);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState<any>(null);
  const [historialDetallado, setHistorialDetallado] = useState<any[]>([]);

  const fileInputRefStands = useRef<HTMLInputElement>(null);
  const fileInputRefClientes = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMensaje("");
    if (activeTab === "stands") cargarListaStands();
    if (activeTab === "clientes") cargarListaClientes();
    if (activeTab === "sorteo" || activeTab === "historial") cargarDatosSorteo();
    if (activeTab === "ajustes") cargarAjustes();
  }, [activeTab]);

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
    setMensaje("Configuración guardada.");
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
      message: `¿Estás seguro de que deseas eliminar el stand "${nombre}"? También se borrarán todas sus calificaciones.`,
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
      message: `¿Estás seguro de eliminar al visitante "${nombre}"? Sus calificaciones y premios también se borrarán.`,
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
      message: `¡ATENCIÓN! Vas a eliminar a TODOS los visitantes registrados (${clientesList.length}) junto con sus calificaciones y premios. Esta acción es destructiva y NO se puede deshacer.`,
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
      message: `¿Estás seguro de borrar a "${nombre}" del historial de ganadores? Esto NO eliminará al visitante, solo su registro de premio.`,
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
    const texto = `Usuario: ${s.username}\nContraseña: ${s.password}\nLink de acceso: ${window.location.origin}/login`;
    navigator.clipboard.writeText(texto);
    setMensaje(`Datos copiados al portapapeles.`);
    setTimeout(() => setMensaje(""), 3000);
  };

  const imprimirQRDesdeMaster = async (s: any) => {
    const url = `${window.location.origin}/calificar/${s.id}`;
    const qrCode = new QRCodeStyling({
      width: 300, height: 300, data: url, image: s.logo || undefined,
      dotsOptions: { type: "dots", gradient: { type: "linear", rotation: Math.PI / 4, colorStops: [{ offset: 0, color: "#d81b60" }, { offset: 1, color: "#5b21b6" }] } },
      cornersSquareOptions: { type: "dot" },
      cornersDotOptions: { type: "dot" },
      backgroundOptions: { color: "#ffffff" },
      imageOptions: { crossOrigin: "anonymous", margin: 0, imageSize: 0.3, hideBackgroundDots: false }
    });
    const blob = await qrCode.getRawData("png");
    if (!blob) return;
    const imgUrl = URL.createObjectURL(blob as Blob);
    const printWindow = window.open('', '', 'width=800,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Imprimir QR - ${s.nombreStand}</title>
            <style>
              body { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif; text-align:center; }
              .qr-container { padding: 20px; border: 4px solid #c026d3; border-radius: 20px; margin-top: 10px; }
              img { width: 300px; height: 300px; object-fit: contain; }
              h1 { font-size: 32px; margin: 0 0 10px 0; }
              p { font-size: 18px; color: #666; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>${s.nombreStand}</h1>
            <div class="qr-container"><img src="${imgUrl}" alt="QR" /></div>
            <p>Escanea este código para calificar nuestro stand</p>
            <script>window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 500); }</script>
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
      } catch (error) { setMensaje("Error procesando Excel."); }
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
      } catch (error) { setMensaje("Error procesando Excel."); }
      finally { setLoading(false); if (fileInputRefClientes.current) fileInputRefClientes.current.value = ""; }
    };
    reader.readAsBinaryString(file);
  };

  const exportarStandsExcel = () => {
    const data = standsList.map((s: any) => ({ "Nombre del Stand": s.nombreStand, "Usuario": s.username, "Contraseña": s.password }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stands");
    XLSX.writeFile(wb, "Reporte_Stands.xlsx");
  };

  const exportarClientesExcel = () => {
    const data = clientesList.map((c: any) => ({ 
      "Nombres": c.nombres, "Apellidos": c.apellidos, "Documento": c.username, 
      "Institución": c.institucion, "Cargo": c.cargo, "Teléfono": c.telefono, "Correo": c.correo,
      "Stands Calificados": c._count.calificacionesDadas
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Visitantes");
    XLSX.writeFile(wb, "Reporte_Visitantes.xlsx");
  };

  // ================= FILTROS DE BÚSQUEDA Y PAGINACIÓN =================
  
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
    { id: "stands", label: "Stands", icon: Store },
    { id: "clientes", label: "Visitantes", icon: Users },
    { id: "sorteo", label: "Sorteo Dinámico", icon: Gift },
    { id: "historial", label: "Historial Sorteos", icon: History },
    { id: "ajustes", label: "Configuración", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 256, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="bg-neutral-900 border-r border-fuchsia-500/20 p-6 flex flex-col z-20 shadow-2xl overflow-hidden shrink-0">
            <div className="mb-10 flex justify-between items-center whitespace-nowrap">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-400 via-fuchsia-500 to-purple-500 tracking-widest uppercase">
                Panel Master
              </h2>
            </div>
            <nav className="flex-1 space-y-3 w-52">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl transition-all font-bold ${activeTab === tab.id ? "bg-linear-to-r from-fuchsia-600 to-purple-700 shadow-[0_0_20px_rgba(217,70,239,0.4)] text-white" : "hover:bg-neutral-800 text-neutral-400 hover:text-white"}`}>
                    <Icon className="w-5 h-5" /><span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-500 transition-all mt-auto font-bold w-52">
              <LogOut className="w-5 h-5" /><span>Cerrar Sesión</span>
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 p-8 overflow-y-auto relative h-screen">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-125 bg-fuchsia-600/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center mb-6 space-x-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white transition-colors" title="Ocultar/Mostrar Menú">
              <Menu className="w-6 h-6" />
            </button>
            <AnimatePresence>
              {mensaje && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 p-3 rounded-xl bg-neutral-900 border border-fuchsia-500 text-fuchsia-400 font-bold text-center shadow-lg">
                  {mensaje}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ================= STANDS ================= */}
          {activeTab === "stands" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                  <h1 className="text-4xl font-black uppercase">Gestión de Stands</h1>
                  <p className="text-neutral-400 font-bold mt-1">Total registrados: {standsList.length}</p>
                </div>
                <div className="flex space-x-3 flex-wrap gap-y-2">
                  <button onClick={() => setIsModalStandOpen(true)} className="flex items-center space-x-2 bg-neutral-800 text-white px-4 py-2 rounded-xl font-bold hover:bg-neutral-700 transition-all border border-neutral-700">
                    <Plus className="w-5 h-5" /><span>Manual</span>
                  </button>
                  <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRefStands} onChange={handleFileUploadStands} />
                  <button onClick={() => fileInputRefStands.current?.click()} disabled={loading} className="flex items-center space-x-2 bg-fuchsia-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-fuchsia-500 transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)]">
                    <Upload className="w-5 h-5" /><span>Excel</span>
                  </button>
                </div>
              </div>

              {/* BUSCADOR DE STANDS */}
              <div className="relative w-full md:w-96 mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar stand por nombre o usuario..."
                  value={searchStand}
                  onChange={(e) => { setSearchStand(e.target.value); setPageStands(1); }}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-fuchsia-500 transition-colors shadow-inner"
                />
              </div>

              <div className="flex justify-between items-center mb-4 text-sm text-neutral-400">
                <div className="flex items-center space-x-2">
                  <span>Mostrar:</span>
                  <select value={limitStands} onChange={(e) => {setLimitStands(Number(e.target.value)); setPageStands(1);}} className="bg-neutral-900 border border-neutral-700 rounded-lg p-1 text-white outline-none">
                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
                  </select>
                </div>
                <button onClick={exportarStandsExcel} className="flex items-center space-x-2 bg-green-600/20 text-green-500 border border-green-500/50 px-4 py-2 rounded-xl font-bold hover:bg-green-600/30 transition-all">
                  <Download className="w-4 h-4" /><span>Exportar</span>
                </button>
              </div>

              <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-black/50">
                      <th className="p-4 font-bold text-neutral-300">Stand</th>
                      <th className="p-4 font-bold text-neutral-300">Usuario</th>
                      <th className="p-4 font-bold text-neutral-300">Contraseña</th>
                      <th className="p-4 font-bold text-neutral-300 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStands.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-neutral-500">No se encontraron stands con esos datos.</td></tr>
                    ) : (
                      paginatedStands.map((s: any) => (
                        <tr key={s.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/50 transition-colors">
                          <td className="p-4 font-medium flex items-center space-x-3">
                            {s.logo ? <img src={s.logo} alt="logo" className="w-8 h-8 rounded-full object-cover border border-neutral-700" /> : <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs text-neutral-500">S</div>}
                            <span>{s.nombreStand}</span>
                          </td>
                          <td className="p-4 text-fuchsia-400 font-mono">{s.username}</td>
                          <td className="p-4 text-purple-400 font-mono">{s.password}</td>
                          <td className="p-4">
                            <div className="flex justify-end space-x-2">
                              <button onClick={() => copiarDatosLogin(s)} className="text-neutral-400 hover:text-white p-2 bg-neutral-800 rounded-lg transition-colors" title="Copiar Datos Login">
                                <Copy className="w-4 h-4" />
                              </button>
                              <a href={`/calificar/${s.id}`} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-green-400 p-2 bg-neutral-800 rounded-lg transition-colors flex items-center justify-center" title="Link Calificar">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button onClick={() => imprimirQRDesdeMaster(s)} className="text-neutral-400 hover:text-purple-400 p-2 bg-neutral-800 rounded-lg transition-colors" title="Imprimir QR Prémium">
                                <Printer className="w-4 h-4" />
                              </button>
                              <button onClick={() => abrirDetalles(s, "STAND")} className="text-neutral-400 hover:text-fuchsia-400 p-2 bg-neutral-800 rounded-lg transition-colors" title="Ver Comentarios">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => { setEditingStand(s); setIsEditStandModalOpen(true); }} className="text-neutral-400 hover:text-blue-400 p-2 bg-neutral-800 rounded-lg transition-colors" title="Editar">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleEliminarStand(s.id, s.nombreStand)} className="text-neutral-400 hover:text-red-400 p-2 bg-neutral-800 rounded-lg transition-colors" title="Eliminar">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-4">
                <button disabled={pageStands === 1} onClick={() => setPageStands(pageStands - 1)} className="px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm disabled:opacity-50 transition-colors hover:bg-neutral-800">Anterior</button>
                <span className="text-neutral-400 text-sm">Página {pageStands} de {totalPagesStands || 1}</span>
                <button disabled={pageStands === totalPagesStands || totalPagesStands === 0} onClick={() => setPageStands(pageStands + 1)} className="px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm disabled:opacity-50 transition-colors hover:bg-neutral-800">Siguiente</button>
              </div>
            </motion.div>
          )}

          {/* ================= CLIENTES ================= */}
          {activeTab === "clientes" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                  <h1 className="text-4xl font-black uppercase">Gestión de Visitantes</h1>
                  <p className="text-neutral-400 font-bold mt-1">Total registrados: {clientesList.length}</p>
                </div>
                <div className="flex space-x-3 flex-wrap gap-y-2">
                  <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRefClientes} onChange={handleFileUploadClientes} />
                  <button onClick={() => fileInputRefClientes.current?.click()} disabled={loading} className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                    <Upload className="w-5 h-5" /><span>Excel Visitantes</span>
                  </button>
                  <button onClick={handleEliminarTodosClientes} disabled={loading || clientesList.length === 0} className="flex items-center space-x-2 bg-red-600/20 text-red-500 border border-red-500/50 px-4 py-2 rounded-xl font-bold hover:bg-red-600/30 transition-all disabled:opacity-50">
                    <Trash2 className="w-5 h-5" /><span>Eliminar Todos</span>
                  </button>
                </div>
              </div>

              {/* BUSCADOR DE VISITANTES */}
              <div className="relative w-full md:w-lg mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar visitante por nombre, documento o institución..."
                  value={searchCliente}
                  onChange={(e) => { setSearchCliente(e.target.value); setPageClientes(1); }}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
                />
              </div>

              <div className="flex justify-between items-center mb-4 text-sm text-neutral-400">
                <div className="flex items-center space-x-2">
                  <span>Mostrar:</span>
                  <select value={limitClientes} onChange={(e) => {setLimitClientes(Number(e.target.value)); setPageClientes(1);}} className="bg-neutral-900 border border-neutral-700 rounded-lg p-1 text-white outline-none">
                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
                  </select>
                </div>
                <button onClick={exportarClientesExcel} className="flex items-center space-x-2 bg-green-600/20 text-green-500 border border-green-500/50 px-4 py-2 rounded-xl font-bold hover:bg-green-600/30 transition-all">
                  <Download className="w-4 h-4" /><span>Exportar</span>
                </button>
              </div>

              <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-black/50">
                      <th className="p-4 font-bold text-neutral-300">Nombre Completo</th>
                      <th className="p-4 font-bold text-neutral-300">Documento</th>
                      <th className="p-4 font-bold text-neutral-300">Institución</th>
                      <th className="p-4 font-bold text-neutral-300">Calif.</th>
                      <th className="p-4 font-bold text-neutral-300 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClientes.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-neutral-500">No se encontraron visitantes con esos datos.</td></tr>
                    ) : (
                      paginatedClientes.map((c: any) => (
                        <tr key={c.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/50 transition-colors">
                          <td className="p-4 font-medium">{c.nombres} {c.apellidos}</td>
                          <td className="p-4 text-purple-400 font-mono">{c.username}</td>
                          <td className="p-4 text-neutral-400">{c.institucion}</td>
                          <td className="p-4">
                            <span className="bg-yellow-500/20 text-yellow-500 font-black px-3 py-1 rounded-full flex items-center w-fit space-x-1">
                              <Star className="w-3 h-3 fill-yellow-500" /><span>{c._count.calificacionesDadas}</span>
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end space-x-2">
                              <button onClick={() => abrirDetalles(c, "CLIENTE")} className="text-neutral-400 hover:text-purple-400 p-2 bg-neutral-800 rounded-lg transition-colors" title="Ver Auditoría">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => { setEditingCliente(c); setIsEditClienteModalOpen(true); }} className="text-neutral-400 hover:text-blue-400 p-2 bg-neutral-800 rounded-lg transition-colors" title="Editar">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleEliminarCliente(c.id, `${c.nombres} ${c.apellidos}`)} className="text-neutral-400 hover:text-red-400 p-2 bg-neutral-800 rounded-lg transition-colors" title="Eliminar">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-4">
                <button disabled={pageClientes === 1} onClick={() => setPageClientes(pageClientes - 1)} className="px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm disabled:opacity-50 transition-colors hover:bg-neutral-800">Anterior</button>
                <span className="text-neutral-400 text-sm">Página {pageClientes} de {totalPagesClientes || 1}</span>
                <button disabled={pageClientes === totalPagesClientes || totalPagesClientes === 0} onClick={() => setPageClientes(pageClientes + 1)} className="px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm disabled:opacity-50 transition-colors hover:bg-neutral-800">Siguiente</button>
              </div>
            </motion.div>
          )}

          {/* ================= SORTEO DINÁMICO ================= */}
          {activeTab === "sorteo" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-[80vh]">
              <div className="text-center mb-6">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-fuchsia-500 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                  Sorteo de Reconocimientos
                </h1>
                <p className="text-neutral-400 mt-4 text-lg">
                  Participantes: <span className="text-white font-bold text-2xl ml-2">{participantes.length}</span>
                </p>
                <p className="text-fuchsia-500/70 text-sm">(Requisito actual: Haber calificado {ajustes.requiredStandsForLottery} stands o más)</p>
              </div>

              <button onClick={toggleFullscreen} className="mb-6 flex items-center space-x-2 text-neutral-400 hover:text-white bg-neutral-800 px-4 py-2 rounded-lg transition-colors">
                <Maximize className="w-5 h-5" /> <span>Proyectar en Pantalla Completa</span>
              </button>

              <div id="sorteo-container" className="relative w-full max-w-4xl min-h-112.5 py-12 px-6 bg-neutral-950/90 backdrop-blur-3xl border-2 border-neutral-800 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] flex flex-col justify-center items-center overflow-hidden mb-12 rounded-[3rem] [&:fullscreen]:rounded-none [&:fullscreen]:border-none [&:fullscreen]:max-w-none [&:fullscreen]:w-screen [&:fullscreen]:h-screen [&:fullscreen]:bg-neutral-950 [&:fullscreen]:flex [&:fullscreen]:items-center [&:fullscreen]:justify-center">
                <div className={`absolute inset-0 bg-[conic-gradient(from_90deg,transparent,rgba(217,70,239,0.2),transparent)] ${isSpinning ? 'animate-spin' : ''} duration-3000 pointer-events-none`} />

                {!isSpinning && !winner && (
                  <button onClick={iniciarSorteo} disabled={participantes.length === 0} className="relative group disabled:opacity-50 disabled:cursor-not-allowed z-10">
                    <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-fuchsia-500 to-purple-600 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300 opacity-70 group-hover:opacity-100 animate-pulse" />
                    <div className="relative bg-linear-to-br from-neutral-900 to-black border-4 border-fuchsia-500 rounded-full w-52 h-52 p-4 flex flex-col items-center justify-center transform group-hover:scale-110 transition-transform shadow-[0_0_50px_rgba(217,70,239,0.5)]">
                      <Play className="w-12 h-12 text-fuchsia-500 ml-2 mb-2 shrink-0" />
                      <span className="text-white font-black text-lg uppercase tracking-wider text-center leading-tight">Iniciar<br/>Selección</span>
                    </div>
                  </button>
                )}

                {isSpinning && (
                  <motion.div key={spinningName} initial={{ opacity: 0, scale: 0.5, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.5, y: -50 }} transition={{ duration: 0.1 }} className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-linear-to-b from-white to-neutral-500 uppercase tracking-tighter text-center px-4 w-full z-10">
                    {spinningName}
                  </motion.div>
                )}

                {winner && (
                  <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 15 }} className="text-center z-10 w-full px-4 flex flex-col items-center">
                    <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(234,179,8,0.8)]" />
                    <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter mb-2 drop-shadow-2xl leading-tight">
                      {winner.nombres} {winner.apellidos}
                    </h2>
                    <p className="text-2xl md:text-4xl text-purple-400 font-mono tracking-widest mb-4">
                      CC: {winner.username}
                    </p>
                    <p className="text-xl md:text-3xl text-fuchsia-400 font-bold uppercase tracking-widest">
                      {winner.institucion || "Sin Institución"}
                    </p>
                    <button onClick={() => {setWinner(null); cargarDatosSorteo();}} className="mt-10 bg-neutral-800 text-white px-8 py-3 rounded-full font-bold hover:bg-neutral-700 transition-all border border-neutral-700">
                      Realizar otra selección
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ================= HISTORIAL COMPLETO ================= */}
          {activeTab === "historial" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-black uppercase">Historial de Sorteos</h1>
                <p className="text-neutral-400 font-bold mt-1">Total Entregados: {historialPremios.length}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {historialPremios.length === 0 ? (
                  <p className="text-neutral-500 col-span-full text-center py-10">Aún no hay sorteos registrados.</p>
                ) : (
                  historialPremios.map((premio: any) => (
                    <div key={premio.id} onClick={() => abrirDetalles(premio.cliente, "GANADOR")} className="bg-neutral-900/80 border border-neutral-800 hover:border-fuchsia-500/50 p-6 rounded-3xl cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(217,70,239,0.15)] group relative overflow-hidden">
                      
                      <button 
                        onClick={(e) => handleEliminarGanador(e, premio.id, `${premio.cliente.nombres} ${premio.cliente.apellidos}`)}
                        className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors opacity-0 group-hover:opacity-100 z-10"
                        title="Eliminar premio del historial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex justify-between items-start mb-4 pr-8">
                        <Trophy className="w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform" />
                        <div className="text-right">
                          <p className="text-sm text-neutral-300 font-bold">{new Date(premio.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-neutral-500">{new Date(premio.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-white uppercase leading-tight mb-2 truncate" title={`${premio.cliente.nombres} ${premio.cliente.apellidos}`}>
                        {premio.cliente.nombres} {premio.cliente.apellidos}
                      </h3>
                      <p className="text-fuchsia-400 font-mono text-sm mb-2">ID: {premio.cliente.username}</p>
                      <p className="text-neutral-400 text-sm truncate">{premio.cliente.institucion}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ================= AJUSTES ================= */}
          {activeTab === "ajustes" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mt-10">
              <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 p-10 rounded-3xl shadow-2xl">
                <h1 className="text-3xl font-black uppercase mb-8 flex items-center border-b border-neutral-800 pb-4">
                  <Settings className="w-8 h-8 mr-4 text-fuchsia-500" /> Configuración Global
                </h1>
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-neutral-800">
                    <div>
                      <h3 className="font-bold text-lg">Calificación por Estrellas</h3>
                      <p className="text-sm text-neutral-400">Permitir a los visitantes dar 1 a 5 estrellas.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" className="sr-only peer" checked={ajustes.activarEstrellas} onChange={(e) => setAjustes({...ajustes, activarEstrellas: e.target.checked})} />
                      <div className="w-14 h-7 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-fuchsia-500"></div>
                    </label>
                  </div>
                  <div className="p-4 bg-black/30 rounded-2xl border border-neutral-800">
                    <h3 className="font-bold text-lg mb-2">Requisito para Participación</h3>
                    <p className="text-sm text-neutral-400 mb-4">¿Cuántos stands debe calificar un visitante para entrar al sorteo?</p>
                    <input type="number" min="1" value={ajustes.requiredStandsForLottery} onChange={(e) => setAjustes({...ajustes, requiredStandsForLottery: Number(e.target.value)})} className="w-full bg-neutral-950 border border-fuchsia-500/50 rounded-xl p-4 text-2xl font-bold text-center text-white focus:outline-none focus:border-fuchsia-500 transition-colors" />
                  </div>
                  <button onClick={guardarConfiguracion} disabled={loading} className="w-full py-4 bg-linear-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 text-white font-black text-lg uppercase tracking-widest rounded-xl transition-all shadow-[0_0_30px_rgba(217,70,239,0.3)] disabled:opacity-50">
                    {loading ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* ==================================================== */}
      {/* MODALES DEL SISTEMA (Con Clic por fuera para cerrar) */}
      {/* ==================================================== */}
      
      {/* DIÁLOGO GLOBAL DE CONFIRMACIÓN */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">¿Estás seguro?</h3>
              <p className="text-neutral-400 mb-8">{confirmDialog.message}</p>
              <div className="flex space-x-4">
                <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-all">Cancelar</button>
                <button onClick={confirmDialog.onConfirm} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all">Confirmar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalStandOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => { setIsModalStandOpen(false); setLogoBase64(null); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setIsModalStandOpen(false); setLogoBase64(null); }} className="absolute top-6 right-6 text-neutral-500 hover:text-white"><X className="w-6 h-6" /></button>
              <h2 className="text-2xl font-bold mb-2">Agregar Stand Manual</h2>
              <form onSubmit={handleCrearStandManual} className="space-y-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Nombre del Stand</label>
                  <input type="text" required value={nombreNuevoStand} onChange={(e) => setNombreNuevoStand(e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-white focus:outline-none focus:border-fuchsia-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Logo del Stand (Opcional para QR)</label>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-600 file:text-white hover:file:bg-fuchsia-500" />
                  {logoBase64 && <div className="mt-3 flex justify-center"><img src={logoBase64} alt="Preview" className="h-16 w-16 object-cover rounded-full border-2 border-fuchsia-500" /></div>}
                </div>
                <button type="submit" disabled={loading || !nombreNuevoStand.trim()} className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50">Crear Stand</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditStandModalOpen && editingStand && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsEditStandModalOpen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setIsEditStandModalOpen(false)} className="absolute top-6 right-6 text-neutral-500 hover:text-white"><X className="w-6 h-6" /></button>
              <h2 className="text-2xl font-bold mb-6">Editar Stand</h2>
              <form onSubmit={guardarEdicionStand} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Nombre del Stand</label>
                  <input type="text" required value={editingStand.nombreStand} onChange={(e) => setEditingStand({...editingStand, nombreStand: e.target.value})} className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-white focus:outline-none focus:border-fuchsia-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Logo del Stand</label>
                  <input type="file" accept="image/*" onChange={handleEditLogoUpload} className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-600 file:text-white hover:file:bg-fuchsia-500" />
                  {editingStand.logo && <div className="mt-3 flex justify-center"><img src={editingStand.logo} alt="Preview" className="h-16 w-16 object-cover rounded-full border-2 border-fuchsia-500" /></div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Nueva Contraseña (Opcional)</label>
                  <input type="text" placeholder="Dejar en blanco para no cambiar" value={editingStand.password} onChange={(e) => setEditingStand({...editingStand, password: e.target.value})} className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-white focus:outline-none focus:border-fuchsia-500" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 mt-4">Guardar Cambios</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditClienteModalOpen && editingCliente && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsEditClienteModalOpen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setIsEditClienteModalOpen(false)} className="absolute top-6 right-6 text-neutral-500 hover:text-white"><X className="w-6 h-6" /></button>
              
              <h2 className="text-2xl font-bold mb-6 shrink-0">Editar Visitante</h2>
              
              <form onSubmit={guardarEdicionCliente} className="flex flex-col flex-1 overflow-hidden">
                <div className="space-y-4 overflow-y-auto pr-2 pb-4 flex-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#d946ef transparent" }}>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Nombres</label>
                    <input type="text" required value={editingCliente.nombres} onChange={(e) => setEditingCliente({...editingCliente, nombres: e.target.value})} className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Apellidos</label>
                    <input type="text" required value={editingCliente.apellidos} onChange={(e) => setEditingCliente({...editingCliente, apellidos: e.target.value})} className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Documento (Usuario/Pass)</label>
                    <input type="text" required value={editingCliente.username} onChange={(e) => setEditingCliente({...editingCliente, username: e.target.value})} className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Institución</label>
                    <input type="text" value={editingCliente.institucion || ""} onChange={(e) => setEditingCliente({...editingCliente, institucion: e.target.value})} className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Cargo</label>
                    <input type="text" value={editingCliente.cargo || ""} onChange={(e) => setEditingCliente({...editingCliente, cargo: e.target.value})} className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Teléfono</label>
                    <input type="text" value={editingCliente.telefono || ""} onChange={(e) => setEditingCliente({...editingCliente, telefono: e.target.value})} className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Correo Electrónico</label>
                    <input type="email" value={editingCliente.correo || ""} onChange={(e) => setEditingCliente({...editingCliente, correo: e.target.value})} className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" />
                  </div>
                </div>
                
                <div className="pt-4 mt-2 border-t border-neutral-800 shrink-0">
                  <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50">Guardar Cambios</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detallesAbiertos && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setDetallesAbiertos(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-4xl w-full shadow-2xl relative max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setDetallesAbiertos(false)} className="absolute top-6 right-6 text-neutral-500 hover:text-white bg-neutral-800 p-2 rounded-full"><X className="w-5 h-5" /></button>
              
              {tipoDetalle === "GANADOR" ? (
                <div>
                  <h2 className="text-3xl font-bold text-yellow-400 mb-6 uppercase tracking-widest border-b border-neutral-800 pb-4 flex items-center">
                    <Trophy className="w-8 h-8 mr-3" /> Perfil del Ganador
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
                    <div><p className="text-neutral-500 text-sm">Nombres</p><p className="font-bold">{entidadSeleccionada?.nombres}</p></div>
                    <div><p className="text-neutral-500 text-sm">Apellidos</p><p className="font-bold">{entidadSeleccionada?.apellidos}</p></div>
                    <div><p className="text-neutral-500 text-sm">Documento</p><p className="font-mono text-purple-400">{entidadSeleccionada?.username}</p></div>
                    <div><p className="text-neutral-500 text-sm">Institución</p><p className="font-bold">{entidadSeleccionada?.institucion || "N/A"}</p></div>
                    <div><p className="text-neutral-500 text-sm">Cargo</p><p className="font-bold">{entidadSeleccionada?.cargo || "N/A"}</p></div>
                    <div><p className="text-neutral-500 text-sm">Teléfono</p><p className="font-bold">{entidadSeleccionada?.telefono || "N/A"}</p></div>
                    <div className="md:col-span-2"><p className="text-neutral-500 text-sm">Correo</p><p className="font-bold text-blue-400">{entidadSeleccionada?.correo || "N/A"}</p></div>
                    <div className="md:col-span-2 mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                      <p className="text-yellow-500 font-bold flex items-center"><Star className="w-5 h-5 mr-2 fill-yellow-500" /> Stands Calificados: {entidadSeleccionada?._count?.calificacionesDadas}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-fuchsia-400 mb-2 uppercase tracking-widest">
                    Auditoría: {tipoDetalle === "STAND" ? entidadSeleccionada?.nombreStand : `${entidadSeleccionada?.nombres} ${entidadSeleccionada?.apellidos}`}
                  </h2>
                  <p className="text-neutral-400 mb-6 border-b border-neutral-800 pb-4">Total de registros: {historialDetallado.length}</p>

                  <div className="overflow-y-auto flex-1 pr-2 space-y-4">
                    {historialDetallado.length === 0 ? (
                      <p className="text-center text-neutral-500 py-10">No hay registros para mostrar.</p>
                    ) : (
                      historialDetallado.map((h: any) => (
                        <div key={h.id} className="bg-neutral-950/50 border border-neutral-800 rounded-xl p-5">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-white text-lg">
                                {tipoDetalle === "STAND" ? `${h.cliente.nombres} ${h.cliente.apellidos}` : h.stand.nombreStand}
                              </p>
                              {tipoDetalle === "STAND" && (
                                <p className="text-xs text-purple-400 font-mono">Doc: {h.cliente.username} - {h.cliente.institucion}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-neutral-500 block mb-1">{new Date(h.createdAt).toLocaleDateString()} {new Date(h.createdAt).toLocaleTimeString()}</span>
                              {h.estrellas && (
                                <span className="bg-yellow-500/20 text-yellow-500 font-bold px-2 py-1 rounded-md inline-flex items-center text-sm">
                                  {h.estrellas} <Star className="w-3 h-3 ml-1 fill-yellow-500" />
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="bg-neutral-900 p-3 rounded-lg flex items-start space-x-3">
                            <MessageSquare className="w-4 h-4 text-neutral-500 mt-1 shrink-0" />
                            <p className="text-neutral-300 text-sm italic">"{h.comentario}"</p>
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