# PrimeNG AutoComplete - Explicación y Propuesta

## ¿Qué es p-autoComplete?

`p-autoComplete` es un componente de PrimeNG que proporciona **sugerencias autocompletas** mientras el usuario escribe en un campo de entrada. Es similar a un buscador como Google: cuando escribes, te muestra sugerencias relevantes.

---

## Diferencia con p-listbox

| Característica | p-listbox | p-autoComplete |
|---|---|---|
| **Visualización** | Lista completa visible | Campo de texto con sugerencias emergentes |
| **Búsqueda** | Filtro opcional sobre lista visible | Búsqueda dinámica mientras escribes |
| **UX** | Mejor para listas cortas/medianas | Mejor para listas largas |
| **Espacio** | Ocupa más espacio visual | Compacto, solo un input |

---

## Código Actual (Problemático)

```html
<p-autoComplete 
    [(ngModel)]="selectedCity" 
    [suggestions]="cities" 
    field='' 
    (completeMethod)="selecState($event)">
</p-autoComplete>
```

### Problemas Identificados

#### 1. **`field=''` está vacío** ❌
- El atributo `field` define **qué propiedad del objeto** mostrar como texto
- Si `cities` es un array de objetos como `{ name: 'Alabama', code: 'AL' }`, el `field` debería ser `'name'`
- Si `cities` es un array de strings `['Alabama', 'Alaska', ...]`, NO necesitas el atributo `field`

#### 2. **`(completeMethod)` debe filtrar sugerencias** ⚠️
- El método `completeMethod` se ejecuta **cada vez que el usuario escribe**
- Su propósito es **filtrar** el array de ciudades según el texto ingresado
- Debe actualizar el array `cities` con solo las coincidencias

#### 3. **`cities` debe ser dinámico** ⚠️
- `cities` debe contener solo las sugerencias filtradas, no todas las ciudades
- Necesitas un array completo separado con todos los datos

---

## Propuesta de Implementación

### Escenario 1: Array de Strings Simples

Si tus ciudades son un array simple de strings:

#### HTML
```html
<p-autoComplete 
    [(ngModel)]="selectedCity" 
    [suggestions]="filteredCities" 
    (completeMethod)="filterCities($event)"
    placeholder="Buscar estado..."
    [dropdown]="true"
    [forceSelection]="true">
</p-autoComplete>
```

#### TypeScript (map.component.ts)
```typescript
export class MapComponent {
    // Array completo de todas las ciudades/estados
    allCities: string[] = [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
        'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
        // ... todos los estados
    ];
    
    // Array filtrado que se muestra en las sugerencias
    filteredCities: string[] = [];
    
    // Ciudad/estado seleccionado
    selectedCity: string = '';
    
    /**
     * Filtra las ciudades según lo que el usuario escribe
     * @param event - Evento que contiene la query del usuario
     */
    filterCities(event: any) {
        const query = event.query.toLowerCase();
        
        this.filteredCities = this.allCities.filter(city => 
            city.toLowerCase().includes(query)
        );
    }
    
    /**
     * Método cuando se selecciona un estado (opcional)
     */
    onCitySelect() {
        console.log('Estado seleccionado:', this.selectedCity);
        // Aquí puedes hacer zoom al estado en el mapa, etc.
    }
}
```

---

### Escenario 2: Array de Objetos (Recomendado)

Si necesitas más información de cada estado:

#### TypeScript
```typescript
export class MapComponent {
    // Array completo con objetos de estado
    allStates: any[] = [
        { name: 'Alabama', code: 'AL', population: 5024279 },
        { name: 'Alaska', code: 'AK', population: 733391 },
        { name: 'Arizona', code: 'AZ', population: 7151502 },
        // ... todos los estados
    ];
    
    // Array filtrado
    filteredStates: any[] = [];
    
    // Estado seleccionado (objeto completo)
    selectedState: any = null;
    
    /**
     * Filtra los estados según lo que el usuario escribe
     */
    filterStates(event: any) {
        const query = event.query.toLowerCase();
        
        this.filteredStates = this.allStates.filter(state => 
            state.name.toLowerCase().includes(query) ||
            state.code.toLowerCase().includes(query)
        );
    }
    
    /**
     * Se ejecuta cuando el usuario selecciona un estado
     */
    onStateSelect(event: any) {
        console.log('Estado seleccionado:', this.selectedState);
        // Hacer zoom al estado en el mapa
        // this.zoomToState(this.selectedState);
    }
}
```

#### HTML
```html
<p-autoComplete 
    [(ngModel)]="selectedState" 
    [suggestions]="filteredStates" 
    (completeMethod)="filterStates($event)"
    (onSelect)="onStateSelect($event)"
    field="name"
    placeholder="Buscar estado..."
    [dropdown]="true"
    [forceSelection]="true"
    [minLength]="1">
    
    <!-- Template personalizado para las sugerencias (opcional) -->
    <ng-template let-state pTemplate="item">
        <div class="state-item">
            <span class="state-name">{{ state.name }}</span>
            <span class="state-code"> ({{ state.code }})</span>
        </div>
    </ng-template>
</p-autoComplete>
```

