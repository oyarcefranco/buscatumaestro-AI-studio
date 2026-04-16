import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { Star, MapPin, Zap, Flame, CheckCircle, Phone } from 'lucide-react';

interface Installer {
  id: string;
  nombres: string;
  apellidos: string;
  region: string;
  comuna: string;
  tipo_trabajo: string[];
  is_premium: boolean;
  is_verified: boolean;
  avg_rating: number | null;
  review_count: number;
  claim_status: string;
  telefono: string | null;
}

export default function Resultados() {
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get('tipo');
  const region = searchParams.get('region');
  const comuna = searchParams.get('comuna');
  
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchInstallers(true);
  }, [tipo, region, comuna]);

  const fetchInstallers = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 0 : page;
      
      let query = supabase
        .from('installers')
        .select('*')
        .order('is_premium', { ascending: false })
        .order('avg_rating', { ascending: false, nullsFirst: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (tipo) query = query.contains('tipo_trabajo', [tipo]);
      if (region) query = query.eq('region', region);
      if (comuna) query = query.eq('comuna', comuna);

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        setInstallers(prev => reset ? data : [...prev, ...data]);
        setHasMore(data.length === PAGE_SIZE);
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error('Error fetching installers:', error);
    } finally {
      setLoading(false);
    }
  };

  const title = `Instaladores ${tipo === 'electricidad' ? 'eléctricos' : tipo === 'gas' ? 'de gas' : ''} en ${comuna || region || 'Chile'}`;

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
      <Helmet>
        <title>{title} - Busca Tu Maestro</title>
      </Helmet>

      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {tipo && <span className="bg-vorange/10 text-vorange px-3.5 py-1.5 rounded-full text-[0.85rem] font-semibold capitalize">{tipo}</span>}
          {region && <span className="bg-vorange/10 text-vorange px-3.5 py-1.5 rounded-full text-[0.85rem] font-semibold">{region}</span>}
          {comuna && <span className="bg-vorange/10 text-vorange px-3.5 py-1.5 rounded-full text-[0.85rem] font-semibold">{comuna}</span>}
          {searchParams.get('urgencia') && <span className="bg-vorange/10 text-vorange px-3.5 py-1.5 rounded-full text-[0.85rem] font-semibold">Urgencia 🔥</span>}
        </div>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{title}</h1>
          <span className="text-zinc-400 text-[0.9rem]">{installers.length} Instaladores encontrados</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {installers.map((installer) => (
          <div key={installer.id} className={`bg-vcard border rounded-2xl p-5 relative transition-all ${installer.is_premium ? 'border-vgreen shadow-[0_0_20px_rgba(0,255,136,0.05)]' : 'border-vborder'}`}>
            {installer.is_premium && installer.is_verified ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase mb-3 bg-vgreen/10 text-vgreen">
                ✓ Verificado SEC
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase mb-3 bg-white/10 text-zinc-400">
                No Verificado
              </span>
            )}

            <div className="flex justify-between items-start mb-3">
              <h2 className="text-[1.25rem] font-bold leading-tight">{installer.nombres} {installer.apellidos}</h2>
              <div className="flex items-center gap-1 text-[#ffd700] font-semibold whitespace-nowrap ml-2">
                ★ {installer.avg_rating || 'Nuevo'}
                <span className="text-zinc-400 text-[0.7rem] font-normal">({installer.review_count})</span>
              </div>
            </div>

            <div className="text-zinc-400 text-[0.85rem] mb-5 line-clamp-2 min-h-[2.5rem]">
              {installer.bio || `Especialista en ${installer.tipo_trabajo.join(' y ')} en ${installer.comuna}.`}
            </div>

            <div className="flex gap-3 mt-auto">
              {installer.is_premium && installer.telefono ? (
                <>
                  <a href={`https://wa.me/${installer.telefono.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-vgreen text-black py-2.5 rounded-lg text-[0.85rem] font-semibold text-center hover:bg-[#00cc6d] transition-colors">
                    WhatsApp
                  </a>
                  <Link to={`/perfil/${installer.id}`} className="flex-1 bg-transparent border border-vborder text-white py-2.5 rounded-lg text-[0.85rem] font-semibold text-center hover:bg-zinc-800 transition-colors">
                    Ver Perfil
                  </Link>
                </>
              ) : (
                <Link to={`/perfil/${installer.id}`} className="w-full bg-transparent border border-vborder text-white py-2.5 rounded-lg text-[0.85rem] font-semibold text-center hover:bg-zinc-800 transition-colors">
                  Ver Contacto
                </Link>
              )}
            </div>

            {installer.claim_status === 'unclaimed' && (
              <Link to={`/soy-instalador?rut=${installer.id}`} className="block mt-4 bg-[#202025] border border-dashed border-[#3f3f46] rounded-xl p-3 text-[0.75rem] text-center text-vblue hover:bg-[#2a2a30] transition-colors">
                ¿Eres tú? Reclama este perfil gratis
              </Link>
            )}
          </div>
        ))}

        {installers.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 bg-vcard border border-vborder rounded-2xl">
            <p className="text-zinc-400 text-lg">No encontramos instaladores con esos criterios.</p>
            <button onClick={() => window.history.back()} className="mt-4 text-vorange hover:text-orange-400">Volver a buscar</button>
          </div>
        )}
      </div>

      {hasMore && installers.length > 0 && (
        <div className="text-center pt-8">
          <button 
            onClick={() => fetchInstallers()}
            disabled={loading}
            className="bg-transparent border border-vborder text-zinc-400 hover:text-white font-medium py-3 px-8 rounded-full transition-colors disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Ver más resultados'}
          </button>
        </div>
      )}
    </div>
  );
}
