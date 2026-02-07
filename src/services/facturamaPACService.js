import { FACTURAMA_CONFIG } from '../config/facturama';

// ═══ Helper for API calls with Basic Auth ═══

async function facturamaFetch(endpoint, options = {}) {
  const url = `${FACTURAMA_CONFIG.getApiUrl()}${endpoint}`;
  const credentials = FACTURAMA_CONFIG.getCredentials();

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.Message || errorData.message || `Facturama error: ${response.status}`
    );
  }

  return response;
}

// ═══ CFDI CREATION (Timbrado) ═══

/**
 * Map our internal tipo to Facturama CfdiType
 */
function mapTipoCFDI(tipo) {
  const map = { ingreso: 'I', egreso: 'E', traslado: 'T', nomina: 'N', pago: 'P' };
  return map[tipo] || 'I';
}

/**
 * Build tax objects for a concepto
 */
function buildTaxes(concepto) {
  const taxes = [];
  if (concepto.iva_tasa !== undefined) {
    taxes.push({
      Name: 'IVA',
      Rate: Number(concepto.iva_tasa) || 0.16,
      Total:
        Number(concepto.iva_monto) ||
        Number(concepto.precio_unitario) * Number(concepto.cantidad) * 0.16,
      Base: Number(concepto.precio_unitario) * Number(concepto.cantidad),
      IsRetention: false,
    });
  }
  return taxes;
}

/**
 * Calculate item total including taxes
 */
function calculateItemTotal(c) {
  const subtotal = Number(c.cantidad) * Number(c.precio_unitario);
  const iva = Number(c.iva_monto) || subtotal * 0.16;
  return subtotal + iva;
}

/**
 * Determine TaxObject based on taxes presence (CFDI 4.0 required field)
 */
function getTaxObject(hasTaxes) {
  return hasTaxes ? '02' : '01'; // 02=Si objeto de impuesto, 01=No objeto de impuesto
}

/**
 * Build items array from form data
 */
function buildItems(formData) {
  // If formData has conceptos array, use them
  if (formData.conceptos?.length) {
    return formData.conceptos.map((c) => {
      const taxes = buildTaxes(c);
      return {
        ProductCode: c.clave_prod_serv || '01010101',
        UnitCode: c.clave_unidad || 'ACT',
        Unit: c.unidad || 'Actividad',
        Description: c.descripcion,
        IdentificationNumber: c.no_identificacion || '',
        Quantity: Number(c.cantidad) || 1,
        UnitPrice: Number(c.precio_unitario) || 0,
        Subtotal: Number(c.cantidad) * Number(c.precio_unitario),
        TaxObject: getTaxObject(taxes.length > 0),
        Taxes: taxes,
        Total: calculateItemTotal(c),
      };
    });
  }
  // Fallback: single concept from subtotal
  const hasTax = Number(formData.iva) > 0;
  return [
    {
      ProductCode: '01010101',
      UnitCode: 'ACT',
      Unit: 'Actividad',
      Description: formData.descripcion || 'Servicio',
      Quantity: 1,
      UnitPrice: Number(formData.subtotal) || 0,
      Subtotal: Number(formData.subtotal) || 0,
      TaxObject: getTaxObject(hasTax),
      Taxes: hasTax
        ? [
            {
              Name: 'IVA',
              Rate: 0.16,
              Total: Number(formData.iva) || 0,
              Base: Number(formData.subtotal) || 0,
              IsRetention: false,
            },
          ]
        : [],
      Total: Number(formData.total) || 0,
    },
  ];
}

/**
 * Build Facturama CFDI 4.0 request from our form data
 */
export function buildCFDIRequest(formData, emisor) {
  return {
    Folio: formData.folio || '',
    Serie: formData.serie || 'A',
    Currency: formData.moneda || 'MXN',
    ExpeditionPlace: emisor.codigo_postal || '06600',
    PaymentConditions: formData.condiciones_pago || '',
    CfdiType: mapTipoCFDI(formData.tipo),
    PaymentForm: formData.forma_pago || '99',
    PaymentMethod: formData.metodo_pago === 'PUE' ? 'PUE' : 'PPD',
    Receiver: {
      Rfc: formData.receptor_rfc,
      Name: formData.receptor_nombre,
      CfdiUse: formData.uso_cfdi || 'G03',
      FiscalRegime: formData.receptor_regimen || '616',
      TaxZipCode: formData.receptor_cp || '06600',
    },
    Items: buildItems(formData),
  };
}