---

## Propiedades Importantes de p-autoComplete

### Propiedades Básicas

| Propiedad | Tipo | Descripción |
|---|---|---|
| `[(ngModel)]` | any | Variable que almacena el valor seleccionado (two-way binding) |
| `[suggestions]` | array | Array de sugerencias a mostrar (dinámico, filtrado) |
| `field` | string | Nombre de la propiedad del objeto a mostrar como texto |
| `(completeMethod)` | function | Método que se ejecuta al escribir, debe filtrar sugerencias |

### Propiedades Avanzadas

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `[dropdown]` | boolean | false | Muestra botón para ver todas las opciones |
| `[forceSelection]` | boolean | false | Obliga a seleccionar una opción de la lista |
| `[minLength]` | number | 1 | Caracteres mínimos antes de buscar |
| `[delay]` | number | 300 | Milisegundos de espera antes de buscar |
| `[multiple]` | boolean | false | Permite seleccionar múltiples valores |
| `placeholder` | string | - | Texto placeholder del input |
| `[disabled]` | boolean | false | Deshabilita el componente |
| `(onSelect)` | function | - | Evento cuando se selecciona un item |
| `(onClear)` | function | - | Evento cuando se limpia la selección |

---

## Ejemplo de Flujo Completo

### 1. Usuario escribe "Ala"
```
Input: "Ala"
  ↓
completeMethod se ejecuta
  ↓
filterStates({ query: "Ala" })
  ↓
filteredStates = [
  { name: 'Alabama', code: 'AL', ... },
  { name: 'Alaska', code: 'AK', ... }
]
  ↓
Sugerencias aparecen en el dropdown
```

### 2. Usuario selecciona "Alabama"
```
Click en "Alabama"
  ↓
selectedState = { name: 'Alabama', code: 'AL', ... }
  ↓
onSelect se ejecuta (opcional)
  ↓
Realizar acciones (zoom al estado, mostrar datos, etc.)
```

---

## Comparación con tu código actual

### Tu código actual
```typescript
// ❌ Problemas:
cities: string[] = [...]; // Se muestra todo, no se filtra
selectedCity: string = '';

selecState(event: any) {
    // Este método probablemente hace zoom o selecciona,
    // NO filtra las sugerencias como debería
}
```

### Código propuesto
```typescript
// ✅ Correcto:
allCities: string[] = [...];        // Todas las ciudades (fuente de datos)
filteredCities: string[] = [];      // Solo sugerencias filtradas
selectedCity: string = '';          // Ciudad seleccionada

filterCities(event: any) {
    // Filtra y actualiza las sugerencias
    const query = event.query.toLowerCase();
    this.filteredCities = this.allCities.filter(city => 
        city.toLowerCase().includes(query)
    );
}

onCitySelect() {
    // Acciones después de seleccionar (zoom, etc.)
    console.log('Seleccionado:', this.selectedCity);
}
```

---

## Recomendación Final

### Para tu proyecto de COVID:

1. **Usa Escenario 2** (array de objetos) porque:
   - Necesitas información adicional de cada estado (población, coordenadas, etc.)
   - Más flexible para futuras expansiones
   - Permite mostrar información rica en las sugerencias

2. **Cambia el nombre de las variables** para claridad:
   ```typescript
   allStates: State[]          // Todos los estados
   filteredStates: State[]     // Estados filtrados
   selectedState: State        // Estado seleccionado
   ```

3. **Conecta con el mapa:**
   ```typescript
   onStateSelect(event: any) {
       // Hacer zoom al estado seleccionado
       this.zoomToState(this.selectedState);
       
       // Mostrar información del estado
       this.showStateInfo(this.selectedState);
   }
   ```

4. **Considera agregar un template personalizado** para mostrar información rica:
   ```html
   <ng-template let-state pTemplate="item">
       <div class="state-suggestion">
           <strong>{{ state.name }}</strong>
           <span class="code">{{ state.code }}</span>
           <span class="population">{{ state.population | number }}</span>
       </div>
   </ng-template>
   ```

---

## Recursos Adicionales

- 📖 [Documentación oficial PrimeNG AutoComplete](https://primeng.org/autocomplete)
- 💡 [Ejemplos interactivos](https://primeng.org/autocomplete#basic)

---

## Próximos Pasos Sugeridos

1. ✅ Decidir si usar strings simples u objetos
2. ✅ Crear el método `filterStates()` o `filterCities()`
3. ✅ Separar datos completos de sugerencias filtradas
4. ✅ Implementar `onSelect` para acciones post-selección
5. ✅ (Opcional) Customizar el template de sugerencias
6. ✅ Probar con diferentes búsquedas

¿Necesitas ayuda implementando alguno de estos escenarios?
