/**
 * e.Firma Cryptography Utilities
 * Handles .cer file parsing (DER-encoded X.509), certificate validation,
 * document hashing (SHA-256 via Web Crypto API), and cadena original generation.
 * No external dependencies - pure browser APIs.
 */

// ═══════════════════════════════════════════════════════════════════
//  ASN.1 DER Tag Constants
// ═══════════════════════════════════════════════════════════════════

const ASN1_SEQUENCE = 0x30;
const ASN1_SET = 0x31;
const ASN1_INTEGER = 0x02;
const ASN1_BITSTRING = 0x03;
const ASN1_OCTETSTRING = 0x04;
const ASN1_NULL = 0x05;
const ASN1_OID = 0x06;
const ASN1_UTF8STRING = 0x0c;
const ASN1_PRINTABLESTRING = 0x13;
const ASN1_T61STRING = 0x14;
const ASN1_IA5STRING = 0x16;
const ASN1_UTCTIME = 0x17;
const ASN1_GENERALIZEDTIME = 0x18;
const ASN1_BMPSTRING = 0x1e;

// ═══════════════════════════════════════════════════════════════════
//  Low-level DER parsing
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse a single DER element starting at `offset` in `bytes`.
 * Returns { tag, tagClass, tagNumber, constructed, length, value, children, end }
 */
function parseDERElement(bytes, offset) {
  if (offset >= bytes.length) {
    throw new Error(`DER parse error: offset ${offset} out of bounds (len=${bytes.length})`);
  }

  const tag = bytes[offset];
  let pos = offset + 1;
  const constructed = (tag & 0x20) !== 0;
  const tagClass = (tag >> 6) & 0x03;
  const tagNumber = tag & 0x1f;

  // Parse length (BER/DER definite form)
  if (pos >= bytes.length) throw new Error('DER parse error: unexpected end reading length');
  let length = bytes[pos++];
  if (length & 0x80) {
    const numBytes = length & 0x7f;
    if (numBytes === 0) throw new Error('DER parse error: indefinite length not supported');
    length = 0;
    for (let i = 0; i < numBytes; i++) {
      if (pos >= bytes.length) throw new Error('DER parse error: unexpected end in long length');
      length = (length * 256) + bytes[pos++];
    }
  }

  if (pos + length > bytes.length) {
    throw new Error(`DER parse error: content length ${length} exceeds buffer at offset ${pos}`);
  }

  const value = bytes.slice(pos, pos + length);
  const end = pos + length;

  const element = { tag, tagClass, tagNumber, constructed, length, value, offset, end };

  // Recursively parse children for constructed types
  if (constructed) {
    element.children = parseDERChildren(value);
  }

  return element;
}

/**
 * Parse all DER elements inside a constructed element's value bytes.
 */
function parseDERChildren(bytes) {
  const children = [];
  let offset = 0;
  while (offset < bytes.length) {
    const child = parseDERElement(bytes, offset);
    children.push(child);
    offset = child.end;
  }
  return children;
}

// ═══════════════════════════════════════════════════════════════════
//  ASN.1 value decoders
// ═══════════════════════════════════════════════════════════════════

/**
 * Decode an ASN.1 INTEGER value to hex string.
 */
