# Implementación p-autoComplete para Estados - Propuesta

## Tu Objetivo
1. ✅ Usar un array existente de estados
2. ✅ Mostrar sugerencias mientras escribes
3. ✅ Capturar el evento al hacer clic en un elemento

## Solución Completa

### Paso 1: HTML Template

**Archivo:** `map.component.html`

```html
<p-autoComplete 
    [(ngModel)]="selectedState"
    [suggestions]="filteredStates"
    (completeMethod)="searchStates($event)"
    (onSelect)="onStateSelected($event)"
    placeholder="Buscar estado..."
    [dropdown]="true"
    [forceSelection]="true"
    [minLength]="1">
</p-autoComplete>
```

### Paso 2: TypeScript Component

**Archivo:** `map.component.ts`

```typescript
export class MapComponent implements OnInit {
    
    // 1. Array completo de estados (tu array existente)
    allStates: string[] = [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
        'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
        'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
        'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
        'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
        'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
        'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
        'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
        'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
        'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
    ];
    
    // 2. Array filtrado (solo sugerencias)
    filteredStates: string[] = [];
    
    // 3. Estado seleccionado
    selectedState: string = '';
    
    /**
     * Método que se ejecuta cuando el usuario escribe
     * Filtra los estados según el texto ingresado
     */
    searchStates(event: any) {
        const query = event.query.toLowerCase();
        
        // Filtra los estados que contienen el texto escrito
        this.filteredStates = this.allStates.filter(state => 
            state.toLowerCase().includes(query)
        );
    }
    
    /**
     * Método que se ejecuta cuando el usuario hace clic en un estado
     * Aquí capturas el evento con el elemento seleccionado
     */
    onStateSelected(event: any) {
        // event contiene el valor seleccionado
        console.log('Estado seleccionado:', event);
        console.log('Valor:', this.selectedState);
        
        // Aquí puedes hacer lo que necesites:
        // - Hacer zoom en el mapa al estado
        // - Cargar datos del estado
        // - Mostrar información
        // - Etc.
        
        this.zoomToState(this.selectedState);
    }
    
    /**
     * Ejemplo de acción después de seleccionar
     */
    zoomToState(stateName: string) {
        console.log('Haciendo zoom a:', stateName);
        // Tu lógica de zoom aquí
    }
}
```

---

## Flujo de Funcionamiento

```
Usuario escribe "Ala"
    ↓
completeMethod se dispara
    ↓
searchStates({ query: "Ala" })
    ↓
this.filteredStates = ["Alabama", "Alaska"]
    ↓
Se muestran las sugerencias
    ↓
Usuario hace clic en "Alabama"
    ↓
onSelect se dispara
    ↓
onStateSelected(event)
    ↓
this.selectedState = "Alabama"
    ↓
Ejecutas tu lógica (zoom, cargar datos, etc.)
```

---

## Si tu array ya existe con otro nombre

Si ya tienes un array llamado, por ejemplo, `cities` o `statesInfo`, simplemente úsalo:

```typescript
// Tu array existente
cities: string[] = [...]; // Ya lo tienes

// Array para sugerencias filtradas
filteredCities: string[] = [];

// Estado seleccionado
selectedCity: string = '';

// Filtrar
searchCities(event: any) {
    const query = event.query.toLowerCase();
    this.filteredCities = this.cities.filter(city => 
        city.toLowerCase().includes(query)
    );
}

// Capturar clic
onCitySelected(event: any) {
    console.log('Seleccionado:', this.selectedCity);
    // Tu lógica aquí
}
```

---

## Si tu array es de objetos (más completo)

Si tu array tiene objetos como `{ name: 'Alabama', code: 'AL', ... }`:

### HTML
```html
<p-autoComplete 
    [(ngModel)]="selectedState"
    [suggestions]="filteredStates"
    (completeMethod)="searchStates($event)"
    (onSelect)="onStateSelected($event)"
    field="name"
    placeholder="Buscar estado..."
    [dropdown]="true">
</p-autoComplete>
```

