# Análisis y Propuesta para `tools.service.ts`

He analizado tu archivo `tools.service.ts` y he encontrado varios puntos que pueden mejorarse para hacer el código más robusto, limpio y fácil de mantener. Aquí tienes mi análisis y una propuesta de código.

## 🧐 Análisis de Problemas Detectados

1.  **Duplicación de Código (DRY):**
    *   La inicialización de `GeometryFactory` y `OL3Parser` (y la inyección de dependencias) se repite en cada método. Esto consume recursos innecesariamente y ensucia el código.
    *   La lógica para convertir los resultados de JSTS (que pueden ser `Polygon` o `MultiPolygon`) de vuelta a Features de OpenLayers y añadirlos al mapa también se repite.

2.  **Manejo de "Agujeros" (Holes) en JSTS:**
    *   Estás accediendo a `polGeometry._holes`, que parece ser una propiedad interna/privada de JSTS. Lo correcto es usar los métodos públicos de la API de JSTS (`getNumInteriorRing`, `getInteriorRingN`) para asegurar la compatibilidad futura.
    *   La lógica de re-restar los agujeros dentro del bucle de nuevos polígonos es un poco frágil.

3.  **Manejo de MultiPolígonos:**
    *   En `cortarPoligonoConPoligono`, hay un `if` explícito para `MultiPolygon` que duplica la lógica de creación de features. Si una operación devuelve una colección de geometría o un MultiPolygon, el código debería ser capaz de iterar sobre sus partes de forma genérica.
    *   En el caso de `exclude`, usas `olPol.getPolygons()` asumiendo que siempre vuelve un MultiPolygon, lo cual podría fallar si el resultado es un único Polygon.

4.  **Robustez Geométrica:**
    *   El uso de `.buffer(0)` es una muy buena práctica para arreglar auto-intersecciones, pero no se aplica consistentemente en todos los inputs.

5.  **Tipado:**
    *   El uso excesivo de `any` impide que TypeScript te ayude a detectar errores de tipos en las geometrías.

## 💡 Propuesta de Refactorización

Mi propuesta centraliza la configuración de JSTS y crea métodos auxiliares (`helpers`) para las tareas repetitivas.

### Estructura Propuesta