function decodeInteger(valueBytes) {
  // Skip leading zero byte used for positive sign
  let start = 0;
  if (valueBytes.length > 1 && valueBytes[0] === 0x00) {
    start = 1;
  }
  return Array.from(valueBytes.slice(start))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Decode an OID from DER-encoded bytes to dotted string notation.
 */
function decodeOID(valueBytes) {
  if (valueBytes.length === 0) return '';
  const parts = [];
  // First byte encodes first two components
  parts.push(Math.floor(valueBytes[0] / 40));
  parts.push(valueBytes[0] % 40);

  let val = 0;
  for (let i = 1; i < valueBytes.length; i++) {
    val = (val * 128) + (valueBytes[i] & 0x7f);
    if ((valueBytes[i] & 0x80) === 0) {
      parts.push(val);
      val = 0;
    }
  }
  return parts.join('.');
}

/**
 * Decode a string value from DER bytes based on the tag type.
 */
function decodeString(tag, valueBytes) {
  if (tag === ASN1_BMPSTRING) {
    // UCS-2 / UTF-16 BE
    let str = '';
    for (let i = 0; i < valueBytes.length; i += 2) {
      str += String.fromCharCode((valueBytes[i] << 8) | valueBytes[i + 1]);
    }
    return str;
  }
  // UTF8, PrintableString, IA5String, T61String - decode as UTF-8
  return new TextDecoder('utf-8').decode(valueBytes);
}

/**
 * Decode a UTCTime or GeneralizedTime to a Date object.
 */
function decodeTime(tag, valueBytes) {
  const str = new TextDecoder('ascii').decode(valueBytes);
  if (tag === ASN1_UTCTIME) {
    // Format: YYMMDDHHmmssZ
    const yy = parseInt(str.slice(0, 2), 10);
    const year = yy >= 50 ? 1900 + yy : 2000 + yy;
    const month = parseInt(str.slice(2, 4), 10) - 1;
    const day = parseInt(str.slice(4, 6), 10);
    const hour = parseInt(str.slice(6, 8), 10);
    const min = parseInt(str.slice(8, 10), 10);
    const sec = parseInt(str.slice(10, 12), 10);
    return new Date(Date.UTC(year, month, day, hour, min, sec));
  }
  if (tag === ASN1_GENERALIZEDTIME) {
    // Format: YYYYMMDDHHmmssZ
    const year = parseInt(str.slice(0, 4), 10);
    const month = parseInt(str.slice(4, 6), 10) - 1;
    const day = parseInt(str.slice(6, 8), 10);
    const hour = parseInt(str.slice(8, 10), 10);
    const min = parseInt(str.slice(10, 12), 10);
    const sec = parseInt(str.slice(12, 14), 10);
    return new Date(Date.UTC(year, month, day, hour, min, sec));
  }
  return new Date(str);
}

/**
 * Check if a tag represents a string type.
 */
function isStringTag(tag) {
  return [
    ASN1_UTF8STRING, ASN1_PRINTABLESTRING, ASN1_IA5STRING,
    ASN1_T61STRING, ASN1_BMPSTRING,
  ].includes(tag);
}

// ═══════════════════════════════════════════════════════════════════
//  X.509 Certificate field extraction
// ═══════════════════════════════════════════════════════════════════

/**
 * Extract the serial number from the TBSCertificate.
 * TBS structure: [version], serialNumber, signature, issuer, validity, subject, ...
 * Version is wrapped in [0] EXPLICIT context tag.
 */
function extractSerialNumber(tbs) {
  if (!tbs.children || tbs.children.length < 2) return '';
  // First child may be [0] version (context-specific, class=2, tagNumber=0)
  let idx = 0;
  if (tbs.children[0].tagClass === 2 && tbs.children[0].tagNumber === 0) {
    idx = 1; // skip version wrapper
  }
  const serialEl = tbs.children[idx];
  if (!serialEl || serialEl.tag !== ASN1_INTEGER) return '';
  return decodeInteger(serialEl.value);
}

/**
 * Get the TBS child index adjusted for the optional [0] version tag.
 */
function tbsIndex(tbs, logicalIndex) {
  let offset = 0;
  if (tbs.children && tbs.children[0] && tbs.children[0].tagClass === 2 && tbs.children[0].tagNumber === 0) {
    offset = 1;
  }
  return tbs.children[logicalIndex + offset] || null;
}

/**
 * Extract a Distinguished Name (DN) from a SEQUENCE of SETs of SEQUENCE {OID, value}.
 * Returns an array of { oid, value } objects.
 */
function extractDN(element) {
  if (!element || !element.children) return [];
  const entries = [];
  for (const setEl of element.children) {
    if (!setEl.children) continue;
    for (const seqEl of setEl.children) {
      if (!seqEl.children || seqEl.children.length < 2) continue;
      const oidEl = seqEl.children[0];
      const valEl = seqEl.children[1];
      if (oidEl.tag !== ASN1_OID) continue;
      const oid = decodeOID(oidEl.value);
      const value = isStringTag(valEl.tag)
        ? decodeString(valEl.tag, valEl.value)
        : decodeInteger(valEl.value);
      entries.push({ oid, value });
    }
  }
  return entries;
}

/**
 * Extract validity (notBefore, notAfter) from the Validity SEQUENCE.
 */
function extractValidity(element) {
  if (!element || !element.children || element.children.length < 2) {
    return { notBefore: new Date(0), notAfter: new Date(0) };
  }
  const notBeforeEl = element.children[0];
  const notAfterEl = element.children[1];
  return {
    notBefore: decodeTime(notBeforeEl.tag, notBeforeEl.value),
    notAfter: decodeTime(notAfterEl.tag, notAfterEl.value),
  };
}

// Well-known OIDs for DN attributes
const OID_CN = '2.5.4.3'; // Common Name
const OID_SERIAL_NUMBER = '2.5.4.5'; // Serial Number (often used for RFC in Mexico)
const OID_O = '2.5.4.10'; // Organization
const OID_OU = '2.5.4.11'; // Organizational Unit
const OID_C = '2.5.4.6'; // Country
const OID_UID = '0.9.2342.19200300.100.1.1'; // UID
const OID_EMAIL = '1.2.840.113549.1.9.1'; // Email
const OID_UNIQUE_ID = '2.5.4.45'; // UniqueIdentifier
const OID_X500_UID = '2.5.4.44'; // x500UniqueIdentifier

/**
 * Find a value in a DN entries array by OID.
 */
function findDNValue(dnEntries, oid) {
  const entry = dnEntries.find((e) => e.oid === oid);
  return entry ? entry.value : '';
}

/**
 * Extract RFC from subject DN.
 * SAT certificates typically store RFC in:
 * - OID 2.5.4.45 (UniqueIdentifier)
 * - OID 2.5.4.5 (serialNumber)
 * - OID 0.9.2342.19200300.100.1.1 (UID)
 * The RFC is often embedded as "/ RFC" pattern or standalone.
 */
function extractRFCFromSubject(dnEntries) {
  // Try UniqueIdentifier first (SAT convention)
  let rfc = findDNValue(dnEntries, OID_UNIQUE_ID);
  if (rfc) return cleanRFC(rfc);

  // Try serialNumber (OID 2.5.4.5)
  rfc = findDNValue(dnEntries, OID_SERIAL_NUMBER);
  if (rfc) {
    // SAT sometimes stores the full serial here, but it may also contain the RFC
    // RFC pattern: 3-4 letters + 6 digits + 3 alphanumeric
    const rfcMatch = rfc.match(/[A-Z&]{3,4}\d{6}[A-Z0-9]{3}/i);
    if (rfcMatch) return rfcMatch[0].toUpperCase();
    return cleanRFC(rfc);
  }

  // Try UID
  rfc = findDNValue(dnEntries, OID_UID);
  if (rfc) return cleanRFC(rfc);

  // Try x500UniqueIdentifier
  rfc = findDNValue(dnEntries, OID_X500_UID);
  if (rfc) return cleanRFC(rfc);

  // Fallback: look in CN or OU for RFC pattern
  const cn = findDNValue(dnEntries, OID_CN);
  const rfcMatch = cn.match(/[A-Z&]{3,4}\d{6}[A-Z0-9]{3}/i);
  if (rfcMatch) return rfcMatch[0].toUpperCase();

  return '';
}

/**
 * Clean and normalize an RFC string.
 */
function cleanRFC(str) {
  if (!str) return '';
  // Remove common prefixes/separators
  const cleaned = str.replace(/^\/\s*/, '').trim();
  // Try to match RFC pattern
  const match = cleaned.match(/[A-Z&]{3,4}\d{6}[A-Z0-9]{3}/i);
  return match ? match[0].toUpperCase() : cleaned.toUpperCase();
}

/**
 * Extract Common Name (CN) from DN entries.
 */
function extractCNFromDN(dnEntries) {
  return findDNValue(dnEntries, OID_CN) || findDNValue(dnEntries, OID_O) || '';
}

// ═══════════════════════════════════════════════════════════════════
//  Main .CER parsing function
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse a SAT .cer file (DER-encoded X.509 certificate).
 * Extracts: serial number, subject (RFC, name), issuer, validity dates.
 * @param {ArrayBuffer} cerBuffer - Contents of the .cer file
 * @returns {Object} Certificate information
 */
export function parseCertificadoCER(cerBuffer) {
  const bytes = new Uint8Array(cerBuffer);

  // Check if it's PEM-encoded (starts with "-----BEGIN")
  let derBytes = bytes;
  const firstChars = new TextDecoder('ascii').decode(bytes.slice(0, 11));
  if (firstChars.startsWith('-----BEGIN')) {
    derBytes = pemToArrayBuffer(bytes);
  }

  // Parse the outer SEQUENCE: { tbsCertificate, signatureAlgorithm, signatureValue }
  const cert = parseDERElement(derBytes, 0);
  if (!cert.constructed || !cert.children || cert.children.length < 1) {
    throw new Error('Formato de certificado invalido: no es una estructura X.509 valida');
  }

  // TBSCertificate is the first child
  const tbs = cert.children[0];
  if (!tbs.constructed || !tbs.children) {
    throw new Error('Formato de certificado invalido: TBSCertificate no encontrado');
  }

  // Extract fields from TBS
  // Structure (with version): [0]version, serialNumber, signature, issuer, validity, subject, subjectPublicKeyInfo, ...
  // Structure (without version): serialNumber, signature, issuer, validity, subject, subjectPublicKeyInfo, ...
  const serialNumber = extractSerialNumber(tbs);

  // Issuer (logical index 2 = after serialNumber and signatureAlgorithm)
  const issuerEl = tbsIndex(tbs, 2);
  const issuerDN = extractDN(issuerEl);

  // Validity (logical index 3)
  const validityEl = tbsIndex(tbs, 3);
  const validity = extractValidity(validityEl);

  // Subject (logical index 4)
  const subjectEl = tbsIndex(tbs, 4);
  const subjectDN = extractDN(subjectEl);

  // Extract meaningful fields
  const rfc = extractRFCFromSubject(subjectDN);
  const nombre = extractCNFromDN(subjectDN);
  const emisor = extractCNFromDN(issuerDN);

  const now = new Date();

  return {
    numeroSerie: serialNumber,
    titular: nombre,
    rfc: rfc,
    emisor: emisor,
    emisorCompleto: issuerDN.map((e) => `${e.oid}=${e.value}`).join(', '),
    sujetoDN: subjectDN,
    emisorDN: issuerDN,
    fechaInicio: validity.notBefore,
    fechaFin: validity.notAfter,
    vigente: now >= validity.notBefore && now <= validity.notAfter,
    raw: derBytes,
    pem: arrayBufferToPEM(derBytes, 'CERTIFICATE'),
  };
}

/**
 * Convert PEM-encoded bytes back to DER ArrayBuffer.
 */
function pemToArrayBuffer(pemBytes) {
  const pemStr = new TextDecoder('ascii').decode(pemBytes);
  const base64 = pemStr
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert ArrayBuffer/Uint8Array to PEM format.
 */
function arrayBufferToPEM(buffer, type) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  // Process in chunks to avoid call stack issues with large certs
  let base64 = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    base64 += btoa(String.fromCharCode.apply(null, chunk));
  }
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
}

