import { FACTURAMA_CONFIG } from '../config/facturama';

// ═══ Helper for API calls with Basic Auth ═══

async function facturamaFetch(endpoint, options = {}) {
  const url = `${FACTURAMA_CONFIG.getApiUrl()}${endpoint}`;
  const credentials = FACTURAMA_CONFIG.getCredentials();

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
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

// ═══ MODE DETECTION ═══

const isMulti = () => FACTURAMA_CONFIG.isMultiemisor();

// ═══ CSD MANAGEMENT (Multiemisor) ═══

/**
 * Upload CSD for a specific RFC (Multiemisor mode)
 * In API Web mode, CSD is managed via the Facturama dashboard
 */
export async function subirCSDEnte(rfc, cerBase64, keyBase64, password) {
  if (!isMulti()) {
    throw new Error(
      'La carga de CSD por API requiere el modo Multiemisor. ' +
        'En modo API Web, suba el CSD desde el dashboard de Facturama.'
    );
  }
  const resp = await facturamaFetch('/api/lite/csds', {
    method: 'POST',
    body: JSON.stringify({
      Rfc: rfc,
      Certificate: cerBase64,
      PrivateKey: keyBase64,
      PrivateKeyPassword: password,
    }),
  });
  return resp.json();
}

/**
 * Get CSD status for a specific RFC (Multiemisor mode)
 */
export async function consultarCSDEnte(rfc) {
  if (!isMulti()) {
    // In API Web, check the single profile CSD
    const resp = await facturamaFetch('/TaxEntity');
    const profile = await resp.json();
    return {
      rfc: profile.Rfc,
      hasCsd: !!(profile.Csd?.Certificate),
      serialNumber: profile.Csd?.SerialNumber || '',
      expirationDate: profile.Csd?.ExpirationDate || '',
    };
  }
  try {
    const resp = await facturamaFetch(`/api/lite/csds/${rfc}`);
    const data = await resp.json();
    return {
      rfc,
      hasCsd: true,
      serialNumber: data.SerialNumber || '',
      expirationDate: data.ExpirationDate || '',
    };
  } catch {
    return { rfc, hasCsd: false, serialNumber: '', expirationDate: '' };
  }
}

/**
 * Delete CSD for a specific RFC (Multiemisor mode)
 */
export async function eliminarCSDEnte(rfc) {
  if (!isMulti()) throw new Error('Solo disponible en modo Multiemisor.');
  const resp = await facturamaFetch(`/api/lite/csds/${rfc}`, { method: 'DELETE' });
  return resp.json();
}

// ═══ CFDI BUILDING ═══

function mapTipoCFDI(tipo) {
  const map = { ingreso: 'I', egreso: 'E', traslado: 'T', nomina: 'N', pago: 'P' };
  return map[tipo] || 'I';
}

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

function calculateItemTotal(c) {
  const subtotal = Number(c.cantidad) * Number(c.precio_unitario);
  const iva = Number(c.iva_monto) || subtotal * 0.16;
  return subtotal + iva;
}

function getTaxObject(hasTaxes) {
  return hasTaxes ? '02' : '01';
}

function buildItems(formData) {
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
        ? [{ Name: 'IVA', Rate: 0.16, Total: Number(formData.iva) || 0, Base: Number(formData.subtotal) || 0, IsRetention: false }]
        : [],
      Total: Number(formData.total) || 0,
    },
  ];
}

/**
 * Build Facturama CFDI 4.0 request from form data + emisor (ente publico)
 * emisor = { rfc, razon_social, regimen_fiscal, codigo_postal }
 */
