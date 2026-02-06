# SCGMEX — Sistema de Contabilidad Gubernamental de Mexico

## Basado en la Ley General de Contabilidad Gubernamental (Reforma DOF 16-07-2025)
## Capacidad: Federal, Estatal y Municipal

---

## Stack Tecnologico

| Componente | Tecnologia | Razon |
|------------|-----------|-------|
| Frontend | **Vite + React 19 + TailwindCSS 4** | Consistente con proyecto actual, UI densa de datos |
| Backend/DB | **Supabase (PostgreSQL 15+)** | Gratis 500MB, Auth, RLS, Realtime, Edge Functions |
| Tablas | **@tanstack/react-table** | Tablas complejas con sort/filter/pagination |
| Formularios | **react-hook-form + zod** | Validacion critica para contabilidad |
| Estado servidor | **@tanstack/react-query** | Cache, real-time, optimistic updates |
| Estado cliente | **zustand** | Entidad activa, periodo, UI state |
| PDFs | **@react-pdf/renderer** | Estados financieros en PDF del lado cliente |
| Graficas | **recharts** | Dashboard e indicadores fiscales |
| Excel | **xlsx (SheetJS)** | Exportacion requerida para auditorias |
| Deploy frontend | **GitHub Pages** | Gratis, ya configurado |
| Deploy backend | **Supabase Free Tier** | 500MB DB, 50K usuarios, Edge Functions |

---

## Mapeo de Modulos vs Articulos de la Ley

| Modulo | Nombre | Articulos | Descripcion |
|--------|--------|-----------|-------------|
| M1 | Configuracion | Art. 1-4 | Entes publicos, ejercicios, periodos, nivel de gobierno |
| M2 | Catalogo de Cuentas | Art. 4, 37, 41 | Plan de cuentas CONAC, clasificadores, matrices de conversion |
| M3 | Contabilidad | Art. 16-22, 34-36, 40 | Polizas, libro diario, mayor, balanza, cierre |
| M4 | Presupuesto Egresos | Art. 38, 4-XIV a XVII | 6 momentos: aprobado→modificado→comprometido→devengado→ejercido→pagado |
| M5 | Presupuesto Ingresos | Art. 38 | 4 momentos: estimado→modificado→devengado→recaudado |
| M6 | Patrimonio | Art. 23-32 | Bienes muebles/inmuebles, inventarios, fideicomisos, entrega-recepcion |
| M7 | Deuda Publica | Art. 45-46 | Corto/largo plazo, interna/externa, por moneda/pais/fuente |
| M8 | Estados Financieros | Art. 46-48 | 19 reportes configurable por nivel de gobierno |
| M9 | Cuenta Publica | Art. 52-55 | Compilacion anual con analisis de postura fiscal |
| M10 | Transparencia | Art. 56-83 | Publicacion trimestral, portal ciudadano, 6 anios historicos |
| M11 | Fondos Federales | Art. 69-78 | FAIS, FORTAMUN, FASP, FAETA, FASSA |
| M12 | Seguridad/Auditoria | Art. 84-86 | Bitacora, RBAC, integridad, custodia documental |
| M13 | Dashboard | Transversal | Indicadores ejecutivos, alertas de cumplimiento |

---

## Esquema de Base de Datos (Tablas Principales)

### Configuracion (schema: public)
- `ente_publico` — Entidad gubernamental (nivel: federal/estatal/municipal, tipo: ejecutivo/legislativo/judicial/autonomo/paraestatal)
- `ejercicio_fiscal` — Ano fiscal con estado (abierto/en_cierre/cerrado)
- `periodo_contable` — Periodos mensuales (1-12 + 13 ajustes)
- `usuario_rol` — Asignacion usuario↔ente↔rol

### Catalogo (schema: catalogo)
- `plan_de_cuentas` — 5 niveles CONAC: Genero>Grupo>Rubro>Cuenta>Subcuenta (activo/pasivo/hacienda/ingresos/gastos/orden)
- `clasificador_presupuestal` — 7 tipos: administrativo, economico, funcional, programatico, objeto_gasto, geografico, fuente_financiamiento
- `matriz_conversion` — Vincula clasificador presupuestal ↔ cuenta contable + tipo movimiento (Art. 41)

### Contabilidad (schema: contabilidad)
- `poliza` — Asiento contable (tipo: ingreso/egreso/diario/ajuste/cierre), con validacion cuadrada (cargos=abonos)
- `movimiento_contable` — Lineas de poliza con cargo/abono + vinculo opcional a presupuesto
- `saldo_cuenta` — Saldos por periodo (materializado para rendimiento en tiempo real)

