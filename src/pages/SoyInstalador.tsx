import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { Search, Upload, CheckCircle } from 'lucide-react';

export default function SoyInstalador() {
  const [searchParams] = useSearchParams();
  const initialRut = searchParams.get('rut') || '';
  
  const [step, setStep] = useState(initialRut ? 2 : 1);
  const [searchQuery, setSearchQuery] = useState(initialRut);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedInstaller, setSelectedInstaller] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Auth & Claim state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Step 1: Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Search by RUT or Name
      const { data, error } = await supabase
        .from('installers')
        .select('*')
        .or(`rut.ilike.%${searchQuery}%,nombres.ilike.%${searchQuery}%,apellidos.ilike.%${searchQuery}%`)
        .limit(5);
        
      if (error) throw error;
      setSearchResults(data || []);
      
      if (data?.length === 0) {
        setError('No encontramos ningún instalador con esos datos.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectInstaller = (installer: any) => {
    if (installer.claim_status !== 'unclaimed') {
      setError('Este perfil ya ha sido reclamado o está en proceso.');
      return;
    }
    setSelectedInstaller(installer);
    setStep(2);
    setError('');
  };

  // Step 2: Auth & Upload
  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !file || !selectedInstaller) {
      setError('Por favor completa todos los campos y sube tu carnet.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // 1. Sign up or Sign in
      let userId;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (authError) {
        // If user exists, try to sign in
        if (authError.message.includes('already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) throw signInError;
          userId = signInData.user?.id;
        } else {
          throw authError;
        }
      } else {
        userId = authData.user?.id;
      }
      
      if (!userId) throw new Error('Error de autenticación');

      // 2. Upload ID to private bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('identity-docs')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      // 3. Create claim request
      const { error: claimError } = await supabase
        .from('claim_requests')
        .insert({
          installer_id: selectedInstaller.id,
          user_id: userId,
          carnet_url: fileName,
          status: 'pending'
        });
        
      if (claimError) throw claimError;
      
      // 4. Update installer status
      const { error: updateError } = await supabase
        .from('installers')
        .update({ claim_status: 'pending' })
        .eq('id', selectedInstaller.id);
        
      if (updateError) throw updateError;
      
      // Success!
      setSuccess(true);
      setStep(3);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al procesar tu solicitud.');
    } finally {
      setLoading(false);
    }
  };

  // If initialRut is provided, fetch that installer directly
  useEffect(() => {
    if (initialRut && step === 2 && !selectedInstaller) {
      const fetchInstaller = async () => {
        const { data } = await supabase.from('installers').select('*').eq('id', initialRut).single();
        if (data) setSelectedInstaller(data);
      };
      fetchInstaller();
    }
  }, [initialRut, step, selectedInstaller]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Helmet>
        <title>Soy Instalador - Busca Tu Maestro</title>
      </Helmet>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4">Reclama tu perfil profesional</h1>
        <p className="text-zinc-400">Toma el control de tu presencia online, recibe reseñas y consigue más clientes.</p>
      </div>

      <div className="bg-vcard border border-vborder rounded-3xl p-6 md:p-10 shadow-xl">
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Search */}
        {step === 1 && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-semibold mb-6">Paso 1: Encuentra tu perfil</h2>
            <form onSubmit={handleSearch} className="flex gap-2 mb-8">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ingresa tu RUT o Nombre..."
                className="flex-1 bg-vbg border border-vborder rounded-xl p-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-vorange transition-colors"
              />
              <button 
                type="submit"
                disabled={loading || !searchQuery}
                className="bg-zinc-800 hover:bg-zinc-700 text-white p-4 rounded-xl transition-colors disabled:opacity-50"
              >
                <Search className="w-6 h-6" />
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-500 mb-2">Resultados encontrados:</p>
                {searchResults.map((inst) => (
                  <div key={inst.id} className="flex items-center justify-between p-4 bg-vbg border border-vborder rounded-xl">
                    <div>
                      <div className="font-medium">{inst.nombres} {inst.apellidos}</div>
                      <div className="text-sm text-zinc-500">RUT: {inst.rut} • {inst.comuna}</div>
                    </div>
                    <button
                      onClick={() => selectInstaller(inst)}
                      className="text-vorange hover:text-orange-400 font-medium text-sm px-4 py-2 border border-vorange/30 rounded-lg hover:bg-vorange/10 transition-colors"
                    >
                      Es mi perfil
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Auth & Upload */}
        {step === 2 && selectedInstaller && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Paso 2: Verifica tu identidad</h2>
              <button onClick={() => setStep(1)} className="text-sm text-zinc-500 hover:text-zinc-300">Cambiar perfil</button>
            </div>
            
            <div className="bg-vbg p-4 rounded-xl border border-vborder mb-8">
              <div className="text-sm text-zinc-500 mb-1">Perfil seleccionado:</div>
              <div className="font-medium text-lg">{selectedInstaller.nombres} {selectedInstaller.apellidos}</div>
              <div className="text-zinc-400">{selectedInstaller.rut}</div>
            </div>

            <form onSubmit={handleClaim} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-zinc-300">Crea tu cuenta de acceso</h3>
                <div>
                  <label className="block text-sm text-zinc-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-vbg border border-vborder rounded-xl p-3 text-zinc-100 focus:border-vorange outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-500 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-vbg border border-vborder rounded-xl p-3 text-zinc-100 focus:border-vorange outline-none"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-vborder">
                <h3 className="font-medium text-zinc-300 mb-4">Sube tu Carnet de Identidad</h3>
                <p className="text-sm text-zinc-500 mb-4">Para proteger a nuestros usuarios, necesitamos verificar que eres el titular de este perfil. Sube una foto de tu carnet (solo por el frente).</p>
                
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-vborder border-dashed rounded-xl cursor-pointer hover:bg-zinc-800/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                    <p className="text-sm text-zinc-400">
                      {file ? <span className="text-vorange font-medium">{file.name}</span> : 'Haz clic para subir imagen'}
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-vorange hover:bg-orange-500 text-black font-bold py-4 rounded-xl transition-colors mt-8 disabled:opacity-50"
              >
                {loading ? 'Enviando solicitud...' : 'Enviar solicitud de verificación'}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">¡Solicitud enviada con éxito!</h2>
            <p className="text-zinc-400 mb-8">
              Nuestro equipo revisará tu identidad en un plazo de 24-48 horas. Te notificaremos por email cuando tu perfil esté aprobado.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-8 rounded-xl transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
