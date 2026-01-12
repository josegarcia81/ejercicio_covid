// Archivo de propuesta para el método `cortarPoligonosConLinea`.
// Este código está diseñado para ser integrado en `map.component.ts`.
// Incluye las correcciones para manejar MultiLineString, agujeros, 
// polígonos exteriores ("orejas") y el error 'getFactory'.

import Feature from 'ol/Feature';
import { 
    Point,
    Geometry, 
    LineString, 
    LinearRing, 
    Polygon, 
    MultiPoint, 
    MultiLineString, 
    MultiPolygon, 
    GeometryCollection 
} from 'ol/geom';
import OL3Parser from 'jsts/org/locationtech/jts/io/OL3Parser';
import GeometryFactory from 'jsts/org/locationtech/jts/geom/GeometryFactory';
import Polygonizer from 'jsts/org/locationtech/jts/operation/polygonize/Polygonizer';
import UnaryUnionOp from 'jsts/org/locationtech/jts/operation/union/UnaryUnionOp';

// Se asume que las siguientes propiedades provienen del contexto de la clase `MapComponent` (`this`):
// - this.lineVectorSource
// - this.drawnVectorSource
// - this.polIndex
// - styleArray (importado en el componente)

/**
 * CORTA un polígono (feature de OpenLayers) con una línea (feature de OpenLayers).
 * 
 * Esta es la versión propuesta y corregida del método.
 *
 * @param linea La feature de OpenLayers que contiene la LineString/MultiLineString de corte.
 * @param poligono La feature de OpenLayers que contiene el Polygon a cortar.
 */
function cortarPoligonosConLineaPropuesta(this: any, linea: any, poligono: any) {
    if (poligono === null) {
      this.lineVectorSource.removeFeature(linea);
      alert('No intersecta ningun feature');
      return;
    }

    // Factoria de geometrías y parser para convertir entre formatos OL y JSTS
    const geomFactory = new GeometryFactory();
    const parser = new (OL3Parser as any)(geomFactory);
    parser.inject(
        Point, LineString, LinearRing, Polygon, MultiPoint,
        MultiLineString, MultiPolygon, GeometryCollection
    );

    // 1. Parsear las geometrías a formato JSTS
    const polGeometry = parser.read(poligono!.getGeometry());
    const lineGeometry = parser.read(linea.getGeometry());

    // 2. Obtener TODAS las líneas del borde del polígono (contorno exterior y agujeros)
    const polygonBoundaries = polGeometry.getBoundary();

    // 3. Crear una colección con todas las líneas que formarán los nuevos polígonos
    const linesToUnion = [];
    for (let i = 0; i < polygonBoundaries.getNumGeometries(); i++) {
        linesToUnion.push(polygonBoundaries.getGeometryN(i));
    }
    for (let i = 0; i < lineGeometry.getNumGeometries(); i++) {
        const segment = lineGeometry.getGeometryN(i);
        const intersection = polGeometry.intersection(segment);
        // Se añade la intersección solo si no es nula y no está vacía
        if (intersection && !intersection.isEmpty()) {
            linesToUnion.push(intersection);
        }
    }

    // 4. Filtrar geometrías nulas/vacías antes de la unión para evitar el error en JSTS
    const validLinesToUnion = linesToUnion.filter(geom => geom && !geom.isEmpty());

    // 5. Usar UnaryUnionOp para crear una única geometría de líneas "nodadas" (topológicamente correcta)
    const nodedLines = (new UnaryUnionOp(validLinesToUnion)).union();

    // 6. Crear los polígonos a partir de la red de líneas nodadas
    const polygonizer = new Polygonizer();
    polygonizer.add(nodedLines);
    const polygons = polygonizer.getPolygons();

    // 7. Si se generaron polígonos, procesarlos y añadirlos al mapa
    if (polygons.size() > 0) {
        this.drawnVectorSource.removeFeature(poligono);
        const itPolygon = polygons.iterator();

        while (itPolygon.hasNext()) {
            const jstsPol = itPolygon.next() as any;

            // FILTRO DE "OREJAS": Se comprueba que el nuevo polígono esté dentro del original
            if (polGeometry.contains(jstsPol.getInteriorPoint())) {
                
                // Si es válido, se convierte de JSTS a formato OpenLayers
                const olPol = parser.write(jstsPol);
                const newPolygon = new Feature({
                    geometry: olPol,
                    name: 'Pol_' + this.polIndex
                });
                
                // Se asume que `styleArray` está disponible en el contexto del componente
                newPolygon.set('__originalStyle', (this as any).styleArray[0].polygon);
                newPolygon.set('selected', false);
                this.polIndex++;
                this.drawnVectorSource.addFeature(newPolygon);
            }
        }
    }

    this.lineVectorSource.removeFeature(linea);
    console.log('Proceso de corte finalizado.');
}