### TypeScript
```typescript
// Array de objetos
allStates: any[] = [
    { name: 'Alabama', code: 'AL', population: 5024279 },
    { name: 'Alaska', code: 'AK', population: 733391 },
    // ...
];

filteredStates: any[] = [];
selectedState: any = null;

searchStates(event: any) {
    const query = event.query.toLowerCase();
    
    this.filteredStates = this.allStates.filter(state => 
        state.name.toLowerCase().includes(query) ||
        state.code.toLowerCase().includes(query)
    );
}

onStateSelected(event: any) {
    // Ahora tienes acceso al objeto completo
    console.log('Estado:', this.selectedState.name);
    console.log('Código:', this.selectedState.code);
    console.log('Población:', this.selectedState.population);
    
    // Hacer zoom al estado
    this.zoomToState(this.selectedState);
}
```

---

## Propiedades Útiles Adicionales

```html
<p-autoComplete 
    [(ngModel)]="selectedState"
    [suggestions]="filteredStates"
    (completeMethod)="searchStates($event)"
    (onSelect)="onStateSelected($event)"
    
    <!-- Opcionales pero útiles -->
    placeholder="Buscar estado..."
    [dropdown]="true"              <!-- Botón para ver todas las opciones -->
    [forceSelection]="true"        <!-- Obliga a seleccionar de la lista -->
    [minLength]="1"                <!-- Mínimo de caracteres para buscar -->
    [delay]="300"                  <!-- Milisegundos de espera antes de buscar -->
    [completeOnFocus]="true"       <!-- Muestra sugerencias al hacer foco -->
    [showClear]="true"             <!-- Botón para limpiar selección -->
    
    <!-- Eventos opcionales -->
    (onClear)="onClearState()"     <!-- Cuando se limpia -->
    (onFocus)="onFocusInput()"     <!-- Cuando el input obtiene foco -->
    (onBlur)="onBlurInput()">      <!-- Cuando el input pierde foco -->
</p-autoComplete>
```

---

## Ejemplo Completo Integrado en tu Componente

```typescript
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
    
    // Arrays de estados
    allStates: string[] = [
        'Alabama', 'Alaska', 'Arizona', /* ... todos los estados ... */
    ];
    
    filteredStates: string[] = [];
    selectedState: string = '';
    
    ngOnInit() {
        // Inicialización
    }
    
    /**
     * Se ejecuta mientras escribes
     */
    searchStates(event: any) {
        const query = event.query.toLowerCase();
        this.filteredStates = this.allStates.filter(state => 
            state.toLowerCase().includes(query)
        );
    }
    
    /**
     * Se ejecuta al hacer clic en un elemento
     * AQUÍ CAPTURAS EL EVENTO
     */
    onStateSelected(event: any) {
        // Aquí tienes el elemento seleccionado
        console.log('✅ Estado seleccionado:', event);
        console.log('✅ Valor actual:', this.selectedState);
        
        // Realizar acciones:
        this.loadStateData(this.selectedState);
        this.zoomToState(this.selectedState);
        this.highlightStateOnMap(this.selectedState);
    }
    
    /**
     * Opcional: cuando limpian la selección
     */
    onClearState() {
        console.log('❌ Selección limpiada');
        this.resetMap();
    }
    
    // Métodos de ejemplo
    loadStateData(stateName: string) {
        console.log('Cargando datos de:', stateName);
        // Tu lógica aquí
    }
    
    zoomToState(stateName: string) {
        console.log('Zoom a:', stateName);
        // Tu lógica de mapa aquí
    }
    
    highlightStateOnMap(stateName: string) {
        console.log('Resaltando:', stateName);
        // Tu lógica de resaltado aquí
    }
    
    resetMap() {
        console.log('Reseteando mapa');
        // Tu lógica de reset aquí
    }
}
```

---

## Resumen

✅ **Sí, p-autoComplete es perfecto para tu caso**

### Los 3 pasos clave:

1. **Array completo** → `allStates` (tu array existente)
2. **Array filtrado** → `filteredStates` (lo que se muestra en sugerencias)
3. **Capturar clic** → `(onSelect)="onStateSelected($event)"`

### Código mínimo necesario:

```html
<p-autoComplete 
    [(ngModel)]="selectedState"
    [suggestions]="filteredStates"
    (completeMethod)="search($event)"
    (onSelect)="onSelect($event)">
</p-autoComplete>
```

```typescript
allStates = ['Alabama', 'Alaska', ...];
filteredStates = [];
selectedState = '';

search(event) {
    this.filteredStates = this.allStates.filter(
        s => s.toLowerCase().includes(event.query.toLowerCase())
    );
}

onSelect(event) {
    console.log('Seleccionado:', this.selectedState);
    // Tu lógica aquí
}
```

¡Es así de simple! 🚀