export function buildCFDIRequest(formData, emisor) {
  const base = {
    Folio: formData.folio || '',
    Serie: formData.serie || 'A',
    Currency: formData.moneda || 'MXN',
    ExpeditionPlace: emisor.codigo_postal || '06300',
    PaymentConditions: formData.condiciones_pago || '',
    CfdiType: mapTipoCFDI(formData.tipo),
    PaymentForm: formData.forma_pago || '99',
    PaymentMethod: formData.metodo_pago === 'PUE' ? 'PUE' : 'PPD',
    Receiver: {
      Rfc: formData.receptor_rfc,
      Name: formData.receptor_nombre,
      CfdiUse: formData.uso_cfdi || 'G03',
      FiscalRegime: formData.receptor_regimen || '616',
      TaxZipCode: formData.receptor_cp || '06300',
    },
    Items: buildItems(formData),
  };

  // In Multiemisor mode, include Issuer block (required by /api/lite/cfdis)
  if (isMulti()) {
    base.Issuer = {
      Rfc: emisor.rfc,
      Name: emisor.razon_social || emisor.nombre,
      FiscalRegime: emisor.regimen_fiscal || '601',
    };
  }

  return base;
}

// ═══ TIMBRADO ═══

export async function timbrarCFDI(cfdiRequest) {
  const endpoint = isMulti() ? '/api/lite/cfdis' : '/3/cfdis';
  const resp = await facturamaFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(cfdiRequest),
  });
  return resp.json();
}

// ═══ CANCEL ═══

export async function cancelarCFDI(facturamaCfdiId, motivo, uuidSustitucion = '') {
  const type = isMulti() ? 'issuedLite' : 'issued';
  let endpoint = `/cfdi/${facturamaCfdiId}?type=${type}&motive=${motivo}`;
  if (motivo === '01' && uuidSustitucion) {
    endpoint += `&uuidReplacement=${uuidSustitucion}`;
  }
  const resp = await facturamaFetch(endpoint, { method: 'DELETE' });
  return resp.json();
}

// ═══ CONSULT ═══

export async function consultarCFDI(facturamaCfdiId) {
  const type = isMulti() ? 'issuedLite' : 'issued';
  const resp = await facturamaFetch(`/cfdi/${facturamaCfdiId}?type=${type}`);
  return resp.json();
}

// ═══ DOWNLOAD ═══

export async function descargarXML(facturamaCfdiId) {
  const type = isMulti() ? 'issuedLite' : 'issued';
  const resp = await facturamaFetch(`/cfdi/xml/${type}/${facturamaCfdiId}`);
  return resp.text();
}

export async function descargarPDF(facturamaCfdiId) {
  const type = isMulti() ? 'issuedLite' : 'issued';
  const resp = await facturamaFetch(`/cfdi/pdf/${type}/${facturamaCfdiId}`);
  return resp.text();
}

// ═══ VALIDATE ═══

export async function validarCFDISAT(emisorRfc, receptorRfc, total, uuid) {
  const resp = await facturamaFetch(
    `/api/Cfdi/Validation/${emisorRfc}/${receptorRfc}/${total}/${uuid}`
  );
  return resp.json();
}

// ═══ PAC STATUS ═══

export async function verificarConexionPAC() {
  try {
    const resp = await facturamaFetch('/TaxEntity');
    const profile = await resp.json();
    const hasCsd = !!(profile.Csd?.Certificate);
    return {
      connected: true,
      sandbox: FACTURAMA_CONFIG.isSandbox(),
      multiemisor: isMulti(),
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

// ═══ CLIENTS (Receptores) ═══

export async function obtenerClientes() {
  const resp = await facturamaFetch('/Client');
  return resp.json();
}

export async function crearCliente(clientData) {
  const resp = await facturamaFetch('/Client', {
    method: 'POST',
    body: JSON.stringify(clientData),
  });
  return resp.json();
}

// ═══ CATALOGS ═══

export async function buscarProductoSAT(keyword) {
  const resp = await facturamaFetch(
    `/catalogs/ProductsOrServices?keyword=${encodeURIComponent(keyword)}`
  );
  return resp.json();
}

export async function obtenerSucursales() {
  const resp = await facturamaFetch('/BranchOffice');
  return resp.json();
}
