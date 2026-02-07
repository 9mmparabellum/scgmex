// Supabase Edge Function: enviar-notificacion
// ---------------------------------------------------------------------------
// Sends email notifications for SCGMEX system events.
// Uses Resend API as the primary email provider with a graceful fallback
// when no API key is configured.
// ---------------------------------------------------------------------------

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'scgmex@sistema.gob.mx';

// ── Types ──────────────────────────────────────────────────────────────────

interface NotificationRequest {
  to: string[];
  subject: string;
  tipo: 'alerta' | 'recordatorio' | 'aprobacion' | 'cierre' | 'vencimiento';
  datos: Record<string, any>;
}

// ── Shared HTML helpers ────────────────────────────────────────────────────

const header = (titulo: string) => `
  <div style="background:#9D2449;color:#fff;padding:20px 24px;text-align:center;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;font-size:20px;font-weight:700;">${titulo}</h1>
  </div>`;

const footer = () => `
  <div style="padding:16px 24px;background:#f0f0f3;border-radius:0 0 8px 8px;text-align:center;">
    <p style="color:#888;font-size:11px;margin:0;">
      Este es un mensaje automatico del <strong>Sistema de Contabilidad Gubernamental (SCGMEX)</strong>.<br/>
      Por favor no responda a este correo.
    </p>
  </div>`;

const wrapper = (content: string) => `
  <div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    ${content}
  </div>`;

const detailsBlock = (detalles: Record<string, any>) => `
  <div style="background:#f8f8fa;padding:14px 18px;border-radius:6px;margin:14px 0;border-left:4px solid #9D2449;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      ${Object.entries(detalles)
        .map(
          ([k, v]) =>
            `<tr><td style="padding:3px 8px 3px 0;color:#666;font-weight:600;white-space:nowrap;">${k}:</td><td style="padding:3px 0;color:#2b2c40;">${v}</td></tr>`,
        )
        .join('')}
    </table>
  </div>`;

// ── Email Templates ────────────────────────────────────────────────────────

const TEMPLATES: Record<string, (datos: any) => string> = {

  // 1. Alerta general del sistema
  alerta: (d) =>
    wrapper(`
      ${header('SCGMEX - Alerta del Sistema')}
      <div style="padding:24px;">
        <h2 style="color:#2b2c40;margin:0 0 12px;">${d.titulo || 'Alerta'}</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;">${d.mensaje || ''}</p>
        ${d.detalles ? detailsBlock(d.detalles) : ''}
      </div>
      ${footer()}
    `),

  // 2. Recordatorio
  recordatorio: (d) =>
    wrapper(`
      ${header('SCGMEX - Recordatorio')}
      <div style="padding:24px;">
        <div style="text-align:center;margin-bottom:16px;">
          <span style="display:inline-block;background:#fff3cd;color:#856404;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;">Recordatorio pendiente</span>
        </div>
        <h2 style="color:#2b2c40;margin:0 0 12px;">${d.titulo || 'Recordatorio'}</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;">${d.mensaje || ''}</p>
        ${d.detalles ? detailsBlock(d.detalles) : ''}
        ${d.fecha_limite ? `<p style="color:#9D2449;font-weight:600;font-size:14px;margin-top:16px;">Fecha limite: ${d.fecha_limite}</p>` : ''}
      </div>
      ${footer()}
    `),

  // 3. Solicitud de aprobacion
  aprobacion: (d) =>
    wrapper(`
      ${header('SCGMEX - Solicitud de Aprobacion')}
      <div style="padding:24px;">
        <div style="text-align:center;margin-bottom:16px;">
          <span style="display:inline-block;background:#e8f5e9;color:#2e7d32;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;">Requiere su aprobacion</span>
        </div>
        <h2 style="color:#2b2c40;margin:0 0 12px;">${d.titulo || 'Aprobacion Requerida'}</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;">${d.mensaje || ''}</p>
        ${d.detalles ? detailsBlock(d.detalles) : ''}
        <div style="text-align:center;margin-top:20px;">
          <p style="color:#888;font-size:12px;">Ingrese al sistema SCGMEX para revisar y aprobar este documento.</p>
        </div>
      </div>
      ${footer()}
    `),

  // 4. Cierre de periodo / ejercicio
  cierre: (d) =>
    wrapper(`
      ${header('SCGMEX - Notificacion de Cierre')}
      <div style="padding:24px;">
        <div style="text-align:center;margin-bottom:16px;">
          <span style="display:inline-block;background:#e3f2fd;color:#1565c0;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;">Cierre completado</span>
        </div>
        <h2 style="color:#2b2c40;margin:0 0 12px;">${d.titulo || 'Cierre Contable'}</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;">${d.mensaje || ''}</p>
        ${d.detalles ? detailsBlock(d.detalles) : ''}
        <div style="background:#f5f5f8;padding:12px 16px;border-radius:6px;margin-top:16px;text-align:center;">
          <p style="color:#2b2c40;font-size:13px;margin:0;">
            <strong>Importante:</strong> Una vez cerrado el periodo, no se podran registrar movimientos contables adicionales sin autorizacion.
          </p>
        </div>
      </div>
      ${footer()}
    `),

  // 5. Vencimiento de certificados / plazos
  vencimiento: (d) =>
    wrapper(`
      ${header('SCGMEX - Aviso de Vencimiento')}
      <div style="padding:24px;">
        <div style="text-align:center;margin-bottom:16px;">
          <span style="display:inline-block;background:#fce4ec;color:#c62828;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;">Proximo a vencer</span>
        </div>
        <h2 style="color:#2b2c40;margin:0 0 12px;">${d.titulo || 'Aviso de Vencimiento'}</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;">${d.mensaje || ''}</p>
        ${d.detalles ? detailsBlock(d.detalles) : ''}
        <div style="background:#fff3e0;padding:12px 16px;border-radius:6px;margin-top:16px;border-left:4px solid #e65100;">
          <p style="color:#e65100;font-size:13px;margin:0;font-weight:600;">
            Atencion: Es necesario renovar o actualizar antes de la fecha de vencimiento para evitar interrupciones en el servicio.
          </p>
        </div>
      </div>
      ${footer()}
    `),
};

// ── CORS Headers ───────────────────────────────────────────────────────────

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ── Serve ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: NotificationRequest = await req.json();
    const { to, subject, tipo, datos } = body;

    if (!to || !to.length || !subject || !tipo) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Campos requeridos: to, subject, tipo',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const template = TEMPLATES[tipo] || TEMPLATES.alerta;
    const html = template(datos || {});

    // ── Send via Resend API ───────────────────────────────────────────────
    if (RESEND_API_KEY) {
      const emailResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to,
          subject: `[SCGMEX] ${subject}`,
          html,
        }),
      });

      const result = await emailResp.json();

      return new Response(
        JSON.stringify({ success: emailResp.ok, result }),
        {
          status: emailResp.ok ? 200 : 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // ── Fallback: no email provider configured ────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        message:
          'Notificacion registrada. Configure RESEND_API_KEY para envio por email.',
        preview: { to, subject, tipo },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
