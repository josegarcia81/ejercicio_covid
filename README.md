# EjercicioCovid

![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![OpenLayers](https://img.shields.io/badge/OpenLayers-1F6B75?style=for-the-badge&logo=openlayers&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

## 📋 Descripción del Proyecto

**EjercicioCovid** es una aplicación web interactiva desarrollada en **Angular** que permite la visualización y análisis de datos COVID-19 en Estados Unidos. El proyecto integra capacidades avanzadas de mapeo mediante **OpenLayers**, permitiendo no solo la consulta de datos estadísticos geolocalizados, sino también la interacción directa con el mapa a través de herramientas de dibujo y edición de geometrías.

La aplicación consume datos en tiempo real de la **COVID Tracking API**, representando visualmente el impacto de la pandemia por estados mediante un sistema de códigos de colores (semáforo).

---

## 🚀 Características Principales

### 🗺️ Visualización de Datos
- **Mapa Interactivo de EE.UU:** Renderizado de estados mediante GeoJSON.
- **Clasificación por Colores:** Los estados se colorean automáticamente según el número de casos positivos:
  - 🟢 **Verde:** Baja incidencia (< 200,000 casos)
  - 🟡 **Amarillo:** Incidencia media (200,000 - 400,000 casos)
  - 🔴 **Rojo:** Alta incidencia (> 400,000 casos)
- **Consultas Interactivas:** Selección de estados para ver datos detallados y tooltips dinámicos con información al pasar el ratón.

### 🛠️ Herramientas de Edición Geoespacial (GIS)
El proyecto incluye un conjunto robusto de herramientas para manipular geometrías en el mapa, impulsado por **JSTS** y **Turf.js**:
- **Dibujo de Polígonos:** Creación de áreas personalizadas sobre el mapa.
- **Cálculo de Áreas:** Cálculo automático de la superficie en metros cuadrados de los polígonos dibujados.
- **Edición y Transformación:** Herramientas para **Modificar** vértices, **Rotar**, **Escalar** y **Mover** polígonos existentes.
- **Operaciones Avanzadas de Corte:**
  - **Corte por Línea:** Divide un polígono en múltiples partes dibujando una línea de corte (feature split).
  - **Operaciones Booleanas:** Funcionalidades para sustraer o excluir áreas entre polígonos intersectados.

### 🧩 Componentes UI/UX
- **Interfaz Moderna:** Uso de **PrimeNG** para componentes visuales como menús, listas desplegables y autocompletado.
- **Navegación Fluida:** Barra de navegación y menús laterales integrados.
- **Drag & Drop:** Soporte para arrastrar y soltar archivos geoespaciales directamente en el mapa.

---

## 🛠️ Stack Tecnológico

*   **Framework:** Angular 14.2.x
*   **Mapas:** OpenLayers 10.x, ol-ext
*   **Análisis Geoespacial:** Turf.js, JSTS (Java Topology Suite for JavaScript)
*   **UI Components:** PrimeNG, PrimeIcons
*   **Datos:** API de The COVID Tracking Project

---

## ⚙️ Instalación y Despliegue

Este proyecto fue generado con [Angular CLI](https://github.com/angular/angular-cli) versión 14.2.13.

### Servidor de Desarrollo
Ejecuta `ng serve` para iniciar el servidor de desarrollo. Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente si cambias algún archivo fuente.

### Build (Construcción)
Ejecuta `ng build` para construir el proyecto. Los artefactos de construcción se almacenarán en el directorio `dist/`.

### Tests Unitarios
Ejecuta `ng test` para ejecutar las pruebas unitarias a través de [Karma](https://karma-runner.github.io).

---

## 📂 Estructura del Proyecto

El código fuente se organiza de manera modular:
*   `src/app/components/map`: Lógica principal del mapa (OpenLayers, interacciones).
*   `src/app/services`:
    *   `covid-data.service.ts`: Gestión de llamadas a la API y estado de datos COVID.
    *   `tools.service.ts`: Lógica compleja de operaciones geométricas (JSTS, cortes de polígonos).
    *   `map.service.ts`: Gestión centralizada de instancias del mapa y capas.
