import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { LogOut, Share2, Star, Edit2, Save, X } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [installer, setInstaller] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ telefono: '', bio: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/soy-instalador');
        return;
      }
      setUser(user);
      fetchDashboardData(user.id);
    } catch (error) {
      console.error(error);
      navigate('/soy-instalador');
    }
  };

  const fetchDashboardData = async (userId: string) => {
    try {
      // Get installer profile
      const { data: installerData, error: installerError } = await supabase
        .from('installers')
        .select('*')
        .eq('claimed_by', userId)
        .single();

      if (installerError) throw installerError;
      
      setInstaller(installerData);
      setEditData({
        telefono: installerData.telefono || '',
        bio: installerData.bio || ''
      });

      // Get reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('installer_id', installerData.id)
        .order('created_at', { ascending: false });

      setReviews(reviewsData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('installers')
        .update({
          telefono: editData.telefono,
          bio: editData.bio
        })
        .eq('id', installer.id);

      if (error) throw error;
      
      setInstaller({ ...installer, ...editData });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const shareReviewLink = () => {
    const url = `${window.location.origin}/r/${installer.id}`;
    const text = `Hola, gracias por confiar en mí. Si quedaste conforme con mi trabajo, te agradecería mucho dejarme una reseña aquí: ${url} 🙏`;
    
    // Try Web Share API first
    if (navigator.share) {
      navigator.share({
        title: 'Déjame una reseña',
        text: text,
      }).catch(console.error);
    } else {
      // Fallback to WhatsApp
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando dashboard...</div>;

  if (!installer) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Perfil no encontrado</h2>
        <p className="text-zinc-400 mb-8">No tienes un perfil de instalador asociado a esta cuenta o tu solicitud aún está pendiente de aprobación.</p>
        <button onClick={handleLogout} className="text-vorange hover:underline">Cerrar sesión</button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Helmet>
        <title>Mi Panel - Busca Tu Maestro</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mi Panel</h1>
          <p className="text-zinc-400">Hola, {installer.nombres}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate(`/perfil/${installer.id}`)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Ver mi perfil público
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-zinc-400 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-zinc-800 hover:border-zinc-700"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </div>

      {installer.claim_status === 'pending' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-xl mb-8 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          Tu solicitud de verificación está en revisión. Algunas funciones pueden estar limitadas.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile Data */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-vcard border border-vborder rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Mis Datos</h2>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="text-vorange hover:text-orange-400 p-2">
                  <Edit2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="text-zinc-500 hover:text-zinc-300 p-2">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={handleSave} disabled={saving} className="text-green-500 hover:text-green-400 p-2">
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Teléfono de contacto</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editData.telefono} 
                    onChange={(e) => setEditData({...editData, telefono: e.target.value})}
                    className="w-full bg-vbg border border-vborder rounded-lg p-2 text-sm focus:border-vorange outline-none"
                    placeholder="+569..."
                  />
                ) : (
                  <div className="font-medium">{installer.telefono || 'No configurado'}</div>
                )}
              </div>
              
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Sobre mí (Bio)</label>
                {isEditing ? (
                  <textarea 
                    value={editData.bio} 
                    onChange={(e) => setEditData({...editData, bio: e.target.value})}
                    className="w-full bg-vbg border border-vborder rounded-lg p-2 text-sm focus:border-vorange outline-none min-h-[100px] resize-none"
                    placeholder="Describe tu experiencia..."
                  />
                ) : (
                  <div className="text-sm text-zinc-300">{installer.bio || 'Sin descripción'}</div>
                )}
              </div>

              <div className="pt-4 border-t border-vborder">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-500">Estado de cuenta</span>
                  <span className={installer.is_premium ? 'text-vorange font-medium' : 'text-zinc-300'}>
                    {installer.is_premium ? 'Premium' : 'Gratuita'}
                  </span>
                </div>
                {!installer.is_premium && (
                  <button className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 text-sm py-2 rounded-lg transition-colors">
                    Mejorar a Premium
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Share Review Card */}
          <div className="bg-gradient-to-br from-vorange/20 to-vorange/5 border border-vorange/20 rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-2 text-vorange">Consigue más reseñas</h3>
            <p className="text-sm text-zinc-400 mb-4">Envíale este link a tus clientes por WhatsApp después de un trabajo.</p>
            <button 
              onClick={shareReviewLink}
              className="w-full bg-vorange hover:bg-orange-500 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-4 h-4" /> Compartir Link
            </button>
          </div>
        </div>

        {/* Right Column: Reviews */}
        <div className="lg:col-span-2">
          <div className="bg-vcard border border-vborder rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Mis Reseñas</h2>
              <div className="flex items-center gap-2 bg-vbg px-3 py-1.5 rounded-lg border border-vborder">
                <Star className="w-4 h-4 text-[#ffd700] fill-current" />
                <span className="font-bold">{installer.avg_rating || '0.0'}</span>
                <span className="text-zinc-500 text-sm">({installer.review_count})</span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-vborder rounded-xl">
                <p className="text-zinc-500">Aún no tienes reseñas.</p>
                <button onClick={shareReviewLink} className="text-vorange text-sm mt-2 hover:underline">
                  Pídele a un cliente que te evalúe
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-vbg border border-vborder rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{review.reviewer_name || 'Cliente anónimo'}</div>
                        <div className="text-xs text-zinc-500">{new Date(review.created_at).toLocaleDateString('es-CL')}</div>
                      </div>
                      <div className="flex text-[#ffd700]">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.stars ? 'fill-current' : 'text-zinc-800'}`} />
                        ))}
                      </div>
                    </div>
                    {review.comentario && (
                      <p className="text-sm text-zinc-300 mt-2">{review.comentario}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
