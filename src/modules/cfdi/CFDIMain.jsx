import { useResumenCFDI, useConexionPAC } from '../../hooks/useCFDI';
import { FACTURAMA_CONFIG } from '../../config/facturama';
import Badge from '../../components/ui/Badge';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function CFDIMain() {
  const { data: resumen = {}, isLoading } = useResumenCFDI();
  const { data: pacStatus, isLoading: pacLoading } = useConexionPAC();

  const totalEmitidos = resumen.totalEmitidos || 0;
  const montoEmitidos = resumen.montoEmitidos || 0;
  const totalRecibidos = resumen.totalRecibidos || 0;
  const montoRecibidos = resumen.montoRecibidos || 0;
  const timbrados = resumen.timbrados || 0;

  const hasCredentials = FACTURAMA_CONFIG.hasCredentials();
  const isSandbox = FACTURAMA_CONFIG.isSandbox();

  const cards = [
    { label: 'Total Emitidos', value: totalEmitidos, isMoney: false },
    { label: 'Monto Emitidos', value: montoEmitidos, isMoney: true },
    { label: 'Total Recibidos', value: totalRecibidos, isMoney: false },
    { label: 'Monto Recibidos', value: montoRecibidos, isMoney: true },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Comprobantes Fiscales Digitales (CFDI)
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Gestion de CFDI emitidos y recibidos del ente publico
          </p>
        </div>
        {/* PAC Status Indicator */}
        <div className="flex items-center gap-3">
          {isSandbox && (
            <Badge variant="warning">Sandbox</Badge>
          )}
          <div className="flex items-center gap-2 bg-white rounded-lg card-shadow px-3 py-2">
            <span className="text-xs text-text-muted">PAC Facturama:</span>
            {pacLoading ? (
              <span className="text-xs text-text-muted">Verificando...</span>
            ) : pacStatus?.connected ? (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#56ca00] inline-block" />
                <span className="text-xs font-medium text-[#56ca00]">Conectado</span>
                {pacStatus.rfc && (
                  <span className="text-xs text-text-muted ml-1">RFC: {pacStatus.rfc}</span>
                )}
                {!pacStatus.hasCsd && (
                  <Badge variant="danger">Sin CSD</Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e0360a] inline-block" />
                <span className="text-xs font-medium text-[#e0360a]">Desconectado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSD warning */}
      {pacStatus?.connected && !pacStatus.hasCsd && (
        <div className="bg-[#e0360a]/10 border border-[#e0360a]/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#e0360a] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-[#e0360a]">CSD no configurado - Timbrado no disponible</p>
              <p className="text-xs text-text-muted mt-1">
                Para timbrar CFDI, suba su Certificado de Sello Digital (CSD) en el{' '}
                <a href={isSandbox ? 'https://sandbox.facturama.mx' : 'https://facturama.mx'}
                   target="_blank" rel="noreferrer" className="text-guinda underline">
                  dashboard de Facturama
                </a>{' '}
                → Perfil Fiscal → Carga de Sellos Digitales.
                {isSandbox && (
                  <span className="block mt-1">
                    Para sandbox, descargue los{' '}
                    <a href="https://cdnfacturama.azureedge.net/content/csd-pruebas.zip"
                       target="_blank" rel="noreferrer" className="text-guinda underline">
                      CSD de prueba
                    </a>{' '}
                    (password: 12345678a). Use RFC de prueba como EKU9003173C9.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Credentials warning */}
      {!hasCredentials && (
        <div className="bg-[#ffab00]/10 border border-[#ffab00]/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#e09600] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-[#e09600]">Credenciales PAC no configuradas</p>
              <p className="text-xs text-text-muted mt-1">
                Configure las variables de entorno <code className="bg-[#e7e7e8] px-1 py-0.5 rounded text-xs">VITE_FACTURAMA_USER</code> y{' '}
                <code className="bg-[#e7e7e8] px-1 py-0.5 rounded text-xs">VITE_FACTURAMA_PASS</code> para habilitar el timbrado de CFDI.
                Opcionalmente <code className="bg-[#e7e7e8] px-1 py-0.5 rounded text-xs">VITE_FACTURAMA_URL</code> para produccion.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando resumen de CFDI...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-lg card-shadow p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">{card.label}</p>
              <p className="text-lg font-bold text-text-primary">
                {card.isMoney ? fmtMoney(card.value) : card.value}
              </p>
            </div>
          ))}
          <div className="bg-white rounded-lg card-shadow p-4">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Timbrados</p>
            <p className="text-lg font-bold text-[#56ca00]">{timbrados}</p>
          </div>
        </div>
      )}

      {/* Module description */}
      <div className="bg-white rounded-lg card-shadow p-5">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Acerca del Modulo</h2>
        <p className="text-sm text-text-muted leading-relaxed">
          El modulo de Comprobantes Fiscales Digitales por Internet (CFDI) permite gestionar
          los comprobantes fiscales emitidos y recibidos por el ente publico, incluyendo el
          registro, consulta y control de estado de cada comprobante conforme a las disposiciones
          fiscales vigentes del SAT. Integra timbrado CFDI 4.0 via PAC Facturama.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="border border-border rounded-md p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Emitidos</h3>
            <p className="text-xs text-text-muted">
              CFDI emitidos por el ente publico a terceros, con control de serie, folio y UUID.
            </p>
          </div>
          <div className="border border-border rounded-md p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Recibidos</h3>
            <p className="text-xs text-text-muted">
              CFDI recibidos de proveedores y prestadores de servicios, con seguimiento de pago.
            </p>
          </div>
          <div className="border border-border rounded-md p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Timbrado PAC</h3>
            <p className="text-xs text-text-muted">
              Timbrado CFDI 4.0 via Facturama, cancelacion ante el SAT y descarga de XML/PDF.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