// ═══════════════════════════════════════════════════════════════════
//  Certificate validation helpers
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate certificate is from SAT (check issuer DN).
 * @param {Object} certInfo - Parsed certificate info
 * @returns {boolean}
 */
export function esCertificadoSAT(certInfo) {
  const emisor = (certInfo.emisor || '').toLowerCase();
  const emisorCompleto = (certInfo.emisorCompleto || '').toLowerCase();
  const combined = emisor + ' ' + emisorCompleto;
  return (
    combined.includes('sat') ||
    combined.includes('servicio de administracion tributaria') ||
    combined.includes('autoridad certificadora') ||
    combined.includes('servicio de administración tributaria')
  );
}

/**
 * Check if certificate is still valid (not expired, not before start).
 * @param {Object} certInfo - Parsed certificate info
 * @returns {boolean}
 */
export function certificadoVigente(certInfo) {
  const now = new Date();
  return now >= certInfo.fechaInicio && now <= certInfo.fechaFin;
}

/**
 * Calculate days until certificate expiration.
 * Negative values mean already expired.
 * @param {Object} certInfo - Parsed certificate info
 * @returns {number}
 */
export function diasParaVencer(certInfo) {
  const now = new Date();
  const diff = certInfo.fechaFin.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get a human-readable status label for a certificate.
 * @param {Object} certInfo - Parsed certificate info
 * @returns {{ estado: string, variant: string, label: string }}
 */
export function getEstadoCertificado(certInfo) {
  const dias = diasParaVencer(certInfo);
  if (dias < 0) {
    return { estado: 'vencido', variant: 'danger', label: `Vencido hace ${Math.abs(dias)} dias` };
  }
  if (dias <= 30) {
    return { estado: 'por_vencer', variant: 'warning', label: `Vence en ${dias} dias` };
  }
  const now = new Date();
  if (now < certInfo.fechaInicio) {
    return { estado: 'no_vigente', variant: 'default', label: 'Aun no vigente' };
  }
  return { estado: 'vigente', variant: 'success', label: `Vigente (${dias} dias restantes)` };
}

// ═══════════════════════════════════════════════════════════════════
//  Document Hashing (Web Crypto API)
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate SHA-256 hash of a document/file.
 * Uses the native Web Crypto API (real, not simulated).
 * @param {ArrayBuffer|Uint8Array|string} data - Document data
 * @returns {Promise<string>} Hex-encoded SHA-256 hash
 */
export async function hashDocumento(data) {
  let buffer;
  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data);
  } else if (data instanceof Uint8Array) {
    buffer = data;
  } else {
    buffer = new Uint8Array(data);
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return arrayBufferToHex(hashBuffer);
}