### Presupuesto (schema: presupuesto)
- `partida_presupuestal` — Linea presupuestal con los 6 momentos del gasto + multi-clasificador
- `movimiento_egreso` — Transacciones individuales por momento con vinculo a poliza contable
- `concepto_ingreso` — Linea de ley de ingresos con 4 momentos
- `movimiento_ingreso` — Transacciones de ingreso por momento
- `deuda_publica` — Instrumentos de deuda con todas las clasificaciones (Art. 46)
- `fondo_federal` — Fondos federales con cuenta bancaria productiva especifica (Art. 69)

### Patrimonio (schema: patrimonio)
- `bien` — Registro de bienes con valor, depreciacion, ubicacion, responsable, estado
- `inventario_fisico` — Levantamientos con conciliacion contable
- `fideicomiso` — Fideicomisos sin estructura organica (Art. 32)
- `acta_entrega_recepcion` — Transicion de administraciones (Art. 31)

### Transparencia (schema: transparencia)
- `publicacion` — Documentos publicados con control de plazo (30 dias) y cumplimiento

### Seguridad (schema: seguridad)
- `bitacora` — Auditoria completa: usuario, accion, tabla, datos antes/despues, IP, timestamp

---

## Registro Dual Automatico (Art. 40) — Mecanismo Clave

```
Usuario registra momento presupuestal (ej: devengado $50,000 partida 3311)
  → Sistema busca en matriz_conversion: clasificador 3311 + momento "devengado"
  → Resultado: Cargo cuenta 5.1.3.1, Abono cuenta 2.1.1.1
  → AUTO-GENERA poliza contable con ambos movimientos
  → Actualiza saldo_cuenta en tiempo real
  → Registra en bitacora de auditoria
```

---

## Reportes Configurables por Nivel de Gobierno

### Federal (Art. 46) — 19 reportes completos
**Contables:** Estado de actividades, Posicion financiera, Cambios en hacienda, Cambios situacion financiera, Flujos de efectivo, Pasivos contingentes, Notas, Analitico activo, Analitico deuda (4 desgloces)
**Presupuestales:** Analitico ingresos, Analitico egresos (4 clasificaciones), Endeudamiento neto, Intereses deuda, Flujo de fondos
**Programaticos:** Gasto por categoria, Programas inversion, Indicadores

### Estatal (Art. 47) — Igual que federal con deuda simplificada

### Municipal (Art. 48) — 10 reportes minimos
**Contables:** Actividades, Posicion financiera, Cambios hacienda, Cambios situacion, Flujos efectivo, Notas, Analitico activo
**Presupuestales:** Analitico ingresos, Analitico egresos

---

## Roles de Usuario (10 roles con RBAC via Supabase RLS)

| Rol | Acceso |
|-----|--------|
| super_admin | Todo el sistema, multiples entes |
| admin_ente | Todo su ente, gestiona usuarios |
| contador_general | Contabilidad completa, aprueba polizas, cierra periodos |
| contador | Crea polizas (no aprueba), registra momentos |
| presupuesto | Carga y modifica presupuesto, registra momentos |
| tesorero | Registra pagos, gestiona deuda |
| patrimonio | Registro de bienes, inventarios |
| auditor | Solo lectura total + bitacora + exportacion |
| transparencia | Gestiona publicaciones |
| consulta | Solo lectura basica, dashboards |

---

## Plan de Implementacion por Fases

### FASE 0: Bootstrap del Proyecto ✅ COMPLETADA
- Crear nuevo repo `scgmex` en GitHub
- Scaffolding Vite + React + TailwindCSS con tema institucional (azul/verde gobierno)
- Crear proyecto Supabase y conectar
- Layout base: sidebar, header con selector de ente/periodo, area principal
- Sistema de autenticacion (login/registro)
- Estructura de carpetas modular

### FASE 1: Fundacion — Configuracion + Catalogo (Semana 3-6)
**Modulos M1, M2, M12 parcial**
- CRUD entes publicos con configuracion por nivel de gobierno
- Gestion de ejercicios fiscales y periodos
- Plan de cuentas con navegador jerarquico de 5 niveles
- Carga de catalogo CONAC estandar (datos semilla)
- 7 clasificadores presupuestales
- Editor de matrices de conversion
- RBAC con politicas RLS
- Bitacora de auditoria automatica (triggers)

### FASE 2: Motor Contable (Semana 7-12)
**Modulo M3**
- Formulario de polizas con multiples lineas y selector de cuentas
- Validacion partida doble (cargos = abonos)
- Workflow de aprobacion (borrador→pendiente→aprobada)
- Libro Diario y Libro Mayor
- Balanza de Comprobacion
- Motor de calculo de saldos (triggers + materialized)
- Cierre de periodo y cierre de ejercicio
- Actualizacion en tiempo real via Supabase Realtime (Art. 19-VI)

