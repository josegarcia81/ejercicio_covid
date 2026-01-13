# Propuesta: Layout Responsivo para app.component

## Problema Identificado

En [`app.component.scss`](file:///c:/Users/txema.garcia/Ejercicios/ejercicio_covid/src/app/app.component.scss), el layout actual tiene estos problemas:

### Problemas Principales

1. **`.nav` ocupa el 50% del ancho** (línea 13):
   ```scss
   .nav {
     width: 50%;  // ❌ Muy ancho, quita espacio al mapa
   }
   ```

2. **No hay media queries** para pantallas pequeñas:
   - En móviles/tablets, ambos componentes intentan caber horizontalmente
   - El nav-bar se sale de la pantalla o se mezcla con el mapa

3. **Flexbox sin wrapping adecuado**:
   - `flex-direction: row` siempre horizontal
   - `overflow: hidden` en `:host` oculta contenido

## Solución Propuesta

### Opción 1: Layout Responsivo con Media Queries (RECOMENDADA) 🌟

Cambiar el layout a columnas en pantallas pequeñas y mantener el nav-bar más estrecho en pantallas grandes.

#### Cambios en `app.component.scss`

```scss
/* Root layout */
:host {
    display: flex;
    flex-direction: row;  /* Por defecto: lado a lado */
    height: 95vh;
    width: 98vw;
    overflow: hidden;
}

/* Left navigation panel */
.nav {
    width: 20%;              /* ✅ Reducir de 50% a 20% */
    min-width: 200px;        /* ✅ Mínimo más razonable */
    max-width: 350px;        /* ✅ Evitar que crezca demasiado */
    height: 100%;
    background: #ffffff;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    overflow-y: auto;        /* ✅ Scroll si el contenido es muy largo */
}

/* Map area */
app-map {
    flex: 1;                 /* ✅ Toma el espacio restante */
    height: 100%;
    min-width: 0;            /* ✅ Permite que el flex funcione correctamente */
}

/* 📱 RESPONSIVE: Pantallas pequeñas (tablets y móviles) */
@media (max-width: 1024px) {
    :host {
        flex-direction: column;  /* ✅ Cambiar a vertical */
        height: 100vh;
    }
    
    .nav {
        width: 100%;
        max-width: 100%;
        height: auto;
        max-height: 40vh;        /* ✅ No ocupar toda la pantalla */
        border-bottom: 2px solid #e0e0e0;
    }
    
    app-map {
        flex: 1;
        width: 100%;
        height: 60vh;
    }
}

/* 📱 RESPONSIVE: Móviles pequeños */
@media (max-width: 768px) {
    .nav {
        max-height: 35vh;
        padding: 0.5rem;
    }
    
    app-map {
        height: 65vh;
    }
}
```

#### Ventajas de esta Opción
- ✅ En desktop: nav-bar a la izquierda (20% ancho), mapa a la derecha (80%)
- ✅ En tablets: cambia a layout vertical
- ✅ En móviles: nav-bar arriba (más pequeño), mapa abajo (más grande)
- ✅ Sin scroll horizontal
- ✅ Todo visible siempre

---

### Opción 2: Nav-Bar como Drawer/Sidebar Colapsable

El nav-bar se puede ocultar/mostrar con un botón (común en móviles).

#### Estructura Propuesta

```html
<!-- app.component.html -->
<button class="toggle-nav" (click)="toggleNav()">
    <i class="pi pi-bars"></i>
</button>

<div class="nav" [class.nav-hidden]="!navVisible">
    <!-- Contenido del nav -->
</div>

<app-map class="app-map"></app-map>
```

#### CSS

```scss
.toggle-nav {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 10000;
    display: none;  /* Oculto por defecto */
}

.nav {
    transition: transform 0.3s ease;
}

@media (max-width: 1024px) {
    .toggle-nav {
        display: block;  /* Mostrar en móviles */
    }
    
    .nav {
        position: fixed;
        left: 0;
        top: 0;
        width: 300px;
        height: 100vh;
        z-index: 9999;
        box-shadow: 2px 0 10px rgba(0,0,0,0.2);
    }
    
    .nav.nav-hidden {
        transform: translateX(-100%);  /* Ocultar a la izquierda */
    }
    
    app-map {
        width: 100%;
    }
}
```

---

## Comparación de Opciones

| Característica | Opción 1: Media Queries | Opción 2: Drawer |
|----------------|-------------------------|------------------|
| Complejidad | ⭐⭐ Baja | ⭐⭐⭐ Media |
| UX Desktop | ⭐⭐⭐⭐⭐ Excelente | ⭐⭐⭐⭐ Buena |
| UX Móvil | ⭐⭐⭐⭐ Buena | ⭐⭐⭐⭐⭐ Excelente |
| Cambios en TS | ❌ No requiere | ✅ Requiere |
| Cambios en HTML | ❌ Mínimos | ✅ Requiere |

## Recomendación

👉 **Opción 1** es la mejor para tu caso porque:
1. Más simple de implementar
2. No requiere cambios en TypeScript
3. El contenido siempre es visible
4. Mejor para aplicaciones de datos/mapas

## Archivos a Modificar

### Opción 1
- [app.component.scss](file:///c:/Users/txema.garcia/Ejercicios/ejercicio_covid/src/app/app.component.scss)

### Opción 2
- [app.component.html](file:///c:/Users/txema.garcia/Ejercicios/ejercicio_covid/src/app/app.component.html)
- [app.component.scss](file:///c:/Users/txema.garcia/Ejercicios/ejercicio_covid/src/app/app.component.scss)
- [app.component.ts](file:///c:/Users/txema.garcia/Ejercicios/ejercicio_covid/src/app/app.component.ts)

## Mejoras Adicionales Opcionales

### 1. Ajustar tabla en nav-bar para móviles

```scss
// nav-bar.component.scss
@media (max-width: 768px) {
    p-table {
        width: 100%;
        font-size: 0.875rem;  // Texto más pequeño
        
        ::ng-deep {
            .p-datatable table {
                font-size: 0.875rem;
            }
        }
    }
}
```

### 2. Hacer el dialog más responsivo

Ya tienes breakpoints en el dialog (línea 57 del HTML), pero puedes mejorarlos:

```html
<p-dialog 
    [breakpoints]="{ 
        '1400px': '70vw', 
        '1024px': '85vw', 
        '768px': '95vw', 
        '576px': '98vw' 
    }">
```

---

## Vista Previa del Resultado

### Desktop (> 1024px)
```
┌─────────────────────────────────────────┐
│  NAV   │         MAPA                   │
│  20%   │          80%                   │
│        │                                │
│ Table  │      🗺️ Map with controls     │
│ [✓]    │                                │
│ State1 │                                │
│ [  ]   │                                │
│ State2 │                                │
└─────────────────────────────────────────┘
```

### Tablet/Móvil (< 1024px)
```
┌─────────────────────┐
│   NAV (40vh)        │
│   Table             │
│   [✓] State1        │
│   [ ] State2        │
├─────────────────────┤
│   MAPA (60vh)       │
│                     │
│   🗺️ Map           │
│                     │
└─────────────────────┘
```

---

## Estado

⏳ **Pendiente de implementación**

---

*Fecha: 2026-01-13*  
*Archivos: `app.component.html`, `app.component.scss`*
