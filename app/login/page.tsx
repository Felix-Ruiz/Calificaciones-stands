"use client";

import { useState, Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, User, Lock, LogIn, AlertCircle, Globe } from "lucide-react";
import { motion } from "framer-motion";

function LoginContent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // ESTADO DE IDIOMA: Por defecto en Inglés ("en")
  const [language, setLanguage] = useState<"en" | "es">("en");

  const searchParams = useSearchParams();

  useEffect(() => {
    // Al cargar la página, revisamos si ya hay un idioma guardado, sino, forzamos Inglés
    const savedLang = localStorage.getItem("app-lang") as "en" | "es";
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      setLanguage("en");
      localStorage.setItem("app-lang", "en");
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "es" : "en";
    setLanguage(newLang);
    // Guardamos "app-lang" para que el panel de Cliente o Stand herede la decisión
    localStorage.setItem("app-lang", newLang);
  };

  // Función de traducción
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
      // Limpieza de URL para evitar Error 404
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
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* BOTÓN DE IDIOMA (ARRIBA A LA DERECHA) */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={toggleLanguage} 
          className="flex items-center space-x-2 bg-neutral-900 border border-[#c81474]/50 text-[#c81474] px-4 py-2 rounded-full hover:bg-neutral-800 transition-colors shadow-lg"
          title={t("Cambiar Idioma", "Change Language")}
        >
          <Globe className="w-5 h-5" />
          <span className="font-bold uppercase tracking-widest text-sm">{language === "en" ? "EN" : "ES"}</span>
        </button>
      </div>

      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#c81474]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-10 max-w-md w-full shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-400 via-[#c81474] to-purple-500 tracking-widest uppercase mb-2">
            {t("Acceso", "Login")}
          </h1>
          <p className="text-neutral-400">{t("Ingresa tus credenciales para continuar", "Enter your credentials to continue")}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6 flex items-center space-x-3 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-neutral-400 text-sm font-medium mb-2 ml-1">
              {t("Usuario / Documento", "Username / Document")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-neutral-500" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#c81474] transition-colors"
                placeholder={t("Ej. 123456789", "e.g. 123456789")}
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 text-sm font-medium mb-2 ml-1">
              {t("Contraseña", "Password")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-neutral-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none focus:border-[#c81474] transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-[#c81474] transition-colors"
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
      </motion.div>
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