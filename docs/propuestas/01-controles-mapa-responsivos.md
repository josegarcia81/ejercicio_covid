# Propuesta: Controles del Mapa Responsivos

## Problema Identificado

Los controles del mapa tienen estos problemas:

1. **`.mapControls`** (línea 28-57):
   - Usa `bottom: 3.8em` y `left: 12.5rem` con valores fijos
   - Se mueve cuando cambia el aspecto de la web

2. **`.sub-toolbar`** (línea 59-90):
   - Usa `bottom: 11.7em` con valor fijo
   - Se desplaza fuera de la zona visible en diferentes aspectos

3. **`.sub-toolbar-2`** (línea 91-118):
   - Usa `position: relative` con `bottom: -35.2em`
   - **Este es el problema principal**: `relative` hace que se posicione relativo a su flujo normal, no al mapa
   - Cuando cambia el aspecto, se mueve completamente

## Solución Propuesta

### Cambio Principal: De `relative` a `absolute`

Cambiar todos los controles a `position: absolute` y fijarlos a las esquinas del mapa usando:
- `top`, `right`, `bottom`, `left` con valores en `rem` o porcentajes
- Anclarlos a esquinas específicas del contenedor del mapa

### Cambios Específicos

#### 1. `.mapControls` - Barra principal (centrada abajo)
```scss
.mapControls {
  position: absolute !important;
  bottom: 1.5rem;           // Distancia fija desde el bottom
  left: 50%;                // Centrado horizontal
  transform: translateX(-50%); // Compensar para centrar perfectamente
  // ... resto de estilos
}
```

#### 2. `.sub-toolbar` - Submenú de selección (izquierda centro)
```scss
.sub-toolbar {
  position: absolute !important;
  top: 50%;                 // Centrado vertical
  transform: translateY(-50%); // Compensar para centrar perfectamente
  left: 1rem;               // Distancia fija desde la izquierda
  // ... resto de estilos
}
```

#### 3. `.sub-toolbar-2` - Navegación lateral (esquina inferior izquierda)
```scss
.sub-toolbar-2 {
  position: absolute !important;  // Cambiar de relative a absolute
  bottom: 1rem;             // Distancia fija desde el bottom
  left: 1rem;               // Distancia fija desde la izquierda
  // ... resto de estilos
}
```

### Ventajas de esta Solución

✅ **Posicionamiento consistente**: Los controles siempre estarán en la misma posición relativa al mapa

✅ **Responsivo**: Se adapta automáticamente a diferentes tamaños de pantalla

✅ **Fácil ajuste**: Puedes cambiar fácilmente la posición modificando `top`, `right`, `bottom`, `left`

✅ **No se salen del mapa**: Al estar anclados con `absolute` al contenedor del mapa, siempre permanecen dentro

### Estructura Visual Propuesta

```
┌─────────────────────────────────────────┐
│                                         │
│  [📊 Layers]                           │
│  [📏 Area]                             │
│  [📋 States]  ← .sub-toolbar-2         │
│                                         │
│                                         │
│                                         │
│                    [🗑️ 📊]              │
│                    ↑ .sub-toolbar       │
│                    (aparece al clic)    │
│                                         │
│                                         │
│  [✏️][✂️][🔲][➕][-][↔️][📁]            │
│         ↑ .mapControls (centrado)       │
└─────────────────────────────────────────┘
```

## Cambios Opcionales (Mejoras Adicionales)

### Media Queries para Pantallas Pequeñas

Si quieres mejorar aún más la responsividad:

```scss
// Ajustar tamaños en móviles
@media (max-width: 768px) {
  .mapControls {
    bottom: 0.5rem;
    gap: 0.25rem;
    padding: 0.25rem;
    
    .ctrl-button {
      padding: 0.3em !important;
      
      svg {
        width: 20px;
        height: 20px;
      }
    }
  }
}
```

### Variables CSS para Facilitar Ajustes

```scss
:root {
  --map-controls-spacing: 1.5rem;
  --map-controls-gap: 0.5rem;
}

.mapControls {
  bottom: var(--map-controls-spacing);
  gap: var(--map-controls-gap);
}
```

## Archivos a Modificar

- [map.component.scss](file:///c:/Users/txema.garcia/Ejercicios/ejercicio_covid/src/app/components/map/map.component.scss)

## Resumen de Cambios

| Clase | Cambio Principal | Líneas |
|-------|-----------------|--------|
| `.mapControls` | Centrar con `left: 50%` + `transform` | 28-57 |
| `.sub-toolbar` | Centrar verticalmente con `top: 50%` + `transform` | 59-90 |
| `.sub-toolbar-2` | **De `relative` a `absolute`** + anclar a esquina | 91-118 |

## Estado

✅ **Implementado manualmente por el usuario**

---

*Fecha: 2026-01-13*  
*Archivo: `map.component.scss`*
