import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { Star } from 'lucide-react';

export default function ReviewForm() {
  const { installerId } = useParams<{ installerId: string }>();
  const navigate = useNavigate();
  const [installerName, setInstallerName] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [comentario, setComentario] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInstaller = async () => {
      try {
        const { data, error } = await supabase
          .from('installers')
          .select('nombres, apellidos')
          .eq('id', installerId)
          .single();
          
        if (error) throw error;
        if (data) setInstallerName(`${data.nombres} ${data.apellidos}`);
      } catch (err) {
        console.error(err);
        setError('No pudimos encontrar a este instalador.');
      } finally {
        setLoading(false);
      }
    };
    
    if (installerId) fetchInstaller();
  }, [installerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) {
      setError('Por favor selecciona una calificación.');
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      // In a real app, we would hash the IP in an Edge Function.
      // For MVP, we'll just insert directly.
      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          installer_id: installerId,
          stars,
          comentario,
          reviewer_name: reviewerName || 'Cliente anónimo',
          ip_hash: 'mock_ip_hash_' + Math.random() // Mock IP hash for MVP
        });

      if (insertError) throw insertError;
      
      // Redirect back to profile
      navigate(`/perfil/${installerId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al enviar la reseña.');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Helmet>
        <title>Dejar reseña - Busca Tu Maestro</title>
      </Helmet>

      <div className="w-full max-w-md bg-vcard border border-vborder rounded-3xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold mb-2 text-center">Califica tu experiencia</h1>
        <p className="text-zinc-400 text-center mb-8">
          Con <span className="font-semibold text-zinc-200">{installerName}</span>
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <label className="text-sm font-medium text-zinc-400">Calificación</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStars(star)}
                  onMouseEnter={() => setHoverStars(star)}
                  onMouseLeave={() => setHoverStars(0)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star 
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoverStars || stars) 
                        ? 'fill-yellow-500 text-yellow-500' 
                        : 'text-zinc-700'
                    }`} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="comentario" className="block text-sm font-medium text-zinc-400 mb-2">
              Comentario (opcional)
            </label>
            <textarea
              id="comentario"
              rows={4}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="¿Cómo fue el servicio? ¿Lo recomendarías?"
              className="w-full bg-vbg border border-vborder rounded-xl p-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-vorange focus:ring-1 focus:ring-vorange transition-all resize-none"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-2">
              Tu nombre (opcional)
            </label>
            <input
              id="name"
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="Ej: María S."
              className="w-full bg-vbg border border-vborder rounded-xl p-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-vorange focus:ring-1 focus:ring-vorange transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || stars === 0}
            className="w-full bg-vorange hover:bg-orange-500 text-black font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Enviando...' : 'Publicar reseña'}
          </button>
          
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full text-zinc-500 hover:text-zinc-300 text-sm py-2 transition-colors"
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}
