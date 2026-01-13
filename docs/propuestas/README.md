# Índice de Propuestas de Implementación

Este directorio contiene todas las propuestas de mejora y soluciones para el proyecto COVID-19.

## 📋 Propuestas

### 01 - Controles del Mapa Responsivos
**Archivo:** [`01-controles-mapa-responsivos.md`](./01-controles-mapa-responsivos.md)  
**Estado:** ✅ Implementado  
**Fecha:** 2026-01-13  
**Descripción:** Solución para hacer los controles del mapa (`.mapControls`, `.sub-toolbar`, `.sub-toolbar-2`) responsivos cambiando de `position: relative` a `absolute` y anclándolos a esquinas específicas del contenedor.

**Archivos afectados:**
- `src/app/components/map/map.component.scss`

---

### 02 - Layout Responsivo del App Component
**Archivo:** [`02-layout-responsivo-app-component.md`](./02-layout-responsivo-app-component.md)  
**Estado:** ⏳ Pendiente  
**Fecha:** 2026-01-13  
**Descripción:** Dos opciones propuestas para hacer responsivo el layout principal:
- **Opción 1 (Recomendada):** Media queries para cambiar a layout vertical en móviles
- **Opción 2:** Nav-bar como drawer colapsable

**Archivos afectados:**
- `src/app/app.component.scss` (Opción 1)
- `src/app/app.component.html`, `src/app/app.component.scss`, `src/app/app.component.ts` (Opción 2)

---

## 🎯 Leyenda de Estados

- ✅ **Implementado** - Cambios aplicados y funcionando
- ⏳ **Pendiente** - Propuesta lista, esperando implementación
- 🔄 **En progreso** - Implementación en curso
- ❌ **Rechazado** - Propuesta descartada
- 🔍 **En revisión** - Esperando feedback del usuario

---

## 📝 Cómo usar este directorio

1. Cada propuesta tiene un archivo markdown numerado
2. Revisa el índice para ver el estado de cada propuesta
3. Lee el archivo completo para ver detalles, código y justificación
4. Los archivos se mantienen como documentación histórica

---

*Última actualización: 2026-01-13*
