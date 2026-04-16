import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { Star, MapPin, Zap, Flame, CheckCircle, Phone, MessageSquare } from 'lucide-react';

interface Installer {
  id: string;
  nombres: string;
  apellidos: string;
  region: string;
  comuna: string;
  tipo_trabajo: string[];
  telefono: string | null;
  bio: string | null;
  fotos_urls: string[];
  is_premium: boolean;
  is_verified: boolean;
  avg_rating: number | null;
  review_count: number;
  claim_status: string;
}

interface Review {
  id: string;
  stars: number;
  comentario: string;
  reviewer_name: string;
  created_at: string;
}

export default function Perfil() {
  const { installerId } = useParams<{ installerId: string }>();
  const [installer, setInstaller] = useState<Installer | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (installerId) {
      fetchData();
    }
  }, [installerId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: installerData, error: installerError } = await supabase
        .from('installers')
        .select('*')
        .eq('id', installerId)
        .single();

      if (installerError) throw installerError;
      setInstaller(installerData);

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('installer_id', installerId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-12 text-center text-zinc-500">Cargando perfil...</div>;
  }

  if (!installer) {
    return <div className="container mx-auto px-4 py-12 text-center text-zinc-500">Instalador no encontrado.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet>
        <title>{`${installer.nombres} ${installer.apellidos} - Busca Tu Maestro`}</title>
      </Helmet>

      {installer.claim_status === 'unclaimed' && (
        <div className="bg-[#202025] border border-dashed border-[#3f3f46] rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-vblue">
            <span className="font-bold">¿Eres tú este instalador?</span> Reclama tu perfil para poder editar tus datos y recibir contactos directos.
          </div>
          <Link to={`/soy-instalador?rut=${installer.id}`} className="bg-transparent border border-vborder text-white font-bold py-2 px-6 rounded-lg whitespace-nowrap transition-colors hover:bg-zinc-800">
            Reclamar Perfil
          </Link>
        </div>
      )}

      <div className="bg-vcard border border-vborder rounded-3xl overflow-hidden mb-8">
        <div className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row gap-8 justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl font-bold">{installer.nombres} {installer.apellidos}</h1>
                {installer.is_premium && installer.is_verified && (
                  <span className="inline-flex items-center gap-1 bg-vgreen/10 text-vgreen text-sm font-extrabold uppercase px-3 py-1 rounded-full">
                    <CheckCircle className="w-4 h-4" /> Verificado SEC
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-6 text-zinc-400 mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-lg">{installer.comuna}, {installer.region}</span>
                </div>
                <div className="flex items-center gap-2">
                  {installer.tipo_trabajo.includes('electricidad') && <Zap className="w-5 h-5 text-yellow-500" />}
                  {installer.tipo_trabajo.includes('gas') && <Flame className="w-5 h-5 text-vorange" />}
                  <span className="text-lg capitalize">{installer.tipo_trabajo.join(' y ')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[#ffd700] mb-8 bg-vbg inline-flex px-4 py-2 rounded-xl border border-vborder">
                <Star className="w-6 h-6 fill-current" />
                <span className="font-bold text-xl text-zinc-100">{installer.avg_rating || 'Nuevo'}</span>
                <span className="text-zinc-500 ml-1">({installer.review_count} reseñas)</span>
              </div>

              {installer.bio && (
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-lg font-semibold text-zinc-200 mb-2">Sobre mí</h3>
                  <p className="text-zinc-400 leading-relaxed">{installer.bio}</p>
                </div>
              )}
            </div>

            <div className="w-full md:w-auto bg-vbg p-6 rounded-2xl border border-vborder flex flex-col gap-4 min-w-[280px]">
              <h3 className="font-semibold text-zinc-200 mb-2">Contacto</h3>
              
              {installer.telefono ? (
                <>
                  <div className="flex items-center gap-3 text-lg font-medium text-zinc-300 bg-vcard p-4 rounded-xl border border-vborder">
                    <Phone className="w-5 h-5 text-zinc-500" />
                    {installer.telefono}
                  </div>
                  
                  {installer.is_premium && (
                    <a 
                      href={`https://wa.me/${installer.telefono.replace(/\+/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-vgreen hover:bg-[#00cc6d] text-black font-bold py-4 px-6 rounded-xl text-center transition-colors flex items-center justify-center gap-2 text-lg"
                    >
                      <MessageSquare className="w-5 h-5" /> Contactar por WhatsApp
                    </a>
                  )}
                </>
              ) : (
                <div className="text-zinc-500 text-sm text-center py-4">
                  Teléfono no disponible
                </div>
              )}
            </div>
          </div>
        </div>

        {installer.is_premium && installer.fotos_urls && installer.fotos_urls.length > 0 && (
          <div className="border-t border-vborder p-8 md:p-10 bg-vcard">
            <h3 className="text-xl font-bold mb-6">Trabajos Anteriores</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {installer.fotos_urls.map((url, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-vbg border border-vborder">
                  <img src={url} alt={`Trabajo ${i+1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-vcard border border-vborder rounded-3xl p-8 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Reseñas de clientes</h2>
          <Link 
            to={`/r/${installer.id}`}
            className="bg-transparent hover:bg-zinc-800 text-white font-medium py-2 px-6 rounded-xl transition-colors border border-vborder"
          >
            Dejar una reseña
          </Link>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 border border-dashed border-vborder rounded-2xl">
            Aún no hay reseñas. ¡Sé el primero en dejar una!
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-vborder last:border-0 pb-6 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-[#ffd700]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.stars ? 'fill-current' : 'text-zinc-700'}`} />
                    ))}
                  </div>
                  <span className="font-medium text-zinc-300 ml-2">{review.reviewer_name || 'Cliente anónimo'}</span>
                  <span className="text-zinc-600 text-sm ml-auto">
                    {new Date(review.created_at).toLocaleDateString('es-CL')}
                  </span>
                </div>
                {review.comentario && (
                  <p className="text-zinc-400 mt-3 leading-relaxed">{review.comentario}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
