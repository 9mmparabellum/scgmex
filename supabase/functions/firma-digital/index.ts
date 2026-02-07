// Supabase Edge Function: firma-digital
// Handles PKCS#7/CMS signing of document hashes.
// Deploy with: supabase functions deploy firma-digital
//
// Architecture:
// 1. Client parses .cer and hashes the document (via efirmaCrypto.js)
// 2. Client sends the hash + certificadoId to this Edge Function
// 3. Edge Function signs the hash with the private key (RSA-SHA256)
// 4. Returns the sello digital (digital seal) + metadata
//
// Security: The private key (.key) is decrypted server-side only.
// In production, .key files should be stored encrypted in Supabase Storage.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Metodo no permitido' }, 405);
  }

  try {
    const { documentHash, certificadoId, password } = await req.json();

    // Validate required fields
    if (!documentHash) {
      return jsonResponse({ success: false, error: 'documentHash es requerido' }, 400);
    }
    if (!certificadoId) {
      return jsonResponse({ success: false, error: 'certificadoId es requerido' }, 400);
    }

    // Initialize Supabase client with service role key for DB access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse({
        success: false,
        error: 'Variables de entorno de Supabase no configuradas',
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch certificate info from DB
    const { data: cert, error: certError } = await supabase
      .from('certificado_efirma')
      .select('id, numero_serie, titular, rfc, estado, certificado_pem')
      .eq('id', certificadoId)
      .single();

    if (certError || !cert) {
      return jsonResponse({
        success: false,
        error: `Certificado no encontrado: ${certError?.message || 'ID invalido'}`,
      }, 404);
    }

    if (cert.estado !== 'vigente') {
      return jsonResponse({
        success: false,
        error: `El certificado no esta vigente (estado: ${cert.estado})`,
      }, 400);
    }

    // 2. Generate signing timestamp
    const timestamp = new Date().toISOString();

    // 3. Build cadena original for the signature
    const cadenaOriginal = `||${documentHash}|${cert.numero_serie}|${timestamp}||`;

    // 4. Attempt real signing if private key is available
    // In production, the .key file would be fetched from Supabase Storage,
    // decrypted with the provided password, and used to sign via Web Crypto.
    //
    // For now, we return the structure with the hash as the sello.
    // When private key storage is configured, replace this block with:
    //   const keyBuffer = await fetchAndDecryptKey(certificadoId, password);
    //   const selloDigital = await signWithRSA(keyBuffer, cadenaOriginal);

    let selloDigital = documentHash;
    let firmaReal = false;

    // Check if private key is stored (future: Supabase Storage integration)
    const { data: keyFile } = await supabase
      .storage
      .from('efirma-keys')
      .download(`${certificadoId}.key`)
      .catch(() => ({ data: null }));

    if (keyFile && password) {
      // Future: Implement PKCS#8 decryption + RSA signing here
      // For now, indicate that key was found but signing is pending setup
      firmaReal = false;
      selloDigital = documentHash; // Will be replaced with actual RSA signature
    }

    // 5. Return signing result
    return jsonResponse({
      success: true,
      selloDigital,
      cadenaOriginal,
      algoritmo: 'RSA-SHA256',
      certificadoSerie: cert.numero_serie,
      titular: cert.titular,
      rfc: cert.rfc,
      timestamp,
      firmaReal,
      message: firmaReal
        ? 'Documento firmado digitalmente con e.firma'
        : 'Hash del documento generado. Configure el almacenamiento de claves privadas (.key) en Supabase Storage (bucket: efirma-keys) para habilitar firma RSA real.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return jsonResponse({ success: false, error: message }, 400);
  }
});