### FASE 3: Presupuesto de Egresos (Semana 13-18)
**Modulo M4**
- Carga de presupuesto aprobado
- Gestion de partidas con multi-clasificador
- Workflow de 6 momentos del gasto con validaciones de secuencia
- **Registro dual automatico** (Art. 40): momento presupuestal → poliza contable
- Modificaciones presupuestales (adiciones, reducciones, transferencias)
- Verificacion de disponibilidad presupuestal
- Calendarios mensuales
- Comparativo presupuesto vs ejercido

### FASE 4: Presupuesto de Ingresos + Primeros Reportes (Semana 19-22)
**Modulos M5, M8 parcial**
- Carga de Ley de Ingresos
- 4 momentos del ingreso con registro dual
- Calendarios de recaudacion
- Infraestructura de generacion PDF
- Primeros estados financieros: Posicion financiera, Actividades, Balanza, Ejecucion presupuestal

### FASE 5: Registro Patrimonial (Semana 23-26)
**Modulo M6**
- CRUD de bienes con todos los campos requeridos
- Interrelacion contable automatica (alta/baja genera poliza)
- Control de plazo 30 dias (Art. 27)
- Inventario fisico con conciliacion
- Obras en proceso, depreciacion, bajas
- Fideicomisos (Art. 32)
- Acta entrega-recepcion (Art. 31)

### FASE 6: Estados Financieros Completos (Semana 27-30)
**Modulos M8 completo, M9**
- 19 reportes contables/presupuestales/programaticos
- Configuracion automatica por nivel de gobierno (Art. 46/47/48)
- Generacion PDF con formato oficial
- Exportacion Excel
- Compilador de Cuenta Publica (Art. 52-55)

### FASE 7: Deuda, Fondos Federales y Transparencia (Semana 31-36)
**Modulos M7, M10, M11**
- Gestion de deuda publica (todas las clasificaciones)
- Fondos federales: FAIS, FORTAMUN, FASP, FAETA, FASSA
- Motor de publicacion trimestral con control de plazos
- Portal publico ciudadano (solo lectura)
- Documentos ciudadanos (Art. 62)
- Mantenimiento de 6 ejercicios historicos (Art. 58)

### FASE 8: Dashboard, Analitica y Pulido (Semana 37-40)
**Modulo M13**
- Dashboard ejecutivo con indicadores clave
- Progreso de ejecucion presupuestal
- Avance de recaudacion
- Sistema de alertas de cumplimiento
- Pruebas integrales
- Manual de usuario en espanol

---

## Estructura del Proyecto Frontend

```
scgmex/src/
├── config/           (supabase.js, routes.js, constants.js, nivelGobierno.js)
├── components/
│   ├── layout/       (AppShell, Sidebar, Header, Breadcrumb)
│   ├── ui/           (Button, Input, DataTable, TreeView, Modal, MoneyInput...)
│   └── shared/       (CuentaSelector, ClasificadorSelector, PeriodoSelector)
├── modules/
│   ├── auth/         (Login, Registro)
│   ├── configuracion/  (M1: Entes, Ejercicios, Periodos)
│   ├── catalogo/       (M2: Plan cuentas, Clasificadores, Matrices)
│   ├── contabilidad/   (M3: Polizas, Diario, Mayor, Balanza)
│   ├── presupuesto-egresos/  (M4: Partidas, Momentos gasto)
│   ├── presupuesto-ingresos/ (M5: Conceptos, Momentos ingreso)
│   ├── patrimonio/     (M6: Bienes, Inventarios, Fideicomisos)
│   ├── deuda/          (M7: Instrumentos deuda)
│   ├── reportes/       (M8: 19 estados financieros + PDF)
│   ├── cuenta-publica/ (M9: Compilador anual)
│   ├── transparencia/  (M10: Publicaciones, Portal ciudadano)
│   ├── fondos-federales/ (M11: FAIS, FORTAMUN, etc.)
│   ├── seguridad/      (M12: Bitacora, Usuarios, Roles)
│   └── dashboard/      (M13: Indicadores, Alertas)
├── hooks/            (useAuth, useEntePublico, useEjercicio, usePeriodo, useRol)
├── stores/           (appStore.js con zustand)
└── utils/            (formatters, validators, pdfHelpers, exportExcel)
```

---

## Verificacion / Testing

- Login funcional con multiples roles
- Crear ente publico municipal, estatal y federal
- Cargar catalogo CONAC y verificar jerarquia
- Crear poliza, verificar partida doble, aprobar
- Registrar momento presupuestal y verificar poliza auto-generada (Art. 40)
- Generar balanza de comprobacion y verificar cuadre
- Generar estado de posicion financiera en PDF
- Registrar bien, verificar poliza automatica y plazo 30 dias
- Publicar informe trimestral y verificar en portal publico
- Verificar bitacora de auditoria registra todas las operaciones
- `npm run build` sin errores
- Deploy a GitHub Pages + Supabase funcional