```typescript
import { Injectable } from '@angular/core';
import { styleArray } from '../shared/styles';
import { MapService } from './map.service';

// JSTS & OL Imports
import 'jsts/org/locationtech/jts/monkey.js';
import OL3Parser from 'jsts/org/locationtech/jts/io/OL3Parser';
import GeometryFactory from 'jsts/org/locationtech/jts/geom/GeometryFactory';
import Polygonizer from 'jsts/org/locationtech/jts/operation/polygonize/Polygonizer';
import UnaryUnionOp from 'jsts/org/locationtech/jts/operation/union/UnaryUnionOp';
import OverlayOp from 'jsts/org/locationtech/jts/operation/overlay/OverlayOp';
import Feature from 'ol/Feature';
import { Geometry, LineString, LinearRing, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon, GeometryCollection } from 'ol/geom';
import VectorSource from 'ol/source/Vector';

@Injectable({
  providedIn: 'root'
})
export class ToolsService {
  private polIndex: number = 0;
  private drawnVectorSource: VectorSource;
  private lineVectorSource: VectorSource;
  
  // Instancia única del parser de JSTS
  private parser: any; 

  constructor(private _mapService: MapService) {
    this.drawnVectorSource = this._mapService.getDrawnVectorSource();
    this.lineVectorSource = this._mapService.getLineVectorSource();
    this.initJSTS();
  }

  // 1. Inicialización centralizada
  private initJSTS() {
    const geomFactory = new GeometryFactory();
    this.parser = new (OL3Parser as any)(geomFactory);
    this.parser.inject(
      Point,
      LineString,
      LinearRing,
      Polygon,
      MultiPoint,
      MultiLineString,
      MultiPolygon,
      GeometryCollection
    );
  }

  // 2. Helper para limpieza de features originales
  private cleanUpFeatures(featuresToRemove: Feature[]) {
    featuresToRemove.forEach(f => {
      // Intenta remover de ambas fuentes por seguridad, o verifica el origen
      if (this.drawnVectorSource.getFeatureById(f.getId()!) || this.drawnVectorSource.hasFeature(f)) {
         this.drawnVectorSource.removeFeature(f);
      }
      if (this.lineVectorSource.getFeatureById(f.getId()!) || this.lineVectorSource.hasFeature(f)) {
         this.lineVectorSource.removeFeature(f);
      }
    });
  }

  // 3. Helper genérico para procesar resultados JSTS
  private processJSTSResult(jstsGeometry: any) {
    if (!jstsGeometry || jstsGeometry.isEmpty()) return;

    const olGeometry = this.parser.write(jstsGeometry);
    let polygonsData: Polygon[] = [];

    // Normalizar a Array de Polígonos
    if (olGeometry.getType() === 'Polygon') {
      polygonsData.push(olGeometry as Polygon);
    } else if (olGeometry.getType() === 'MultiPolygon') {
      polygonsData = (olGeometry as MultiPolygon).getPolygons();
    } else if (olGeometry.getType() === 'GeometryCollection') {
       // Si fuera una colección, extraemos los polígonos
       (olGeometry as GeometryCollection).getGeometries().forEach(g => {
         if (g.getType() === 'Polygon') polygonsData.push(g as Polygon);
         if (g.getType() === 'MultiPolygon') polygonsData.push(...(g as MultiPolygon).getPolygons());
       });
    }

    // Crear Features
    polygonsData.forEach(poly => {
      const newFeature = new Feature({
        geometry: poly,
        name: `Pol_${this.polIndex++}`
      });
      newFeature.setStyle(styleArray[0].polygon);
      newFeature.set('__originalStyle', styleArray[0].polygon);
      newFeature.set('selected', false);
      
      this.drawnVectorSource.addFeature(newFeature);
    });
  }

  /**
   * Cortar polígono con línea usando JSTS
   */
  cortarPoligonosConLinea(linea: Feature, poligono: Feature) {
    if (!poligono || !linea) return;

    // Convertir a JSTS
    const polGeom = this.parser.read(poligono.getGeometry()).buffer(0);
    const lineGeom = this.parser.read(linea.getGeometry());

    // 1. Unir el anillo exterior del polígono con la línea de corte
    const exteriorRing = polGeom.getExteriorRing();
    const union = exteriorRing.union(lineGeom);

    // 2. Poligonizar (crear áreas cerradas a partir de líneas)
    const polygonizer = new Polygonizer();
    polygonizer.add(union);
    
    const polygons = polygonizer.getPolygons(); // Collection<Polygon> de Java/JSTS

    // 3. Procesar resultados y restaurar agujeros
    if (polygons.size() > 0) {
        const it = polygons.iterator();
        while (it.hasNext()) {
            let jstsPoly = it.next();
            
            // Re-restar los agujeros originales si el nuevo polígono cae dentro
            // Esto es más seguro que iterar _holes manualmente
            for (let i = 0; i < polGeom.getNumInteriorRing(); i++) {
                const hole = polGeom.getInteriorRingN(i);
                // Convertir linearRing a Polygon para hacer difference
                const holePoly = this.parser.getFactory().createPolygon(hole, null);
                
                try {
                  jstsPoly = jstsPoly.difference(holePoly);
                } catch (e) {
                   console.warn("Error restando agujero", e);
                }
            }
            
            // Validar que el polígono resultante es válido y está dentro del original (opcional pero recomendado)
            if (polGeom.contains(jstsPoly.getInteriorPoint())) {
                 this.processJSTSResult(jstsPoly); 
            }
        }
    }

    this.cleanUpFeatures([poligono, linea]);
  }

  /**
   * Operaciones booleanas entre dos polígonos
   */
  cortarPoligonoConPoligono(pol1: Feature, pol2: Feature, tool: string) {
    const geom1 = this.parser.read(pol1.getGeometry()).buffer(0);
    const geom2 = this.parser.read(pol2.getGeometry()).buffer(0);

    let resultGeom;

    // Determinar operación
    if (tool === 'substract') {
       // Diferencia: Pol1 - Pol2
       resultGeom = OverlayOp.difference(geom1, geom2);
    } else if (tool === 'exclude') {
       // Diferencia Simétrica: (A u B) - (A n B)
       resultGeom = OverlayOp.symDifference(geom1, geom2);
    } else {
       // Fallback a diferencia normal
       resultGeom = OverlayOp.difference(geom1, geom2);
    }
    
    // Procesar resultado único
    this.processJSTSResult(resultGeom);
    
    // Limpieza
    this.cleanUpFeatures([pol1, pol2]);
  }
}
```

### Ventajas de esta propuesta:
1.  **Código Limpio**: Se eliminan bloques repetidos, facilitando la lectura.
2.  **Mantenibilidad**: Si cambias la librería o la lógica de inicialización, solo tocas un sitio.
3.  **Seguridad**: Manejas mejor los casos bordes (geometrías vacías, tipos inesperados).
4.  **Escalabilidad**: Es muy fácil añadir nuevas herramientas (ej: `union`, `intersection`) simplemente agregando un `case` más en `cortarPoligonoConPoligono`.
