"use client";

import { useState, Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, User, Lock, LogIn, AlertCircle, Globe, Sun, Moon, Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function LoginContent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // ESTADOS GLOBALES: Idioma y Tema
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // ESTADO PWA
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    // Revisar idioma guardado o forzar Inglés por defecto
    const savedLang = localStorage.getItem("app-lang") as "en" | "es";
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      setLanguage("en");
      localStorage.setItem("app-lang", "en");
    }

    // Revisar tema guardado o forzar Oscuro por defecto
    const savedTheme = localStorage.getItem("app-theme") as "dark" | "light";
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme("dark");
      localStorage.setItem("app-theme", "dark");
    }

    // Detección de PWA para mostrar prompt de instalación en móvil
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const hasSeenPrompt = localStorage.getItem('pwa-prompt-seen');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (!isStandalone && isMobile && !hasSeenPrompt) {
      setTimeout(() => setShowPwaPrompt(true), 2000);
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

  const cerrarPwaPrompt = () => {
    setShowPwaPrompt(false);
    localStorage.setItem('pwa-prompt-seen', "true");
  };

  const isDark = theme === "dark";
  const t = (es: string, en: string) => language === "en" ? en : es;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(t("Usuario o contraseña incorrectos", "Incorrect username or password"));
      setLoading(false);
    } else {
      const rawCallback = searchParams.get("callbackUrl");
      let finalUrl = "/";

      if (rawCallback) {
        try {
          if (rawCallback.startsWith("http")) {
            const urlObj = new URL(rawCallback);
            finalUrl = urlObj.pathname + urlObj.search;
          } else {
            finalUrl = rawCallback;
          }
        } catch (err) {
          finalUrl = rawCallback;
        }
      }
      
      window.location.href = finalUrl;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-gray-50"}`}>
      
      {/* BOTONES GLOBALES (ARRIBA A LA DERECHA) */}
      <div className="absolute top-6 right-6 z-50 flex items-center space-x-3">
        <button 
          onClick={() => setShowPwaPrompt(true)} 
          className={`flex items-center space-x-2 border px-4 py-2 rounded-full transition-colors shadow-lg ${isDark ? "bg-neutral-900 border-[#c81474]/50 text-[#c81474] hover:bg-neutral-800" : "bg-white border-[#c81474]/30 text-[#c81474] hover:bg-gray-100"}`}
          title={t("Instalar App", "Install App")}
        >
          <Download className="w-5 h-5" />
          <span className="font-bold uppercase tracking-widest text-xs hidden sm:block">{t("App", "App")}</span>
        </button>

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

      {isDark && (
        <>
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#c81474]/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        </>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`backdrop-blur-xl border rounded-3xl p-10 max-w-md w-full shadow-2xl relative z-10 overflow-hidden ${isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white/90 border-gray-200"}`}
      >
        {/* LOGO DE FONDO COMO MARCA DE AGUA */}
        <div className={`absolute inset-0 z-0 pointer-events-none ${isDark ? "opacity-[0.03]" : "opacity-10"}`}>
          <img 
            src="/logo.png" 
            alt="WEEF Background" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-[#c81474] to-purple-500 tracking-widest uppercase mb-2 mt-4">
              {t("Acceso", "Login")}
            </h1>
            <p className={isDark ? "text-neutral-300 font-medium drop-shadow-md" : "text-gray-600 font-medium"}>
              {t("Ingresa tus credenciales para continuar", "Enter your credentials to continue")}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6 flex items-center space-x-3 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-bold mb-2 ml-1 ${isDark ? "text-neutral-200 drop-shadow-md" : "text-gray-700"}`}>
                {t("Usuario / Documento", "Username / Document")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className={`w-5 h-5 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full border rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-[#c81474] transition-colors ${isDark ? "bg-neutral-950/80 border-neutral-700 text-white" : "bg-white/80 border-gray-300 text-gray-900"}`}
                  placeholder={t("Ej. 123456789", "e.g. 123456789")}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-bold mb-2 ml-1 ${isDark ? "text-neutral-200 drop-shadow-md" : "text-gray-700"}`}>
                {t("Contraseña", "Password")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`w-5 h-5 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full border rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:border-[#c81474] transition-colors ${isDark ? "bg-neutral-950/80 border-neutral-700 text-white" : "bg-white/80 border-gray-300 text-gray-900"}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors hover:text-[#c81474] ${isDark ? "text-neutral-400" : "text-gray-400"}`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(200,20,116,0.3)] text-white font-bold bg-linear-to-r from-[#c81474] to-purple-600 hover:from-[#a61060] hover:to-purple-500 transition-all uppercase tracking-widest disabled:opacity-50 mt-4"
            >
              {loading ? (
                <span>{t("Iniciando...", "Logging in...")}</span>
              ) : (
                <>
                  <span>{t("Ingresar", "Login")}</span>
                  <LogIn className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>

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
                <p>1. {t("Toca el icono de Compartir", "Tap the Share icon")} <Download className="inline w-4 h-4 mx-1"/> {t("en el menú inferior.", "in the bottom menu.")}</p>
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

export default function LoginPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center">
          <div className="w-12 h-12 border-4 border-[#c81474] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}