# Estructura del Proyecto: Neuro Vision (MVC en Español)

Este documento detalla la estructura organizativa y arquitectónica final del repositorio de **Neuro Vision**, con todos los directorios y archivos personalizados traducidos al español para que sean más legibles y fáciles de entender por personas ajenas al desarrollo de software.

---

## 1. Diagrama de la Estructura en Español

```
PROYECTO NEURO VISION/
├── .agents/               <-- Skills del asistente de IA (visible en GitHub)
│   └── AGENTS.md          <-- Reglas de personalización del agente IA
├── base_de_datos/         <-- BASE DE DATOS: Archivos de persistencia local y SQL
│   ├── sql/
│   │   ├── schema.sql     <-- Esquema de tablas para SQLite local
│   │   └── schema-neon.sql <-- Esquema de tablas para Neon PostgreSQL (producción)
│   └── parkinson.db       <-- Archivo físico de la base de datos SQLite local
├── prisma/                <-- Configuración del ORM Prisma (Esquema relacional)
│   └── schema.prisma      <-- Definición de modelos de base de datos de Prisma
├── public/                <-- Assets estáticos de Next.js (imágenes, logos de la web)
├── src/                   <-- Código fuente principal de la aplicación web
│   ├── app/               <-- ENRUTADOR: Estructura obligatoria de Next.js (URLs y APIs)
│   │   ├── api/           <-- Conexiones de API HTTP (patients, sessions)
│   │   ├── capture/       <-- Wrapper que carga la pantalla de captura (/capture)
│   │   ├── trends/        <-- Wrapper que carga la pantalla de tendencias (/trends)
│   │   └── page.tsx       <-- Wrapper que carga la pantalla principal (/)
│   ├── vistas/            <-- VISTAS (Views): Diseños y pantallas visuales de la interfaz
│   │   ├── DashboardView.tsx <-- UI del Dashboard y Portal del paciente
│   │   ├── CaptureView.tsx   <-- UI de grabación y captura con webcam
│   │   └── TrendsView.tsx    <-- UI de gráficos de evolución y comparativa
│   ├── controladores/     <-- CONTROLADORES: Lógica de negocio y procesamiento de datos
│   │   ├── PatientController.ts <-- Control de datos del paciente
│   │   └── SessionController.ts <-- Control de datos de sesiones y mediciones
│   ├── modelos/           <-- MODELOS (Models): Definición formal de datos y consultas
│   │   ├── Patient.ts     <-- Modelo y consultas para Pacientes
│   │   └── Session.ts     <-- Modelo y consultas para Sesiones
│   ├── componentes_visuales/ <-- Bloques y elementos visuales reutilizables
│   │   ├── LongitudinalCharts.tsx <-- Elemento de gráficos analíticos
│   │   ├── NavigationSidebar.tsx  <-- Barra lateral de navegación
│   │   ├── TooltipAyuda.tsx       <-- Ícono de ayuda con tooltip informativo
│   │   └── WebcamCapture.tsx      <-- Elemento de cámara y procesamiento de visión
│   ├── contexto_global/   <-- Datos compartidos globalmente (roles, paciente activo)
│   │   └── AppContext.tsx
│   └── biblioteca/        <-- BIBLIOTECA: Funciones de soporte y utilidades matemáticas
│       ├── exports.ts     <-- Generador de reportes PDF y Excel
│       ├── prisma.ts      <-- Cliente de conexión Prisma
│       ├── db.ts          <-- Gestor de adaptadores de BD (SQLite, Neon, Supabase)
│       └── math/          <-- Módulos de análisis matemático (ángulos, FFT, cinemática)
├── temporales/            <-- Temporales y zips archivados para mantener la limpieza
└── herramientas/          <-- Utilidades y scripts de soporte externos
    ├── analisis_facial.py <-- Script analítico de Python para rostro
    └── test-ui.js         <-- Script de prueba de interfaz automatizada
```

---

## 2. Archivos Técnicos Especiales (Excluidos de GitHub)

Los siguientes archivos son autogenerados y necesarios únicamente para el compilador local y no se suben a GitHub por seguridad y peso:

*   **`node_modules/`:** Dependencias de código descargadas.
*   **`.next/`:** Contenido compilado optimizado para el navegador.
*   **`.env` y `.env.local`:** Credenciales privadas y claves secretas. Residen en la raíz por exigencia del framework de Next.js, pero están bloqueados en Git para evitar filtraciones.

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Arquitectura_MVC]]: Arquitectura general.
