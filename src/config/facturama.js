// Facturama PAC Configuration
export const FACTURAMA_CONFIG = {
  sandboxUrl: 'https://apisandbox.facturama.mx',
  productionUrl: 'https://api.facturama.mx',
  // Credentials from env vars or Supabase config
  getApiUrl: () => import.meta.env.VITE_FACTURAMA_URL || 'https://apisandbox.facturama.mx',
  getCredentials: () => {
    const user = import.meta.env.VITE_FACTURAMA_USER || '';
    const pass = import.meta.env.VITE_FACTURAMA_PASS || '';
    return btoa(`${user}:${pass}`);
  },
  isSandbox: () => !import.meta.env.VITE_FACTURAMA_URL || import.meta.env.VITE_FACTURAMA_URL.includes('sandbox'),
  hasCredentials: () => !!import.meta.env.VITE_FACTURAMA_USER,
};

// CFDI 4.0 Catalogs
export const REGIMENES_FISCALES = [
  { key: '601', label: 'General de Ley Personas Morales' },
  { key: '603', label: 'Personas Morales con Fines no Lucrativos' },
  { key: '605', label: 'Sueldos y Salarios' },
  { key: '606', label: 'Arrendamiento' },
  { key: '608', label: 'Demas Ingresos' },
  { key: '610', label: 'Residentes en el Extranjero sin EP' },
  { key: '612', label: 'Actividades Empresariales y Profesionales' },
  { key: '614', label: 'Ingresos por Intereses' },
  { key: '616', label: 'Sin Obligaciones Fiscales' },
  { key: '620', label: 'Sociedades Cooperativas de Produccion' },
  { key: '621', label: 'Incorporacion Fiscal' },
  { key: '622', label: 'Actividades Agricolas, Ganaderas, Silvicolas y Pesqueras' },
  { key: '623', label: 'Opcional para Grupos de Sociedades' },
  { key: '624', label: 'Coordinados' },
  { key: '625', label: 'Regimen de las Actividades Empresariales con ingresos a traves de Plataformas Tecnologicas' },
  { key: '626', label: 'Regimen Simplificado de Confianza' },
];

export const FORMAS_PAGO_CFDI40 = [
  { key: '01', label: 'Efectivo' },
  { key: '02', label: 'Cheque nominativo' },
  { key: '03', label: 'Transferencia electronica' },
  { key: '04', label: 'Tarjeta de credito' },
  { key: '05', label: 'Monedero electronico' },
  { key: '06', label: 'Dinero electronico' },
  { key: '28', label: 'Tarjeta de debito' },
  { key: '29', label: 'Tarjeta de servicios' },
  { key: '99', label: 'Por definir' },
];

export const MONEDAS = [
  { key: 'MXN', label: 'Peso Mexicano' },
  { key: 'USD', label: 'Dolar Americano' },
  { key: 'EUR', label: 'Euro' },
];

export const MOTIVOS_CANCELACION = [
  { key: '01', label: 'Comprobante emitido con errores con relacion' },
  { key: '02', label: 'Comprobante emitido con errores sin relacion' },
  { key: '03', label: 'No se llevo a cabo la operacion' },
  { key: '04', label: 'Operacion nominativa relacionada en factura global' },
];
