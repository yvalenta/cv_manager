import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (loading) return null;
  if (session) return <Navigate to="/dashboard" replace />;

  const handleAuth = async (e: React.FormEvent, type: 'signin' | 'signup') => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { error: authError } = type === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-zinc-950 text-zinc-50 font-sans">
      {/* Form Section */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-16 lg:w-1/2 xl:px-32 relative z-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/20 text-white">
              <FileText size={22} />
            </div>
            <span className="text-2xl font-bold tracking-tight">CV Manager AI</span>
          </div>

          <h1 className="mb-2 text-3xl font-bold tracking-tight">Bienvenido</h1>
          <p className="mb-8 text-zinc-400">
            Ingresa a tu cuenta para gestionar y generar tu CV con Inteligencia Artificial.
          </p>

          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300" htmlFor="email">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="tu@correo.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500 border border-red-500/20">
                {error}
              </div>
            )}

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={(e) => handleAuth(e, 'signin')}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Iniciar Sesión'}
              </button>
              
              <button
                type="button"
                onClick={(e) => handleAuth(e, 'signup')}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-lg border border-zinc-800 bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 transition-all"
              >
                Crear nueva cuenta
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Visual Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 items-center justify-center overflow-hidden border-l border-zinc-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0,rgba(0,0,0,0)_100%)]"></div>
        <div className="relative z-10 flex flex-col items-center max-w-lg text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-800/50 border border-zinc-700/50 backdrop-blur-xl shadow-2xl">
            <Sparkles className="text-indigo-400" size={36} />
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white mb-4">
            Tu currículum perfecto,<br />potenciado por IA
          </h2>
          <p className="text-lg text-zinc-400">
            Importa tus datos fácilmente y genera un PDF profesional en segundos usando los modelos más avanzados de IA.
          </p>
        </div>
      </div>
    </div>
  );
}
