# SCGMEX — Manual de Usuario
## Sistema de Contabilidad Gubernamental de Mexico

**Version:** 1.0
**Normatividad:** Ley General de Contabilidad Gubernamental (LGCG)
**Ejemplo guia:** Universidad Estatal de Ciencias y Tecnologia (UECYT)

---

## Tabla de Contenidos

1. [Introduccion](#1-introduccion)
2. [Acceso al Sistema](#2-acceso-al-sistema)
3. [Navegacion General](#3-navegacion-general)
4. [Configuracion Inicial](#4-configuracion-inicial-del-sistema)
5. [Catalogos Contables](#5-catalogos-contables)
6. [Contabilidad (Motor Contable)](#6-contabilidad-motor-contable)
7. [Presupuesto de Egresos](#7-presupuesto-de-egresos)
8. [Presupuesto de Ingresos](#8-presupuesto-de-ingresos)
9. [Patrimonio](#9-patrimonio)
10. [Deuda Publica](#10-deuda-publica)
11. [Fondos Federales](#11-fondos-federales)
12. [Reportes y Estados Financieros](#12-reportes-y-estados-financieros)
13. [Cuenta Publica](#13-cuenta-publica)
14. [Transparencia](#14-transparencia)
15. [Seguridad y Administracion](#15-seguridad-y-administracion)
16. [Flujo de Trabajo Diario](#16-flujo-de-trabajo-diario-resumen)
17. [Preguntas Frecuentes](#17-preguntas-frecuentes)

---

## 1. Introduccion

### Que es SCGMEX?

SCGMEX es un **Sistema de Contabilidad Gubernamental** disenado para cumplir con la Ley General de Contabilidad Gubernamental (LGCG) de Mexico. Permite a las entidades publicas (municipios, universidades estatales, organismos autonomos, etc.) llevar su contabilidad, presupuesto, patrimonio, deuda y generar los reportes que exige la ley.

### Para que sirve?

Imagina que eres el area de contabilidad de la **Universidad Estatal de Ciencias y Tecnologia (UECYT)**. Cada mes necesitas:

- Registrar todas las operaciones contables (compras, pagos de nomina, cobro de colegiaturas, etc.)
- Llevar el control del presupuesto aprobado por el Congreso
- Saber cuanto has gastado y cuanto te queda
- Controlar los bienes de la universidad (edificios, computadoras, vehiculos)
- Generar los estados financieros que te pide la LGCG
- Entregar la Cuenta Publica al organo fiscalizador
- Publicar informacion de transparencia

SCGMEX hace todo esto en un solo sistema.

### Conceptos fundamentales

| Concepto | Que es | Ejemplo UECYT |
|----------|--------|----------------|
| **Ente Publico** | La entidad que lleva la contabilidad | Universidad Estatal de Ciencias y Tecnologia |
| **Ejercicio Fiscal** | El ano contable (enero a diciembre) | Ejercicio 2026 |
| **Periodo Contable** | Cada mes del ejercicio (13 periodos: 12 meses + ajustes) | Enero 2026, Febrero 2026, etc. |
| **Plan de Cuentas** | Catalogo de cuentas contables (basado en CONAC) | 1.1.1 Efectivo y Equivalentes |
| **Poliza** | El registro de una operacion contable con partida doble | Poliza de pago de nomina |
| **Momento Contable** | Las etapas por las que pasa un gasto o ingreso | Aprobado → Comprometido → Devengado → Pagado |
| **Partida Presupuestal** | Una linea del presupuesto de egresos | Partida 1000 - Servicios Personales |

---

## 2. Acceso al Sistema

### Pantalla de Inicio de Sesion

Al abrir SCGMEX, veras una pantalla de login con el escudo del sistema y dos campos:

- **Correo electronico**: Tu email institucional (ej. `contabilidad@uecyt.edu.mx`)
- **Contrasena**: Tu contrasena asignada por el administrador

Haz clic en **"Iniciar Sesion"**. El sistema verificara tus credenciales y te llevara al Dashboard.

> **Nota:** Si las credenciales son incorrectas, veras el mensaje "Credenciales invalidas". Contacta al administrador si olvidaste tu contrasena.

### Roles de usuario

Tu administrador te asigna un rol que determina que puedes ver y hacer:

| Rol | Que puede hacer | Quien lo usa |
|-----|-----------------|--------------|
| **Super Admin** | Todo. Gestionar entes, usuarios, configuracion completa | Director de TI |
| **Admin Ente** | Administrar todo dentro de su ente | Director de Finanzas |
| **Contador General** | Aprobar polizas, gestionar contabilidad completa | Contador General de la universidad |
| **Contador** | Crear y editar polizas, registrar operaciones | Personal del area contable |
| **Presupuesto** | Gestionar partidas y momentos presupuestarios | Area de Presupuesto |
| **Tesorero** | Gestion de fondos y tesoreria | Tesorero |
| **Patrimonio** | Gestion de bienes e inventarios | Area de Control Patrimonial |
| **Auditor** | Solo lectura de todo el sistema | Auditor interno / OIC |
| **Transparencia** | Generar reportes de transparencia | Unidad de Transparencia |
| **Consulta** | Solo lectura basica | Directivos que necesitan consultar |

---

## 3. Navegacion General

### Estructura de la pantalla

Al iniciar sesion, el sistema se divide en tres areas:

```
+------------------+--------------------------------------------+
|                  |            BARRA SUPERIOR                  |
|                  |  (Ente activo, ejercicio, menu usuario)    |
|    BARRA         +--------------------------------------------+
|    LATERAL       |                                            |
|    (SIDEBAR)     |          AREA DE CONTENIDO                 |
|                  |    (Aqui se muestran las pantallas)        |
|   - Dashboard    |                                            |
|   - Contabilidad |                                            |
|   - Presupuesto  |                                            |
|   - Patrimonio   |                                            |
|   - Catalogos    |                                            |
|   - Sistema      |                                            |
|   - Reportes     |                                            |
|                  |                                            |
+------------------+--------------------------------------------+
```

### Barra lateral (Sidebar)

La barra lateral oscura a la izquierda es tu menu principal. Se organiza en secciones:

| Seccion | Opciones |
|---------|----------|
| **Dashboard** | Pantalla principal con resumen |
| **Contabilidad** | Polizas, Libro Diario, Libro Mayor, Balanza |
| **Presupuesto** | Egresos (Resumen, Partidas, Momentos), Ingresos (Resumen, Conceptos, Momentos) |
| **Patrimonio** | Bienes, Inventarios, Fideicomisos |
| **Catalogos** | Plan de Cuentas, Clasificadores, Matrices |
| **Sistema** | Entes Publicos, Ejercicios, Periodos, Usuarios, Bitacora |
| **Reportes** | Estados Financieros |
| **Deuda Publica** | Control de deuda |
| **Transparencia** | Reportes LGCG |
| **Cuenta Publica** | Paquete anual |
| **Fondos Federales** | Control de fondos |

> **Nota:** Solo veras las opciones que tu rol te permite. Un usuario con rol "Presupuesto" no vera las opciones de Seguridad, por ejemplo.

### Dashboard (Pantalla Principal)

El Dashboard muestra un resumen ejecutivo con:

- **4 tarjetas de resumen**: Presupuesto Aprobado, Presupuesto Ejercido, Ingresos Recaudados, Deuda Publica
- **Polizas recientes**: Las ultimas 5 polizas registradas
- **Alertas**: Polizas pendientes de aprobar, ejecucion presupuestal baja, etc.
- **Avance del Ejercicio**: Barras de progreso de ejecucion presupuestal, recaudacion de ingresos y ejercicio de fondos federales

**Ejemplo para UECYT:**

```
Presupuesto Aprobado:    $185,500,000.00
Presupuesto Ejercido:    $45,385,000.00  (24.5% del aprobado)
Ingresos Recaudados:     $52,100,000.00  (31.2% del estimado)
Deuda Publica:           $12,000,000.00
```

---

## 4. Configuracion Inicial del Sistema

Antes de comenzar a operar, el administrador debe configurar tres cosas en orden:

### 4.1 Entes Publicos

**Ruta:** Sistema → Entes Publicos

Aqui se registra la entidad. Para nuestra universidad:

1. Haz clic en **"Nuevo Ente"**
2. Llena los campos:

| Campo | Valor ejemplo |
|-------|---------------|
| Clave | UECYT-001 |
| Nombre completo | Universidad Estatal de Ciencias y Tecnologia |
| Nombre corto | UECYT |
| RFC | UEC860101XX1 |
| Nivel de Gobierno | Estatal |
| Tipo de Ente | Autonomo |
| Entidad Federativa | Estado de Mexico |
| Titular | Dra. Maria Lopez Hernandez |
| Domicilio | Av. Universidad 100, Col. Centro, Toluca, Edo. Mex. |
| Activo | (marcado) |

3. Haz clic en **"Crear"**

> **Importante:** Solo necesitas hacer esto una vez. Despues de crearlo, el ente aparece seleccionado en la barra superior.

### 4.2 Ejercicios Fiscales

**Ruta:** Sistema → Ejercicios Fiscales

Un ejercicio fiscal es el ano contable. Para comenzar a trabajar en 2026:

1. Haz clic en **"Nuevo Ejercicio"**
2. Llena:

| Campo | Valor |
|-------|-------|
| Ano | 2026 |
| Fecha Inicio | 2026-01-01 |
| Fecha Fin | 2026-12-31 |
| Estado | Abierto |

3. Haz clic en **"Crear"**

**Resultado automatico:** El sistema genera automaticamente **13 periodos contables**:
- Periodos 1 al 12: Enero a Diciembre
- Periodo 13: Ajustes (para asientos de cierre al final del ano)

### 4.3 Periodos Contables

**Ruta:** Sistema → Periodos Contables

Aqui ves los 13 periodos generados. La funcion principal es **abrir y cerrar periodos**.

- Un periodo **abierto** permite registrar polizas y movimientos en el
- Un periodo **cerrado** impide modificaciones (protege la informacion ya reportada)

**Operacion tipica:**
- Al inicio del mes, el Contador General **abre** el periodo correspondiente
- Al terminar el mes, despues de conciliar, **cierra** el periodo

Para abrir/cerrar un periodo:
- Localiza el periodo en la tabla (ej. "Febrero")
- Haz clic en el boton de estado: **"Abrir"** o **"Cerrar"**

> **Ejemplo:** Es 1 de marzo. Abres el periodo "Marzo" y cierras "Febrero" porque ya terminaste la conciliacion del mes.

---

## 5. Catalogos Contables

### 5.1 Plan de Cuentas

**Ruta:** Catalogos → Plan de Cuentas

El Plan de Cuentas es la columna vertebral del sistema. Es el catalogo de TODAS las cuentas contables, basado en el Plan de Cuentas del CONAC (Consejo Nacional de Armonizacion Contable).

#### Estructura jerarquica (5 niveles)

```
Nivel 1 - Genero      → 1 Activo
Nivel 2 - Grupo       →   1.1 Activo Circulante
Nivel 3 - Rubro       →     1.1.1 Efectivo y Equivalentes
Nivel 4 - Cuenta      →       1.1.1.1 Caja General
Nivel 5 - Subcuenta   →         1.1.1.1.1 Caja Chica Rectoria
```

#### Pantalla dividida

La pantalla se divide en dos:
- **Panel izquierdo (arbol)**: Muestra la jerarquia de cuentas como un arbol expandible. Puedes buscar escribiendo en la barra de busqueda.
- **Panel derecho (detalle)**: Muestra la informacion de la cuenta seleccionada.

#### Tipos de cuenta

| Tipo | Color | Que es | Ejemplo UECYT |
|------|-------|--------|----------------|
| Activo | Azul | Lo que la universidad posee | Bancos, Edificios, Vehiculos |
| Pasivo | Rojo | Lo que la universidad debe | Proveedores, Impuestos por pagar |
| Hacienda Publica | Celeste | El patrimonio neto | Resultados de ejercicios anteriores |
| Ingresos | Verde | Dinero que entra | Cuotas de inscripcion, Subsidios |
| Gastos | Naranja | Dinero que se gasta | Sueldos, Materiales, Servicios |
| Cierre Contable | Gris | Cuentas de cierre al fin del ano | Resultado del ejercicio |
| Orden Contable | Gris | Cuentas memorando | Bienes en comodato |
| Orden Presupuestario | Gris | Control presupuestal | Presupuesto de egresos aprobado |

#### Naturaleza

- **Deudora**: Su saldo normal es Debe (Activos, Gastos)
- **Acreedora**: Su saldo normal es Haber (Pasivos, Hacienda, Ingresos)

#### Cuenta de detalle

Solo las **cuentas de detalle** permiten registrar movimientos contables (polizas). Son las cuentas del ultimo nivel que usas en la operacion diaria.

- Una cuenta de detalle tiene marcada la casilla **"Cuenta de detalle (permite movimientos)"**
- Las cuentas de niveles superiores (genero, grupo, rubro) son **acumuladoras** — solo suman los saldos de sus hijas

#### Como crear una cuenta nueva

**Ejemplo:** Necesitas crear una subcuenta de Bancos para la cuenta de BBVA de la universidad.

1. En el arbol, navega a: **1 Activo → 1.1 Activo Circulante → 1.1.1 Efectivo y Equivalentes → 1.1.1.2 Bancos**
2. Selecciona "1.1.1.2 Bancos"
3. En el panel derecho, haz clic en **"Nueva Cuenta Hija"**
4. El sistema abre el formulario con:
   - Nivel: 5 (Subcuenta) — calculado automaticamente
   - Codigo: pre-llenado con "1.1.1.2." (agrega el numero, ej: "1.1.1.2.1")
   - Tipo de cuenta: Activo (heredado del padre)
   - Naturaleza: Deudora (heredada del padre)
5. Completa:

| Campo | Valor |
|-------|-------|
| Codigo | 1.1.1.2.1 |
| Nombre | BBVA Cuenta 0123456789 |
| Cuenta de detalle | (marcado) |
| Activa | (marcado) |

6. Haz clic en **"Crear"**

> **Regla importante:** Solo puedes eliminar una cuenta si no tiene cuentas hijas. Si quieres desactivarla sin eliminarla, desmarca la casilla "Activa".

### 5.2 Clasificadores Presupuestales

**Ruta:** Catalogos → Clasificadores

Los clasificadores son catalogos normativos del CONAC que permiten clasificar el presupuesto desde diferentes angulos. Hay **7 tipos** organizados en pestanas:

| Clasificador | Que clasifica | Ejemplo UECYT |
|--------------|---------------|----------------|
| **Objeto del Gasto** | En que se gasta | 1000 Servicios Personales, 2000 Materiales |
| **Funcional** | Para que funcion | Educacion, Investigacion, Extension |
| **Administrativo** | Quien gasta | Rectoria, Facultad de Ingenieria |
| **Economico** | Naturaleza economica | Gasto corriente, Gasto de inversion |
| **Programatico** | En que programa | Programa de Becas, Infraestructura |
| **Geografico** | Donde se gasta | Toluca, Texcoco, Ecatepec |
| **Fuente de Financiamiento** | Con que dinero | Recursos propios, Subsidio federal |

#### Como usarlos

1. Selecciona la pestana del tipo de clasificador (ej. "Objeto del Gasto")
2. Veras la lista de clasificadores de ese tipo
3. Para agregar uno nuevo: clic en **"+ Nuevo clasificador"**
4. Llena:

| Campo | Valor ejemplo |
|-------|---------------|
| Tipo | Objeto del Gasto (automatico) |
| Codigo | 1131 |
| Nombre | Sueldos base al personal permanente |
| Nivel | 4 |
| Clasificador padre | 1100 Personal permanente (opcional) |
| Activo | (marcado) |

### 5.3 Matrices de Conversion

**Ruta:** Catalogos → Matrices

Las matrices son **reglas de conversion** que vinculan el presupuesto con la contabilidad. Cuando registras un movimiento presupuestal, el sistema puede generar automaticamente el asiento contable correspondiente.

**Ejemplo:** Cuando la universidad registra el momento "Devengado" en la partida de sueldos, automaticamente debe cargarse la cuenta de Gastos por Sueldos y abonarse la cuenta de Sueldos por Pagar.

| Campo | Valor ejemplo |
|-------|---------------|
| Clasificador presupuestal | 1131 — Sueldos base al personal permanente |
| Momento contable | Devengado |
| Cuenta de cargo | 5.1.1.1 Sueldos Base al Personal Permanente |
| Cuenta de abono | 2.1.1.2 Sueldos y Salarios por Pagar |
| Descripcion | Devengado de nomina — cargo a gasto, abono a pasivo |
| Activo | (marcado) |

> **Nota:** Esta configuracion es crucial para la automatizacion. Sin matrices, tendrias que crear manualmente las polizas contables para cada movimiento presupuestal.

---

## 6. Contabilidad (Motor Contable)

Este es el corazon del sistema. Aqui se registran todas las operaciones contables mediante **polizas**.

### 6.1 Polizas Contables

**Ruta:** Contabilidad → Polizas

#### Que es una poliza?

Una poliza es el documento que registra una operacion contable usando el principio de **partida doble**: todo cargo tiene un abono y viceversa. Es decir, la suma de Debe siempre debe ser igual a la suma de Haber.

#### Tipos de poliza

| Tipo | Cuando se usa | Ejemplo UECYT |
|------|---------------|----------------|
| **Diario** | Operaciones generales | Depreciacion mensual, Provisiones |
| **Ingreso** | Cuando entra dinero | Cobro de colegiaturas, Recepcion de subsidio |
| **Egreso** | Cuando sale dinero | Pago a proveedores, Pago de nomina |

#### Lista de polizas

La pantalla muestra una tabla con todas las polizas del ejercicio. Puedes filtrar por:
- **Periodo**: Para ver solo las polizas de un mes especifico
- **Tipo**: Diario, Ingreso, Egreso
- **Estado**: Borrador, Pendiente, Aprobada, Cancelada

Cada poliza muestra: Numero (ej. POL-2026-0001), Fecha, Tipo, Descripcion, Total y Estado.

#### Como crear una poliza nueva

**Ejemplo:** La universidad paga la nomina de enero por $2,500,000.

1. Haz clic en **"Nueva Poliza"**
2. Se abre el formulario de poliza:

**Datos de cabecera:**

| Campo | Valor |
|-------|-------|
| Tipo | Egreso |
| Numero | (se asigna automaticamente) |
| Fecha | 2026-01-31 |
| Periodo | Enero |
| Descripcion | Pago de nomina quincenal segunda quincena enero 2026 |

**Movimientos (lineas de la poliza):**

Agrega las lineas de cargo y abono:

| # | Cuenta | Concepto | Debe | Haber |
|---|--------|----------|------|-------|
| 1 | 5.1.1.1 Sueldos Base | Nomina 2da Qna Ene | $2,000,000.00 | |
| 2 | 5.1.1.3 Prestaciones | Aguinaldo proporcional | $500,000.00 | |
| 3 | 1.1.1.2.1 BBVA 0123456789 | Pago nomina | | $2,500,000.00 |

**Barra de balance (en la parte inferior):**
```
Total Debe: $2,500,000.00    Total Haber: $2,500,000.00    Diferencia: $0.00 ✓
```

La diferencia debe ser **$0.00** (verde). Si hay diferencia, se muestra en rojo y no podras guardar.

3. Para seleccionar una cuenta, haz clic en el campo "Cuenta" de una linea. Se abre un buscador donde puedes escribir el codigo o nombre de la cuenta.

4. Para agregar mas lineas, haz clic en **"+ Agregar linea"**

5. **Guardar:**
   - **"Guardar Borrador"**: Guarda la poliza como borrador. Podras editarla despues.
   - **"Enviar a Aprobacion"**: Cambia el estado a "Pendiente" para que el Contador General la revise.

> **Regla:** Cuando escribes un monto en "Debe", el campo "Haber" de esa linea se limpia automaticamente, y viceversa. Cada linea solo puede tener Debe O Haber, nunca ambos.

#### Flujo de estados de una poliza

```
                    ┌──────────┐
                    │ BORRADOR │
                    └────┬─────┘
                         │ (Enviar a aprobacion)
                         ▼
                    ┌──────────┐
              ┌─────│ PENDIENTE│─────┐
              │     └──────────┘     │
              │ (Regresar)      (Aprobar)
              ▼                      ▼
         ┌──────────┐         ┌──────────┐
         │ BORRADOR │         │ APROBADA │
         └──────────┘         └────┬─────┘
                                   │ (Cancelar con motivo)
                                   ▼
                              ┌──────────┐
                              │CANCELADA │
                              └──────────┘
```

- **Borrador**: Se puede editar libremente
- **Pendiente**: No se puede editar, espera aprobacion
- **Aprobada**: No se puede editar, ya afecto saldos. Solo se puede cancelar (con motivo obligatorio)
- **Cancelada**: Estado final, no se puede revertir

> **Quien aprueba?** Solo usuarios con rol **super_admin** o **contador_general** ven los botones de "Aprobar" y "Regresar a Borrador".

#### Ejemplo completo: Pago de servicios basicos

La universidad recibe la factura de CFE por $85,000 de luz del campus:

| # | Cuenta | Concepto | Debe | Haber |
|---|--------|----------|------|-------|
| 1 | 5.1.3.1 Energia Electrica | Factura CFE Ene-2026 | $85,000.00 | |
| 2 | 2.1.1.1 Proveedores por Pagar | CFE | | $85,000.00 |

Y despues, cuando se paga:

| # | Cuenta | Concepto | Debe | Haber |
|---|--------|----------|------|-------|
| 1 | 2.1.1.1 Proveedores por Pagar | Pago CFE | $85,000.00 | |
| 2 | 1.1.1.2.1 BBVA 0123456789 | Transferencia CFE | | $85,000.00 |

### 6.2 Libro Diario

**Ruta:** Contabilidad → Libro Diario

El Libro Diario muestra cronologicamente todas las polizas **aprobadas** de un periodo, con sus movimientos detallados. Es un reporte de consulta — no se edita aqui.

**Como usarlo:**
1. Selecciona el **Periodo** (ej. Enero)
2. El sistema muestra cada poliza como una tarjeta expandible
3. Dentro de cada poliza ves: numero, fecha, tipo, y la tabla de movimientos con Debe/Haber
4. Cada poliza tiene un total al pie

**Exportar:**
- Haz clic en **"Exportar XLSX"** para descargar en formato Excel
- Haz clic en **"Exportar PDF"** para descargar como documento PDF

**Ejemplo de lo que ves:**

```
┌─ POL-2026-0001 ── Poliza de Ingreso ── 15/01/2026 ─────────────┐
│ Pago de inscripciones semestre 2026-1                            │
│                                                                   │
│ Cuenta                          Concepto      Debe        Haber  │
│ 1.1.1.2.1 BBVA 0123456789     Deposito    $850,000              │
│ 4.1.1.1 Cuotas de Inscripcion Sem 2026-1              $850,000  │
│                                 ─────────  ─────────  ─────────  │
│                                 Total:     $850,000    $850,000  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Libro Mayor

**Ruta:** Contabilidad → Libro Mayor

El Libro Mayor agrupa los movimientos **por cuenta contable**, mostrando un saldo acumulado (running balance). Es el reporte clave para saber el saldo de cada cuenta.

**Como usarlo:**
1. Selecciona el **Periodo**
2. El sistema muestra una tarjeta por cada cuenta que tuvo movimientos
3. Dentro de cada cuenta ves: fecha, poliza, concepto, debe, haber, y **saldo acumulado**

**Calculo del saldo:**
- Cuentas **deudoras** (Activo, Gastos): Saldo = +Debe - Haber
- Cuentas **acreedoras** (Pasivo, Hacienda, Ingresos): Saldo = +Haber - Debe

**Ejemplo:**

```
┌─ 1.1.1.2.1 BBVA 0123456789 ─── Naturaleza: Deudora ───────────┐
│                                                                   │
│ Fecha      Poliza          Concepto           Debe     Haber   Saldo │
│ 15/01/26   POL-2026-0001  Deposito inscrip.  $850,000          $850,000 │
│ 20/01/26   POL-2026-0003  Pago luz                    $85,000  $765,000 │
│ 31/01/26   POL-2026-0005  Pago nomina                $2,500,000 -$1,735,000 │
│                            ─────────  ────────  ────── ─────── │
│                            Total:     $850,000 $2,585,000 -$1,735,000 │
└──────────────────────────────────────────────────────────────────┘
```

### 6.4 Balanza de Comprobacion

**Ruta:** Contabilidad → Balanza de Comprobacion

La Balanza muestra un resumen de **todas las cuentas** con: saldo inicial, movimientos del periodo (debe/haber) y saldo final. Es el reporte que se entrega al CONAC trimestralmente.

**Columnas:**

| Codigo | Nombre | Saldo Inicial | Debe | Haber | Saldo Final |
|--------|--------|---------------|------|-------|-------------|
| 1.1.1.2.1 | BBVA 0123456789 | $0.00 | $850,000.00 | $2,585,000.00 | -$1,735,000.00 |
| 2.1.1.1 | Proveedores por Pagar | $0.00 | $85,000.00 | $85,000.00 | $0.00 |
| 5.1.1.1 | Sueldos Base | $0.00 | $2,000,000.00 | $0.00 | $2,000,000.00 |
| ... | ... | ... | ... | ... | ... |
| | **TOTALES** | **$0.00** | **$X** | **$X** | **$X** |

> **Regla LGCG:** Los totales de Debe y Haber siempre deben ser iguales. Si no lo son, hay un error.

---

## 7. Presupuesto de Egresos

El presupuesto de egresos es el plan de cuanto va a gastar la universidad y en que.

### 7.1 Resumen de Presupuesto de Egresos

**Ruta:** Presupuesto → Egresos → Resumen

Muestra un tablero con tarjetas de resumen por cada **momento del gasto**:

| Momento | Que significa | Ejemplo |
|---------|---------------|---------|
| **Aprobado** | El monto autorizado por el Congreso/Consejo | $185,500,000 |
| **Modificado** | Aprobado + adiciones - reducciones del ejercicio | $187,200,000 |
| **Comprometido** | Contratos y pedidos firmados | $95,000,000 |
| **Devengado** | Bienes/servicios ya recibidos | $65,000,000 |
| **Ejercido** | Ordenes de pago emitidas | $50,000,000 |
| **Pagado** | Dinero ya desembolsado | $45,385,000 |

Abajo muestra una tabla con cada partida presupuestal y los montos en cada momento.

### 7.2 Partidas Presupuestales

**Ruta:** Presupuesto → Egresos → Partidas

Aqui creas el catalogo de partidas de gasto. Cada partida es una linea del presupuesto.

**Como crear una partida:**

1. Haz clic en **"+ Nueva Partida"**
2. Llena:

| Campo | Valor ejemplo |
|-------|---------------|
| Clave | 1000 |
| Descripcion | Servicios Personales — Sueldos y prestaciones del personal de la universidad |
| COG (Objeto del Gasto) | 1000 — Servicios Personales |
| Fuente Financiamiento | RF01 — Recursos Propios |
| Activo | (marcado) |

3. Haz clic en **"Crear partida"**

**Partidas tipicas para una universidad:**

| Clave | Descripcion | COG |
|-------|-------------|-----|
| 1000 | Servicios Personales | 1000 Servicios Personales |
| 2000 | Materiales y Suministros | 2000 Materiales y Suministros |
| 3000 | Servicios Generales | 3000 Servicios Generales |
| 5000 | Bienes Muebles e Inmuebles | 5000 Bienes Muebles, Inmuebles e Intangibles |
| 6000 | Obra Publica | 6000 Inversion Publica |
| 4000 | Transferencias y Subsidios (Becas) | 4000 Transferencias |

### 7.3 Momentos del Gasto

**Ruta:** Presupuesto → Egresos → Momentos

Aqui registras los movimientos presupuestarios en cada **momento contable**. Funciona con pestanas — una por cada momento.

#### Tipos de movimiento

| Tipo | Que es | Cuando se usa |
|------|--------|---------------|
| **Original** | El monto inicial aprobado | Al inicio del ejercicio |
| **Adicion** | Un aumento al presupuesto | Cuando se aprueba mas dinero |
| **Reduccion** | Una disminucion al presupuesto | Cuando se recorta presupuesto |

#### Ejemplo paso a paso: Registrar el presupuesto aprobado

Al inicio del ejercicio, la universidad recibio su presupuesto aprobado. Necesitas registrarlo:

1. Selecciona la pestana **"Aprobado"**
2. Haz clic en **"+ Registrar Movimiento"**
3. Para la partida de Servicios Personales:

| Campo | Valor |
|-------|-------|
| Momento contable | Aprobado (automatico) |
| Partida | 1000 — Servicios Personales |
| Periodo contable | Enero |
| Tipo de movimiento | Original |
| Monto | $120,000,000.00 |
| Descripcion | Presupuesto aprobado PEF 2026 |
| Fecha | 2026-01-01 |

4. Haz clic en **"Registrar movimiento"**
5. Repite para cada partida

#### Ejemplo: Registrar un compromiso

La universidad firma un contrato de mantenimiento por $500,000:

1. Selecciona la pestana **"Comprometido"**
2. Haz clic en **"+ Registrar Movimiento"**

| Campo | Valor |
|-------|-------|
| Momento | Comprometido (automatico) |
| Partida | 3000 — Servicios Generales |
| Periodo | Marzo |
| Tipo | Original |
| Monto | $500,000.00 |
| Descripcion | Contrato MANT-2026-015 mantenimiento edificio A |
| Fecha | 2026-03-15 |

3. Haz clic en **"Registrar movimiento"**

**Filtrar movimientos:**
- Usa el filtro de **Partida** para ver solo los movimientos de una partida especifica
- Usa el filtro de **Periodo** para ver solo un mes

**Exportar:**
- Haz clic en **"Exportar Excel"** para descargar la informacion del momento seleccionado

---

## 8. Presupuesto de Ingresos

El presupuesto de ingresos es el plan de cuanto espera recaudar la universidad.

### 8.1 Resumen de Presupuesto de Ingresos

**Ruta:** Presupuesto → Ingresos → Resumen

Muestra tarjetas de resumen por cada momento del ingreso:

| Momento | Que significa | Ejemplo |
|---------|---------------|---------|
| **Estimado** | Lo que se espera recaudar | $167,000,000 |
| **Modificado** | Estimado + ajustes | $170,500,000 |
| **Devengado** | Derecho al cobro generado | $85,000,000 |
| **Recaudado** | Dinero efectivamente cobrado | $52,100,000 |

### 8.2 Conceptos de Ingreso

**Ruta:** Presupuesto → Ingresos → Conceptos

Similar a las partidas de egreso, pero para ingresos.

**Conceptos tipicos para una universidad:**

| Clave | Descripcion | Clasificador |
|-------|-------------|--------------|
| I001 | Cuotas de Inscripcion y Colegiaturas | 4100 — Ingresos Propios |
| I002 | Subsidio Federal Ordinario | 4200 — Participaciones Federales |
| I003 | Subsidio Estatal | 4300 — Aportaciones Estatales |
| I004 | Ingresos por Educacion Continua | 4100 — Ingresos Propios |
| I005 | Servicios de Laboratorio | 4100 — Ingresos Propios |
| I006 | Rendimientos Financieros | 4500 — Productos Financieros |

### 8.3 Momentos del Ingreso

**Ruta:** Presupuesto → Ingresos → Momentos

Funciona igual que los momentos del gasto, con pestanas por momento.

**Ejemplo:** Registrar el ingreso estimado de colegiaturas:

1. Selecciona la pestana **"Estimado"**
2. Haz clic en **"+ Registrar Movimiento"**

| Campo | Valor |
|-------|-------|
| Momento | Estimado (automatico) |
| Concepto | I001 — Cuotas de Inscripcion y Colegiaturas |
| Periodo | Enero |
| Tipo | Original |
| Monto | $45,000,000.00 |
| Descripcion | Ley de Ingresos 2026 — cuotas |
| Fecha | 2026-01-01 |

**Ejemplo:** Registrar la recaudacion real del mes:

1. Selecciona la pestana **"Recaudado"**
2. Registra:

| Campo | Valor |
|-------|-------|
| Momento | Recaudado (automatico) |
| Concepto | I001 — Cuotas de Inscripcion y Colegiaturas |
| Periodo | Febrero |
| Tipo | Original |
| Monto | $12,500,000.00 |
| Descripcion | Cobro inscripciones semestre 2026-1, segunda quincena |
| Fecha | 2026-02-15 |

---

## 9. Patrimonio

### 9.1 Bienes Patrimoniales

**Ruta:** Patrimonio → Bienes

Aqui se registra el inventario de bienes de la universidad: muebles (computadoras, vehiculos), inmuebles (edificios, terrenos) e intangibles (software, licencias).

#### Tarjetas de resumen

Al entrar, ves 4 tarjetas:
- **Total Muebles**: Valor de todos los bienes muebles
- **Total Inmuebles**: Valor de todos los inmuebles
- **Total Intangibles**: Valor de intangibles
- **Valor Neto Total**: Valor de adquisicion - Depreciacion acumulada

#### Como registrar un bien

**Ejemplo:** La universidad compra 50 computadoras para el laboratorio:

1. Haz clic en **"+ Nuevo Bien"**
2. Llena:

| Campo | Valor |
|-------|-------|
| Clave | MUE-2026-001 |
| Descripcion | Lote 50 computadoras HP ProBook 450 G10 para Lab. Computo Edif. B |
| Tipo | Mueble |
| Fecha Adquisicion | 2026-02-15 |
| Valor Adquisicion | $750,000.00 |
| Depreciacion Acumulada | $0.00 |
| Vida Util | 4 (anos) |
| Tasa Depreciacion | 25 (%) |
| Ubicacion | Edificio B, Laboratorio de Computo, 2do Piso |
| Responsable | Ing. Roberto Garcia — Coord. Lab. Computo |
| Numero de Serie | Lote HPPB-2026-0001 al 0050 |
| Marca | HP |
| Modelo | ProBook 450 G10 |
| Estado | Activo |

3. Haz clic en **"Crear"**

**Filtros disponibles:**
- **Tipo de Bien**: Mueble, Inmueble, Intangible
- **Estado**: Activo, Baja, Transferido, En comodato

**Exportar:** Haz clic en **"Exportar Excel"** para obtener el listado completo de bienes.

#### Bienes tipicos de una universidad

| Clave | Tipo | Descripcion | Valor |
|-------|------|-------------|-------|
| INM-001 | Inmueble | Edificio de Rectoria | $25,000,000 |
| INM-002 | Inmueble | Edificio Facultad de Ingenieria | $35,000,000 |
| INM-003 | Inmueble | Biblioteca Central | $18,000,000 |
| MUE-001 | Mueble | Flota vehicular (15 vehiculos) | $4,500,000 |
| MUE-002 | Mueble | Mobiliario aulas (500 bancas) | $1,500,000 |
| INT-001 | Intangible | Licencia SAP ERP | $2,000,000 |
| INT-002 | Intangible | Sistema de Gestion Escolar | $800,000 |

### 9.2 Inventarios Fisicos

**Ruta:** Patrimonio → Inventarios

Los inventarios fisicos son los conteos reales de bienes. La LGCG exige que se realicen periodicamente.

**Como registrar un inventario:**

1. Haz clic en **"+ Nuevo Inventario"**
2. Llena:

| Campo | Valor |
|-------|-------|
| Clave | INV-2026-01 |
| Descripcion | Inventario fisico semestral primer semestre 2026, Campus Toluca |
| Fecha Conteo | 2026-06-30 |
| Responsable | Lic. Ana Martinez — Control Patrimonial |
| Ubicacion | Campus Toluca — Todos los edificios |
| Total Bienes | 1,847 |
| Valor Total | $87,300,000.00 |
| Estado | En proceso |
| Observaciones | Pendiente verificar Edificio D por remodelacion |

**Estados del inventario:**
- **Borrador**: Se esta preparando
- **En proceso**: El conteo esta en curso
- **Finalizado**: El conteo ya se completo y se verifico

### 9.3 Fideicomisos

**Ruta:** Patrimonio → Fideicomisos

Si la universidad tiene fideicomisos publicos, se registran aqui.

**Ejemplo:** La universidad tiene un fideicomiso para becas:

| Campo | Valor |
|-------|-------|
| Clave | FID-001 |
| Nombre | Fideicomiso de Becas de Posgrado UECYT |
| Tipo | Administracion |
| Mandante | Universidad Estatal de Ciencias y Tecnologia |
| Fiduciario | Nacional Financiera (NAFIN) |
| Fideicomisario | Estudiantes de posgrado |
| Monto Patrimonio | $15,000,000.00 |
| Fecha Constitucion | 2018-03-15 |
| Vigencia | 10 (anos) |
| Objeto | Otorgar becas de manutencion a estudiantes de maestria y doctorado de la UECYT |
| Estado | Vigente |

---

## 10. Deuda Publica

**Ruta:** Deuda Publica

Aqui se controlan los creditos y obligaciones financieras de la universidad.

### Tarjetas de resumen

- **Saldo Total**: Deuda vigente total
- **Intereses Pagados**: Total de intereses pagados en el ejercicio
- **Amortizaciones**: Total de capital pagado
- **Total Instrumentos**: Numero de creditos activos

### Registrar un instrumento de deuda

**Ejemplo:** La universidad tiene un credito con BANOBRAS para infraestructura:

1. Haz clic en **"+ Nuevo Instrumento"**
2. Llena:

| Campo | Valor |
|-------|-------|
| Clave | DEU-001 |
| Tipo | Credito |
| Descripcion | Credito BANOBRAS para construccion Centro de Investigacion |
| Acreedor | BANOBRAS |
| Monto Original | $50,000,000.00 |
| Saldo Vigente | $38,000,000.00 |
| Tasa Interes | 8.5 (%) |
| Tipo Tasa | Fija |
| Plazo | 120 (meses) |
| Moneda | MXN |
| Fecha Contratacion | 2022-06-01 |
| Fecha Vencimiento | 2032-06-01 |
| Destino de Recursos | Construccion del Centro de Investigacion en Ciencias Aplicadas |
| Garantia | Participaciones federales |
| Estado | Vigente |

### Registrar movimientos de deuda

Cada instrumento tiene sus propios movimientos. Haz clic en **"Movimientos"** en la fila del instrumento:

**Tipos de movimiento:**

| Tipo | Que es | Ejemplo |
|------|--------|---------|
| **Disposicion** | Recepcion de dinero del credito | Se reciben $10M de la segunda ministracion |
| **Amortizacion** | Pago de capital | Pago mensual de $416,667 |
| **Pago de intereses** | Pago de intereses | Pago mensual de $269,167 |
| **Reestructura** | Cambio en condiciones | Renegociacion de tasa de interes |

**Ejemplo de movimiento:**

| Campo | Valor |
|-------|-------|
| Tipo | Amortizacion |
| Monto | $416,667.00 |
| Fecha | 2026-01-31 |
| Descripcion | Pago mensual No. 43 credito BANOBRAS |

---

## 11. Fondos Federales

**Ruta:** Fondos Federales

Aqui se controlan los recursos que la universidad recibe del gobierno federal.

### Tarjetas de resumen

- **Total Asignado**: Lo que el gobierno federal asigno
- **Total Recibido**: Lo que efectivamente se ha recibido
- **Total Ejercido**: Lo que se ha gastado
- **Avance (%)**: Porcentaje de ejecucion

### Tipos de fondos

| Tipo | Que es | Ejemplo UECYT |
|------|--------|----------------|
| **Participacion** | Recursos del Ramo 28 | No aplica generalmente a universidades |
| **Aportacion** | Recursos etiquetados (Ramo 33, etc.) | Subsidio Federal Ordinario |
| **Subsidio** | Apoyo directo | PRODEP, PIFI, Programa de Fortalecimiento |
| **Convenio** | Acuerdos especificos | Convenio CONACYT para investigacion |

### Registrar un fondo

**Ejemplo:** Subsidio federal ordinario:

| Campo | Valor |
|-------|-------|
| Clave | FF-001 |
| Tipo | Subsidio |
| Nombre | Subsidio Federal Ordinario 2026 |
| Fuente | SEP — Subsecretaria de Educacion Superior |
| Monto Asignado | $95,000,000.00 |
| Monto Recibido | $47,500,000.00 |
| Monto Ejercido | $42,000,000.00 |
| Monto Reintegrado | $0.00 |
| Fecha Asignacion | 2026-01-15 |
| Estado | Activo |
| Descripcion | Subsidio ordinario para operacion de la universidad |

En la tabla veras el **% Ejercido** calculado automaticamente:
```
% Ejercido = ($42,000,000 / $95,000,000) x 100 = 44.2%
```

---

## 12. Reportes y Estados Financieros

**Ruta:** Reportes → Estados Financieros

Los estados financieros son los documentos que exige la LGCG (Arts. 46-50). Se generan automaticamente a partir de los datos que registraste en contabilidad y presupuesto.

### 5 Pestanas de reportes

#### 12.1 Estado de Situacion Financiera (Balance General)

Muestra la ecuacion contable fundamental: **Activo = Pasivo + Hacienda Publica**

```
ACTIVO                                    MONTO
  1.1 Activo Circulante
    1.1.1.2.1 BBVA 0123456789        $5,250,000.00
    1.1.2.1 Cuentas por Cobrar       $1,200,000.00
  1.2 Activo No Circulante
    1.2.4.1 Edificios                $78,000,000.00
    1.2.4.6 Equipo de Computo           $750,000.00
  ──────────────────────────────────────────────────
  TOTAL ACTIVO                       $85,200,000.00

PASIVO
  2.1.1.1 Proveedores por Pagar        $850,000.00
  2.1.1.2 Sueldos por Pagar          $2,500,000.00
  ──────────────────────────────────────────────────
  TOTAL PASIVO                        $3,350,000.00

HACIENDA PUBLICA
  3.1.1.1 Hacienda Contribuida      $65,000,000.00
  3.2.1.1 Resultados del Ejercicio  $16,850,000.00
  ──────────────────────────────────────────────────
  TOTAL HACIENDA                     $81,850,000.00

VERIFICACION: $85,200,000 = $3,350,000 + $81,850,000 ✓
```

> El sistema verifica automaticamente que la ecuacion cuadre. Si no cuadra, muestra una alerta en rojo.

#### 12.2 Estado de Actividades (Estado de Resultados)

Muestra Ingresos menos Gastos = Resultado del Ejercicio.

```
INGRESOS                              MONTO
  4.1.1 Cuotas                    $45,000,000.00
  4.2.1 Subsidios                 $95,000,000.00
  ──────────────────────────────────────────────
  TOTAL INGRESOS                 $140,000,000.00

GASTOS
  5.1.1 Servicios Personales     $120,000,000.00
  5.1.3 Servicios Generales       $3,150,000.00
  ──────────────────────────────────────────────
  TOTAL GASTOS                   $123,150,000.00

RESULTADO DEL EJERCICIO:          $16,850,000.00 (AHORRO)
```

#### 12.3 Estado de Variacion en la Hacienda Publica

Muestra como cambio el patrimonio de la universidad durante el periodo.

#### 12.4 Estado Analitico del Activo

Detalle de cada cuenta de activo con: Saldo Inicial, Debe, Haber y Saldo Final.

#### 12.5 Notas a los Estados Financieros

Seccion informativa para agregar aclaraciones y contexto a los reportes.

### Exportar

En cada pestana puedes hacer clic en:
- **"Exportar XLSX"**: Descarga en formato Excel
- **"Exportar PDF"**: Descarga como PDF con formato oficial

---

## 13. Cuenta Publica

**Ruta:** Cuenta Publica

La Cuenta Publica es el paquete anual que se entrega al organo fiscalizador (Auditoria Superior). Compila TODA la informacion financiera del ejercicio.

### Que contiene

La pantalla muestra 5 tarjetas-resumen, cada una con su boton de exportar:

| Seccion | Contenido |
|---------|-----------|
| **Informacion Financiera** | Total Activos, Pasivos, Hacienda |
| **Presupuesto de Egresos** | Aprobado, Ejercido, Pagado |
| **Presupuesto de Ingresos** | Estimado, Recaudado |
| **Patrimonio** | Total Bienes, Valor Neto Total |
| **Deuda Publica** | Saldo Total, Total Instrumentos |

### Como generar

**Opcion 1:** Exportar seccion por seccion haciendo clic en el boton "Exportar" de cada tarjeta.

**Opcion 2:** Haz clic en **"Generar Cuenta Publica Completa"** al final de la pagina. El sistema genera 5 archivos Excel automaticamente:
- `cuenta_publica_financiera.xlsx`
- `cuenta_publica_egresos.xlsx`
- `cuenta_publica_ingresos.xlsx`
- `cuenta_publica_patrimonio.xlsx`
- `cuenta_publica_deuda.xlsx`

---

## 14. Transparencia

**Ruta:** Transparencia

La LGCG (Arts. 56-59) obliga a publicar informacion financiera. Esta seccion genera **9 reportes** de transparencia.

### Los 9 reportes

| # | Reporte | Que contiene |
|---|---------|--------------|
| 1 | Estado de Situacion Financiera | Balance general |
| 2 | Estado de Actividades | Ingresos vs gastos |
| 3 | Balanza de Comprobacion | Saldos de todas las cuentas |
| 4 | Presupuesto de Egresos | Ejecucion del gasto |
| 5 | Presupuesto de Ingresos | Recaudacion |
| 6 | Deuda Publica | Situacion de endeudamiento |
| 7 | Bienes Patrimoniales | Inventario de activos |
| 8 | Fondos Federales | Manejo de recursos federales |
| 9 | Indicadores de Gestion | % ejecucion, % recaudacion |

### Como generar

**Individual:** Haz clic en **"Generar Reporte"** en la tarjeta del reporte que necesitas.

**Paquete completo:** Haz clic en **"Generar Paquete Completo de Transparencia"** al final. El sistema genera los 9 archivos automaticamente (con un breve delay entre cada uno para evitar saturar el navegador).

---

## 15. Seguridad y Administracion

### 15.1 Gestion de Usuarios

**Ruta:** Sistema → Usuarios

Aqui el administrador crea y gestiona las cuentas de acceso.

**Como crear un usuario:**

1. Haz clic en **"Nuevo Usuario"**
2. Llena:

| Campo | Valor ejemplo |
|-------|---------------|
| Nombre | Lic. Carlos Mendez Rios |
| Email | carlos.mendez@uecyt.edu.mx |
| Rol | Contador |
| Activo | (marcado) |

3. Haz clic en **"Crear Usuario"**

Al seleccionar un rol, el sistema muestra una descripcion de los permisos:
- **Contador**: "Acceso al modulo contable. Puede crear, editar y consultar polizas, libros y balanza."

**Usuarios tipicos de una universidad:**

| Nombre | Email | Rol |
|--------|-------|-----|
| Dra. Maria Lopez | maria.lopez@uecyt.edu.mx | Super Admin |
| CP Jose Ramirez | jose.ramirez@uecyt.edu.mx | Contador General |
| Lic. Ana Martinez | ana.martinez@uecyt.edu.mx | Patrimonio |
| Ing. Roberto Garcia | roberto.garcia@uecyt.edu.mx | Consulta |
| CP Laura Sanchez | laura.sanchez@uecyt.edu.mx | Contador |
| Lic. Pedro Diaz | pedro.diaz@uecyt.edu.mx | Presupuesto |
| Lic. Elena Torres | elena.torres@uecyt.edu.mx | Transparencia |
| CP Miguel Angel Ruiz | miguelangel.ruiz@uecyt.edu.mx | Auditor |

### 15.2 Bitacora de Auditoria

**Ruta:** Sistema → Bitacora

La bitacora registra **automaticamente** todas las operaciones del sistema: quien hizo que, cuando y en que tabla.

**Columnas:**

| Columna | Descripcion |
|---------|-------------|
| Fecha / Hora | Momento exacto de la operacion |
| Usuario | Email del usuario que hizo la operacion |
| Accion | INSERT (crear), UPDATE (modificar), DELETE (eliminar) |
| Tabla | Que tabla fue afectada (poliza, usuarios, etc.) |
| Registro ID | Identificador del registro afectado |

**Filtros disponibles:**
- **Tabla**: Filtrar por tabla (ej. solo ver cambios en polizas)
- **Accion**: Solo inserciones, solo modificaciones, solo eliminaciones
- **Rango de fechas**: Desde / Hasta

**Detalle:** Al hacer clic en una fila, se abre una ventana con los datos completos:
- **Datos Anteriores**: El estado del registro ANTES de la operacion (en formato JSON)
- **Datos Nuevos**: El estado del registro DESPUES de la operacion

**Ejemplo de uso:** El auditor necesita saber quien modifico la poliza POL-2026-0015:
1. En el filtro Tabla, selecciona "poliza"
2. En Accion, selecciona "UPDATE"
3. Busca en los resultados el registro con el ID de esa poliza
4. Haz clic para ver que cambio y quien lo cambio

---

## 16. Flujo de Trabajo Diario (Resumen)

Este es el flujo tipico de trabajo mensual para el area contable de la universidad:

### Inicio del ejercicio (enero)

```
1. Configuracion
   └─ Verificar ente publico ✓
   └─ Crear ejercicio fiscal 2026 ✓ (se generan 13 periodos)
   └─ Abrir periodo Enero ✓

2. Catalogos
   └─ Verificar plan de cuentas (CONAC) ✓
   └─ Configurar clasificadores ✓
   └─ Crear matrices de conversion ✓

3. Presupuesto
   └─ Crear partidas de egreso ✓
   └─ Registrar presupuesto aprobado (Momento: Aprobado, Tipo: Original)
   └─ Crear conceptos de ingreso ✓
   └─ Registrar ingresos estimados (Momento: Estimado, Tipo: Original)
```

### Operacion mensual (cada mes)

```
1. Abrir el periodo del mes actual

2. Registrar operaciones contables (polizas):
   └─ Polizas de ingreso (cobro de colegiaturas, recepcion subsidios)
   └─ Polizas de egreso (pagos a proveedores, nomina)
   └─ Polizas de diario (depreciaciones, provisiones, ajustes)

3. Registrar momentos presupuestarios:
   └─ Egresos: Comprometido → Devengado → Ejercido → Pagado
   └─ Ingresos: Devengado → Recaudado

4. Actualizar patrimonio:
   └─ Registrar altas/bajas de bienes

5. Revisar y aprobar polizas:
   └─ El Contador General revisa polizas pendientes
   └─ Aprueba o regresa a borrador

6. Conciliacion:
   └─ Revisar Balanza de Comprobacion
   └─ Verificar que Debe = Haber en totales
   └─ Revisar Libro Mayor para saldos por cuenta

7. Cerrar el periodo del mes
```

### Cierre trimestral

```
1. Generar Estados Financieros (5 pestanas)
2. Verificar ecuacion contable (A = P + HP)
3. Exportar Balanza de Comprobacion (envio al CONAC)
4. Generar reportes de Transparencia
```

### Cierre anual

```
1. Conciliar todos los periodos (1-12)
2. Registrar asientos de cierre en periodo 13 (Ajustes)
3. Generar Cuenta Publica completa (5 archivos)
4. Generar Paquete de Transparencia (9 archivos)
5. Cerrar ejercicio fiscal (cambiar estado a "Cerrado")
```

---

## 17. Preguntas Frecuentes

### Contabilidad

**P: Mi poliza no cuadra. Que hago?**
R: Verifica que la suma de todos los montos en "Debe" sea igual a la suma de todos los montos en "Haber". El sistema muestra la diferencia en la barra inferior. Revisa cada linea y corrige.

**P: Puedo editar una poliza aprobada?**
R: No. Las polizas aprobadas no se pueden editar porque ya afectaron los saldos contables. Si hay un error, puedes cancelar la poliza (con un motivo) y crear una nueva poliza correcta.

**P: Quien puede aprobar polizas?**
R: Solo los usuarios con rol "Super Admin" o "Contador General".

**P: Que pasa si cierro un periodo por error?**
R: Puedes volver a abrirlo desde Sistema → Periodos. Solo haz clic en "Abrir" junto al periodo.

### Presupuesto

**P: Cual es la diferencia entre los momentos contables?**
R: Los momentos representan el avance del gasto:
- **Aprobado**: Se autorizo el presupuesto
- **Comprometido**: Se firmo un contrato u orden de compra
- **Devengado**: Se recibio el bien o servicio
- **Ejercido**: Se emitio la orden de pago
- **Pagado**: Se desembolso el dinero

**P: Como registro una adecuacion presupuestal?**
R: Ve a Momentos del Gasto → pestana "Modificado" → Registrar Movimiento → Tipo: "Adicion" o "Reduccion" segun corresponda.

### Reportes

**P: Los reportes se generan solos?**
R: Si. Los estados financieros y la balanza se calculan automaticamente a partir de las polizas aprobadas y los saldos registrados. Solo necesitas seleccionar el periodo y exportar.

**P: En que formato puedo exportar?**
R: Excel (XLSX) y PDF. Ambos formatos estan disponibles en los reportes principales.

### Seguridad

**P: Olvide mi contrasena. Que hago?**
R: Contacta al administrador del sistema (Super Admin) para que restablezca tu contrasena.

**P: Puedo ver lo que hicieron otros usuarios?**
R: Si tienes acceso a la Bitacora (Sistema → Bitacora), puedes ver todas las operaciones de todos los usuarios, filtradas por tabla, accion y fecha.

---

## Glosario

| Termino | Definicion |
|---------|------------|
| **CONAC** | Consejo Nacional de Armonizacion Contable — emite las normas |
| **LGCG** | Ley General de Contabilidad Gubernamental — la ley federal |
| **Partida doble** | Todo cargo tiene un abono. Debe siempre = Haber |
| **Poliza** | Documento que registra una operacion contable |
| **Momento contable** | Etapa en la vida de un ingreso o egreso |
| **COG** | Clasificador por Objeto del Gasto |
| **RLS** | Row-Level Security — seguridad a nivel de fila en la BD |
| **Balanza** | Reporte que muestra saldos iniciales, movimientos y saldos finales |
| **Cuenta de detalle** | Cuenta del ultimo nivel donde se registran movimientos |
| **Ejercicio fiscal** | Periodo anual de enero a diciembre |

---

*SCGMEX v1.0 — Sistema de Contabilidad Gubernamental de Mexico*
*Desarrollado en cumplimiento de la LGCG y normas del CONAC*