/**
 * Generate SHA-256 hash and return as base64 (cadena original / sello style).
 * @param {ArrayBuffer|Uint8Array|string} data - Document data
 * @returns {Promise<string>} Base64-encoded SHA-256 hash
 */
export async function hashDocumentoBase64(data) {
  let buffer;
  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data);
  } else if (data instanceof Uint8Array) {
    buffer = data;
  } else {
    buffer = new Uint8Array(data);
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashBytes = new Uint8Array(hashBuffer);
  // Convert to base64 safely for any size
  let binary = '';
  for (let i = 0; i < hashBytes.length; i++) {
    binary += String.fromCharCode(hashBytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert ArrayBuffer to hex string.
 */
function arrayBufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ═══════════════════════════════════════════════════════════════════
//  Cadena Original
// ═══════════════════════════════════════════════════════════════════

/**
 * Build the "cadena original" for a document.
 * Format: ||field1|field2|field3|...|fieldN||
 * @param {Array} fields - Array of field values
 * @returns {string} Cadena original string
 */
export function buildCadenaOriginal(fields) {
  const values = fields
    .filter((f) => f != null && f !== '')
    .map((f) => String(f).trim());
  return `||${values.join('|')}||`;
}

/**
 * Hash a file from a File object (e.g., from <input type="file">).
 * Returns both hex and base64 hashes.
 * @param {File} file - File object from file input
 * @returns {Promise<{ hex: string, base64: string, size: number, name: string }>}
 */
export async function hashArchivo(file) {
  const buffer = await file.arrayBuffer();
  const [hex, base64] = await Promise.all([
    hashDocumento(buffer),
    hashDocumentoBase64(buffer),
  ]);
  return {
    hex,
    base64,
    size: file.size,
    name: file.name,
  };
}
