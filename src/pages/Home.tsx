import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Zap, Flame, AlertTriangle, MapPin, Search, Star, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const REGIONES = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso',
  'Metropolitana', 'O\'Higgins', 'Maule', 'Ñuble', 'Biobío', 'Araucanía', 'Los Ríos',
  'Los Lagos', 'Aysén', 'Magallanes'
];

// Simplified comunas for MVP
const COMUNAS_POR_REGION: Record<string, string[]> = {
  'Metropolitana': ['Santiago', 'Providencia', 'Las Condes', 'Ñuñoa', 'Maipú', 'Puente Alto', 'La Florida'],
  'Valparaíso': ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'Concón'],
  'Biobío': ['Concepción', 'Talcahuano', 'San Pedro de la Paz', 'Chiguayante'],
  // Add others as needed or use a full list
};

interface Installer {
  id: string;
  nombres: string;
  apellidos: string;
  comuna: string;
  tipo_trabajo: string[];
  is_premium: boolean;
  is_verified: boolean;
  avg_rating: number | null;
  review_count: number;
}

export default function Home() {
  const navigate = useNavigate();
  const [tipoTrabajo, setTipoTrabajo] = useState('');
  const [esUrgencia, setEsUrgencia] = useState(false);
  const [region, setRegion] = useState('');
  const [comuna, setComuna] = useState('');

  const [stats, setStats] = useState({ electricistas: 0, gasfiters: 0 });
  const [featured, setFeatured] = useState<Installer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stats
        const { count: countElec } = await supabase
          .from('installers')
          .select('*', { count: 'exact', head: true })
          .contains('tipo_trabajo', ['electricidad']);
          
        const { count: countGas } = await supabase
          .from('installers')
          .select('*', { count: 'exact', head: true })
          .contains('tipo_trabajo', ['gas']);

        setStats({
          electricistas: countElec || 0,
          gasfiters: countGas || 0
        });

        // Fetch featured (premium)
        const { data: featuredData } = await supabase
          .from('installers')
          .select('id, nombres, apellidos, comuna, tipo_trabajo, is_premium, is_verified, avg_rating, review_count')
          .eq('is_premium', true)
          .order('avg_rating', { ascending: false, nullsFirst: false })
          .limit(3);

        if (featuredData) {
          setFeatured(featuredData);
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (tipoTrabajo) params.append('tipo', tipoTrabajo);
    if (esUrgencia) params.append('urgencia', 'true');
    if (region) params.append('region', region);
    if (comuna) params.append('comuna', comuna);
    navigate(`/resultados?${params.toString()}`);
  };

  return (
    <div className="flex-1 w-full">
      <Helmet>
        <title>Busca Tu Maestro - Directorio de Instaladores SEC</title>
        <meta name="description" content="Directorio de instaladores eléctricos y de gas certificados por la SEC en todo Chile." />
      </Helmet>

      {/* Hero Section */}
      <section className="pt-16 pb-12 md:pt-24 md:pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              El directorio de <span className="text-vorange">maestros</span><br className="hidden md:block" /> certificados en Chile
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto">
              Encuentra instaladores eléctricos y de gas verificados por la SEC cerca de tu zona, lee reseñas reales y contáctalos directamente.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-vcard border border-vborder rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row gap-4 items-end max-w-5xl mx-auto">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-zinc-400 mb-2 pl-1">Especialidad</label>
              <select 
                value={tipoTrabajo} 
                onChange={(e) => setTipoTrabajo(e.target.value)}
                className="w-full bg-vbg border border-vborder rounded-xl p-3.5 text-white focus:border-vorange outline-none appearance-none cursor-pointer"
              >
                <option value="">Todas las especialidades</option>
                <option value="electricidad">Electricidad</option>
                <option value="gas">Gas</option>
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-zinc-400 mb-2 pl-1">Región</label>
              <select 
                value={region} 
                onChange={(e) => { setRegion(e.target.value); setComuna(''); }}
                className="w-full bg-vbg border border-vborder rounded-xl p-3.5 text-white focus:border-vorange outline-none appearance-none cursor-pointer"
              >
                <option value="">Todas las regiones</option>
                {REGIONES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-zinc-400 mb-2 pl-1">Comuna</label>
              <select 
                value={comuna} 
                onChange={(e) => setComuna(e.target.value)}
                disabled={!region}
                className="w-full bg-vbg border border-vborder rounded-xl p-3.5 text-white focus:border-vorange outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="">Todas las comunas</option>
                {(COMUNAS_POR_REGION[region] || []).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto pb-4 md:px-2">
              <input 
                type="checkbox" 
                id="urgencia" 
                checked={esUrgencia} 
                onChange={(e) => setEsUrgencia(e.target.checked)}
                className="w-5 h-5 accent-vorange cursor-pointer rounded"
              />
              <label htmlFor="urgencia" className="text-sm font-medium text-zinc-300 flex items-center gap-1 cursor-pointer whitespace-nowrap">
                <AlertTriangle className="w-4 h-4 text-vorange" /> Urgencia
              </label>
            </div>
            <button type="submit" className="w-full md:w-auto bg-vorange hover:bg-orange-500 text-black font-bold py-3.5 px-8 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Search className="w-5 h-5" /> Buscar
            </button>
          </form>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-5xl mx-auto">
            <div className="bg-vbg border border-vborder rounded-2xl p-6 text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-vorange mb-1">{stats.electricistas}</div>
              <div className="text-sm text-zinc-400">Electricistas SEC</div>
            </div>
            <div className="bg-vbg border border-vborder rounded-2xl p-6 text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-vblue mb-1">{stats.gasfiters}</div>
              <div className="text-sm text-zinc-400">Instaladores de Gas</div>
            </div>
            <div className="bg-vbg border border-vborder rounded-2xl p-6 text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-vgreen mb-1">100%</div>
              <div className="text-sm text-zinc-400">Perfiles Verificados</div>
            </div>
            <div className="bg-vbg border border-vborder rounded-2xl p-6 text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-[#ffd700] mb-1">24/7</div>
              <div className="text-sm text-zinc-400">Atención de Urgencias</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      {!loading && featured.length > 0 && (
        <section className="py-16 bg-black border-t border-vborder px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">Instaladores Destacados</h2>
                <p className="text-zinc-400">Los profesionales mejor evaluados por la comunidad.</p>
              </div>
              <Link to="/resultados" className="hidden md:flex items-center gap-2 text-vorange hover:text-orange-400 font-medium transition-colors">
                Ver directorio completo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map(installer => (
                <div key={installer.id} className="bg-vcard border border-vgreen shadow-[0_0_20px_rgba(0,255,136,0.05)] rounded-2xl p-6 relative transition-all hover:-translate-y-1 flex flex-col">
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-vgreen/10 text-vgreen">
                      ✓ Verificado SEC
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{installer.nombres} {installer.apellidos}</h3>
                  <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
                    <MapPin className="w-4 h-4" /> {installer.comuna}
                  </div>
                  <div className="flex items-center gap-2 mb-6">
                    {installer.tipo_trabajo.includes('electricidad') && <span className="bg-vbg border border-vborder px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> Electricidad</span>}
                    {installer.tipo_trabajo.includes('gas') && <span className="bg-vbg border border-vborder px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1"><Flame className="w-3 h-3 text-vorange" /> Gas</span>}
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-5 border-t border-vborder">
                    <div className="flex items-center gap-1 text-[#ffd700] font-bold text-lg">
                      <Star className="w-5 h-5 fill-current" /> {installer.avg_rating || 'Nuevo'}
                      <span className="text-zinc-500 text-xs font-normal ml-1">({installer.review_count})</span>
                    </div>
                    <Link to={`/perfil/${installer.id}`} className="text-sm font-semibold text-white hover:text-vorange transition-colors">
                      Ver perfil &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            <Link to="/resultados" className="md:hidden flex items-center justify-center gap-2 text-vorange hover:text-orange-400 font-medium mt-8 bg-vorange/10 py-4 rounded-xl transition-colors">
              Ver directorio completo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-gradient-to-br from-[#202025] to-vbg border border-vborder rounded-3xl p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">¿Eres instalador certificado SEC?</h2>
              <p className="text-zinc-400 max-w-xl text-lg">Únete al directorio más grande de Chile. Reclama tu perfil gratis, recibe reseñas de tus clientes y consigue más trabajos.</p>
            </div>
            <Link to="/soy-instalador" className="bg-transparent border-2 border-vblue text-vblue hover:bg-vblue hover:text-black font-bold py-4 px-8 rounded-xl whitespace-nowrap transition-all text-lg">
              Reclamar mi perfil
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
