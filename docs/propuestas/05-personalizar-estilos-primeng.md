# Personalizar Estilos de PrimeNG

## Contexto
PrimeNG genera clases CSS específicas para sus componentes. Para personalizar estos estilos, hay varias estrategias disponibles.

## Ejemplo de clase a modificar
```scss
.p-paginator .p-paginator-pages .p-paginator-page {
    background-color: transparent;
    border: 0 none;
    color: #6c757d;
    min-width: 3rem;
    height: 3rem;
    margin: 0.143rem;
    transition: box-shadow 0.2s;
    border-radius: 50%;
}
```

---

## Opción 1: Usando `::ng-deep` en el componente (Recomendado)

Esta opción permite modificar los estilos solo para un componente específico.

### Ubicación
Archivo: `nav-bar.component.scss`

### Implementación
```scss
::ng-deep {
    .p-paginator .p-paginator-pages .p-paginator-page {
        background-color: #f0f0f0;  // Color de fondo
        border: 1px solid #ddd;     // Añadir borde
        color: #333;                // Color del texto
        min-width: 2.5rem;          // Cambiar tamaño
        height: 2.5rem;
        margin: 0.5rem;
        border-radius: 8px;         // Cambiar de circular a redondeado
    }

    // Estilo para la página activa
    .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
        background-color: #007bff;
        color: white;
        border-color: #007bff;
    }

    // Estilo para hover
    .p-paginator .p-paginator-pages .p-paginator-page:hover {
        background-color: #e0e0e0;
    }
}
```

### Ventajas
- ✅ Estilos aplicados solo al componente específico
- ✅ Fácil de mantener
- ✅ No afecta otros componentes

### Desventajas
- ⚠️ `::ng-deep` está deprecado (pero sigue funcionando)

---

## Opción 2: Estilos globales en `styles.scss`

Esta opción aplica los estilos a **todos los paginadores** de la aplicación.

### Ubicación
Archivo: `src/styles.scss`

### Implementación
```scss
.p-paginator .p-paginator-pages .p-paginator-page {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    color: #495057;
    min-width: 2.5rem;
    height: 2.5rem;
    margin: 0.25rem;
    border-radius: 4px;
}

.p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
    background-color: #007bff;
    color: white;
}

.p-paginator .p-paginator-pages .p-paginator-page:hover {
    background-color: #e9ecef;
}
```

### Ventajas
- ✅ Consistencia en toda la aplicación
- ✅ No necesita `::ng-deep`
- ✅ Más fácil de aplicar estándares de diseño

### Desventajas
- ⚠️ Afecta a todos los paginadores
- ⚠️ Puede ser difícil de sobrescribir en componentes específicos

---

## Opción 3: Clase personalizada con `styleClass`

Crear una clase personalizada y aplicarla directamente al componente.

### Ubicación
**HTML**: `nav-bar.component.html`
```html
<p-table [value]="statesInfo" 
         [paginator]="true"
         [paginatorStyleClass]="'custom-paginator'">
</p-table>
```

**SCSS**: `nav-bar.component.scss` o `styles.scss`
```scss
::ng-deep {
    .custom-paginator .p-paginator-pages .p-paginator-page {
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 6px;
        // ... tus estilos personalizados
    }
}
```

### Ventajas
- ✅ Más específico y controlado
- ✅ Permite múltiples estilos de paginadores en la misma app
- ✅ Semántico y mantenible

### Desventajas
- ⚠️ Requiere modificar tanto HTML como CSS

---

## Propiedades CSS Comunes para Personalizar

### Tamaño y espaciado
```scss
min-width: 3rem;        // Ancho mínimo
height: 3rem;           // Alto
margin: 0.5rem;         // Espaciado entre botones
padding: 0.5rem;        // Espaciado interno
```

### Forma y bordes
```scss
border-radius: 50%;     // Circular
border-radius: 8px;     // Redondeado
border-radius: 0;       // Cuadrado
border: 1px solid #ddd; // Borde
```

### Colores
```scss
background-color: #f0f0f0;  // Fondo normal
color: #333;                 // Texto normal

// Página activa
.p-highlight {
    background-color: #007bff;
    color: white;
}

// Hover
:hover {
    background-color: #e0e0e0;
}
```

### Transiciones
```scss
transition: all 0.3s ease;              // Transición suave
transition: background-color 0.2s;       // Solo color de fondo
```

---

## Recomendación

Para tu caso específico en `nav-bar.component`, te recomiendo usar **Opción 1** con `::ng-deep` en el archivo `nav-bar.component.scss`, ya que:

1. Los cambios solo afectarán al paginador de la tabla de estados
2. Es fácil de modificar y testear
3. Mantiene la encapsulación del componente

## Ejemplo de uso completo

```scss
// nav-bar.component.scss
::ng-deep {
    .p-paginator {
        padding: 1rem 0;
        
        .p-paginator-pages .p-paginator-page {
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            color: #333333;
            min-width: 2.5rem;
            height: 2.5rem;
            margin: 0.25rem;
            border-radius: 6px;
            transition: all 0.2s ease;
            
            &.p-highlight {
                background-color: #2196f3;
                color: white;
                border-color: #2196f3;
            }
            
            &:hover:not(.p-highlight) {
                background-color: #f5f5f5;
                border-color: #2196f3;
            }
        }
    }
}
```
