import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';

// TODO: Replace with the actual API client call when set up
const fetchMe = async (token: string) => {
  const res = await fetch('http://localhost:3001/api/cv/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error fetching profile: ${errorText}`);
  }
  return res.json();
};

export default function Dashboard() {
  const { session } = useAuth();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['cv', 'me'],
    queryFn: () => fetchMe(session?.access_token || ''),
    enabled: !!session?.access_token
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800 pb-5">
        <h3 className="text-2xl font-bold leading-6 text-white">Dashboard</h3>
        <p className="mt-2 max-w-4xl text-sm text-zinc-400">
          Bienvenido a tu panel de control. Desde aquí podrás gestionar y previsualizar tu currículum.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm backdrop-blur-xl">
        <h4 className="text-lg font-medium text-white mb-4">Estado de la Conexión Backend</h4>
        
        {isLoading ? (
          <div className="flex items-center gap-3 text-zinc-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
            Verificando conexión segura con el backend...
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-500 border border-red-500/20">
            Error al conectar con la API: {error.message}
          </div>
        ) : (
          <div className="rounded-lg bg-emerald-500/10 p-4 border border-emerald-500/20">
            <div className="flex items-start gap-3">
              <div className="text-emerald-500">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-emerald-500">Conexión Exitosa</h3>
                <div className="mt-2 text-sm text-emerald-500/80">
                  <p>El token JWT viaja correctamente. Respuesta del servidor:</p>
                  <pre className="mt-2 overflow-x-auto rounded bg-zinc-950 p-2 text-xs text-zinc-300">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