/**
 * Send CFDI to Facturama for timbrado (stamping with SAT)
 * Returns the timbrado response with UUID, sello, etc.
 */
export async function timbrarCFDI(cfdiRequest) {
  const resp = await facturamaFetch('/3/cfdis', {
    method: 'POST',
    body: JSON.stringify(cfdiRequest),
  });
  return resp.json();
}

/**
 * Cancel a previously timbrado CFDI
 * @param {string} facturamaCfdiId - Facturama internal ID
 * @param {string} motivo - Cancellation reason code (01-04)
 * @param {string} uuidSustitucion - Replacement UUID (required for motivo 01)
 */
export async function cancelarCFDI(facturamaCfdiId, motivo, uuidSustitucion = '') {
  let endpoint = `/cfdi/${facturamaCfdiId}?type=issued&motive=${motivo}`;
  if (motivo === '01' && uuidSustitucion) {
    endpoint += `&uuidReplacement=${uuidSustitucion}`;
  }
  const resp = await facturamaFetch(endpoint, { method: 'DELETE' });
  return resp.json();
}

/**
 * Get CFDI status from Facturama
 */
export async function consultarCFDI(facturamaCfdiId) {
  const resp = await facturamaFetch(`/cfdi/${facturamaCfdiId}?type=issued`);
  return resp.json();
}

/**
 * Download CFDI XML (returns base64 string)
 */
export async function descargarXML(facturamaCfdiId) {
  const resp = await facturamaFetch(`/cfdi/${facturamaCfdiId}/xml?type=issued`);
  const text = await resp.text();
  return text;
}

/**
 * Download CFDI PDF (returns base64 string)
 */
export async function descargarPDF(facturamaCfdiId) {
  const resp = await facturamaFetch(`/cfdi/${facturamaCfdiId}/pdf?type=issued`);
  const text = await resp.text();
  return text;
}

/**
 * Validate a received CFDI UUID against SAT
 */
export async function validarCFDISAT(emisorRfc, receptorRfc, total, uuid) {
  const resp = await facturamaFetch(
    `/api/Cfdi/Validation/${emisorRfc}/${receptorRfc}/${total}/${uuid}`
  );
  return resp.json();
}

/**
 * Get PAC connection status and profile info
 */
export async function verificarConexionPAC() {
  try {
    const resp = await facturamaFetch('/TaxEntity');
    const profile = await resp.json();
    const hasCsd = !!(profile.Csd?.Certificate);
    return {
      connected: true,
      sandbox: FACTURAMA_CONFIG.isSandbox(),
      rfc: profile.Rfc,
      razonSocial: profile.TaxName,
      regimen: profile.FiscalRegime,
      hasCsd,
      profile,
    };
  } catch (err) {
    return { connected: false, sandbox: FACTURAMA_CONFIG.isSandbox(), error: err.message };
  }
}

/**
 * Get clients (receptores) from Facturama
 */
export async function obtenerClientes() {
  const resp = await facturamaFetch('/Client');
  return resp.json();
}

/**
 * Create/update a client (receptor) in Facturama
 */
export async function crearCliente(clientData) {
  const resp = await facturamaFetch('/Client', {
    method: 'POST',
    body: JSON.stringify(clientData),
  });
  return resp.json();
}

/**
 * Search SAT product/service catalog
 */
export async function buscarProductoSAT(keyword) {
  const resp = await facturamaFetch(`/catalogs/ProductsOrServices?keyword=${encodeURIComponent(keyword)}`);
  return resp.json();
}

/**
 * Get branch offices (lugares de expedición)
 */
export async function obtenerSucursales() {
  const resp = await facturamaFetch('/BranchOffice');
  return resp.json();
}
