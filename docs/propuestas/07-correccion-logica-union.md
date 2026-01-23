# Corrección Lógica de Unión de Polígonos

## 🚨 Problema Detectado

La implementación actual en `map.component.ts` para unir polígonos tiene dos problemas principales de lógica y rendimiento:

1.  **Iteración Ineficiente:** Se recorre el array de features completo (`for` loop) y para *cada* feature se realiza una búsqueda espacial. Esto incrementa la complejidad innecesariamente.
2.  **Auto-intersección:** La búsqueda `forEachFeatureInExtent` utiliza el extent del polígono recién dibujado (`drawedFeature`). Como este polígono ya existe en la capa, la función siempre se encuentra a sí misma primero, provocando intentos erróneos de unirse consigo mismo o bloqueos si se añade lógica de "si es el mismo, cancelar".

### Código Problemático

```typescript
// Bucle ineficiente exterior
for (let i = length; i >= 0; i--) {
    const lastFeature = this.drawnVectorSource.getFeatures()[i]; 
    const drawedFeature = this.drawEndInteractionEvent?.feature; 
    const extent = drawedFeature.getGeometry()!.getExtent(); // Extent del NUEVO

    // Bucle espacial interior (repite búsqueda por cada elemento del exterior)
    const featureTocada = this.drawnVectorSource.forEachFeatureInExtent(extent, (feature) => {
        return feature; // Devuelve el PRIMERO encontrado (probablemente él mismo)
    });
    
    // Intenta unir lastFeature (que cambia) con featureTocada (que siempre es la misma)
    this._toolsService.unirPoligonoConPoligono(featureTocada, lastFeature);
}
```

## ✅ Solución Propuesta

Optimizar la lógica para realizar **una sola búsqueda espacial**. Usar `forEachFeatureInExtent` para detectar candidatos válidos y filtrar explícitamente el propio polígono que se está dibujando.

### Lógica Correcta

1.  Obtener el polígono recién dibujado (`drawedFeature`) y su `extent`.
2.  Ejecutar `forEachFeatureInExtent` **una sola vez**.
3.  Dentro del callback, **ignorar** si el feature encontrado es el mismo que `drawedFeature`.
4.  Si encontramos uno distinto, proceder a la unión.

### Código Propuesto (`map.component.ts`)

```typescript
// 1. Obtiene el nuevo polígono y su extent
const drawedFeature = this.drawEndInteractionEvent?.feature;
const extent = drawedFeature.getGeometry()!.getExtent();

// 2. Busca SOLO los features que intersectan con este extent
// No necesitamos recorrer todo el array con un for externo
const featuresIntersectando: Feature[] = [];

this.drawnVectorSource.forEachFeatureInExtent(extent, (feature) => {
    // IMPORTANTE: Evita unirse consigo mismo comparando IDs o referencias
    if (feature !== drawedFeature && feature.get('name') !== drawedFeature.get('name')) {
        featuresIntersectando.push(feature as Feature);
        return feature; // Retornamos para detener si solo queremos unir con el primero
    }
    return undefined; // Sigue buscando si encontró el propio polígono
});

// 3. Procesar unión
if (featuresIntersectando.length > 0) {
    const targetFeature = featuresIntersectando[0];
    console.log(`Uniendo nuevo polígono (${drawedFeature.get('name')}) con existente (${targetFeature.get('name')})`);
    
    this._toolsService.unirPoligonoConPoligono(targetFeature, drawedFeature);
} else {
    console.log('No se encontraron polígonos adyacentes para unir.');
}
```

## 🎯 Beneficios

*   **Rendimiento:** Transformamos una complejidad O(N²) potencial en una única consulta espacial O(1) o O(log N) dependiendo de la implementación interna del QuadTree de OpenLayers.
*   **Robustez:** Eliminamos totalmente la posibilidad de intentar unir un polígono consigo mismo.
*   **Limpieza:** El código es mucho más conciso y fácil de entender.
