# Propuesta: Mover Panel Lateral a la Derecha

Esta propuesta detalla los cambios necesarios en los estilos (SCSS) para mover el panel de navegación del lado izquierdo al lado derecho de la pantalla, manteniendo la lógica de aparición (toggle) implementada anteriormente.

## 🎯 Objetivo
Cambiar la ubicación del panel (`nav-container`) y su botón de activación (`handle`) para que estén anclados al borde derecho (`right: 0`) y el panel se deslice hacia fuera (hacia la derecha) para ocultarse.

## 🛠 Cambios Necesarios (SCSS)

Archivo afectado: `src/app/app.component.scss`

### 1. Posicionamiento del Contenedor (`.side-wrap`)
Cambiar el anclaje de izquierda a derecha.

```scss
.side-wrap {
    /* ... variables ... */
    
    position: absolute;
    top: 0;
    
    /* CAMBIO: De left: 0 a right: 0 */
    right: 0; 
    left: auto; /* Resetear left por seguridad */
    
    /* ... resto de estilos ... */
}
```

### 2. Estilo del Asa (`.handle`)
El asa debe reflejarse horizontalmente. Ahora debe tener los bordes redondeados hacia la izquierda y la sombra proyectada hacia la izquierda.

```scss
.handle {
    /* ... posicionamiento ... */
    
    /* Mantener left: 0 relative al wrap?
       Si el wrap está a la derecha, y queremos [Handle][Panel] | BordeDerecho
       El handle debe estar a la izquierda del panel.
       Como .nav-container está a `left: var(--handleW)`, el handle debe estar en 0.
       Esto es correcto, la estructura interna [Handle][Panel] se mantiene.
    */
    
    /* CAMBIO: Bordes redondeados a la izquierda */
    border-radius: 10px 0 0 10px; 
    
    /* CAMBIO: Sombra hacia la izquierda (negativa en X) */
    box-shadow: -2px 2px 10px rgba(0, 0, 0, .2);
}
```

### 3. Animación del Panel (`.nav-container`)
El panel ahora debe ocultarse moviéndose hacia la **derecha** (salir de la pantalla) en lugar de hacia la izquierda.

```scss
.nav-container {
    /* ... */
    
    /* CAMBIO: Estado Inicial (Oculto) */
    /* Mover 100% a la derecha (positivo) para salir de pantalla */
    transform: translateX(100%); 
    
    /* Mantener visibility y transitions igual */
}
```

No se requieren cambios en la lógica del estado abierto (`translateX(0)`), ya que 0 siempre es la posición "natural" visible.

### 4. Resumen de Diferencias Lógicas

| Elemento | Izquierda (Actual) | Derecha (Propuesta) |
| :--- | :--- | :--- |
| **Parent** | `left: 0` | `right: 0` |
| **Handle Radius** | `0 10px 10px 0` | `10px 0 0 10px` |
| **Handle Shadow** | `2px ...` | `-2px ...` |
| **Hidden Transform** | `translateX(-100%)` | `translateX(100%)` |

## 📝 Implementación
Solo se requieren modificaciones en `src/app/app.component.scss`. El HTML y TypeScript (`app.component.ts`) no necesitan cambios ya que la lógica de toggle (`isMenuOpen`) es agnóstica a la posición visual.
