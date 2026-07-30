"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, User, Lock, LogIn, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

function LoginContent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const searchParams = useSearchParams();

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
      setError("Usuario o contraseña incorrectos");
      setLoading(false);
    } else {
      // SOLUCIÓN AL 404: Limpieza absoluta de la URL
      const rawCallback = searchParams.get("callbackUrl");
      let finalUrl = "/";

      if (rawCallback) {
        try {
          // Si es una URL completa (http...), extraemos solo la ruta (ej. /calificar/123)
          if (rawCallback.startsWith("http")) {
            const urlObj = new URL(rawCallback);
            finalUrl = urlObj.pathname + urlObj.search;
          } else {
            finalUrl = rawCallback;
          }
        } catch (err) {
          finalUrl = rawCallback; // Fallback
        }
      }
      
      // Forzamos una carga limpia desde el navegador para evitar el 404 de la caché
      window.location.href = finalUrl;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-10 max-w-md w-full shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-400 via-fuchsia-500 to-purple-500 tracking-widest uppercase mb-2">
            Acceso
          </h1>
          <p className="text-neutral-400">Ingresa tus credenciales para continuar</p>
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
              Usuario / Documento
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
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                placeholder="Ej. 123456789"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 text-sm font-medium mb-2 ml-1">
              Contraseña
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
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-fuchsia-400 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.3)] text-white font-bold bg-linear-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 transition-all uppercase tracking-widest disabled:opacity-50 mt-4"
          >
            {loading ? (
              <span>Iniciando...</span>
            ) : (
              <>
                <span>Ingresar</span>
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
          <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}