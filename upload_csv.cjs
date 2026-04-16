const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

// Para correr este script:
// 1. Guarda tu CSV como "instaladores.csv" en esta misma carpeta.
// 2. Ejecuta en tu terminal:
// SUPABASE_URL=tu_url SUPABASE_SERVICE_KEY=tu_service_key node upload_csv.cjs

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Faltan las credenciales.');
  console.error('Uso: SUPABASE_URL="tu_url" SUPABASE_SERVICE_KEY="tu_key" node upload_csv.cjs\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const results = [];

async function uploadToSupabase(dataBatch) {
  const { error } = await supabase
    .from('installers')
    .upsert(dataBatch, { onConflict: 'rut' }); // Upsert para no duplicar instaladores si corres el script 2 veces

  if (error) {
    console.error('❌ Error cargando un lote:', error);
  } else {
    console.log(`✅ Lote de ${dataBatch.length} registros cargado exitosamente.`);
  }
}

async function startUpload() {
  const BATCH_SIZE = 500;
  let batch = [];

  console.log('⏳ Leyendo archivo instaladores.csv...');

  if (!fs.existsSync('instaladores.csv')) {
    console.error('❌ No se encontró el archivo "instaladores.csv". Crea uno en la raíz del proyecto para empezar.');
    process.exit(1);
  }

  fs.createReadStream('instaladores.csv')
    .pipe(csv())
    .on('data', (data) => {
      // Mapea las columnas de tu CSV a los nombres de las columnas de tu schema
      // AVISO: Ajusta 'data.Nombre_Columna_CSV' según cómo vengan las cabeceras en tu archivo oficial SEC
      
      const installer = {
        nombres: data['nombres'] || data['Nombres'] || 'Sin Nombre',
        apellidos: data['apellidos'] || data['Apellidos'] || 'Sin Apellido',
        rut: data['rut'] || data['RUT'] || data['Rut'] || `NO-RUT-${Math.random()}`,
        region: data['region_comercial'] || data['Region'] || 'Metropolitana',
        comuna: data['comuna_comercial'] || data['Comuna'] || 'Santiago',
        tipo_trabajo: data['ambito'] ? [data['ambito'].toLowerCase()] : ['electricidad'], 
        telefono: data['celular'] || data['telefono_fijo'] || data['Telefono'] || null,
        bio: 'Instalador certificado SEC.',
        is_premium: false,
        is_verified: false
      };

      batch.push(installer);

      // Subir en lotes para no saturar Supabase ni la memoria
      if (batch.length >= BATCH_SIZE) {
        uploadToSupabase([...batch]);
        batch = [];
      }
    })
    .on('end', async () => {
      // Subir cualquier remanente que quedó en el último lote
      if (batch.length > 0) {
        await uploadToSupabase(batch);
      }
      console.log('🎉 Finalizó la lectura y carga del CSV.');
    });
}

startUpload();
