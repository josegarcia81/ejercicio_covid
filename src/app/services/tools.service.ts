// ANGULAR //
import { Injectable } from '@angular/core';

// SHARED //
import { styleArray } from '../shared/styles';

// SERVICIOS //
import { MapService } from './map.service';

// JSTS //
// LIBRERIA JSTS
import 'jsts/org/locationtech/jts/monkey.js'; // Soluciona el problema de ".union" function doesn`t exist
import OL3Parser from 'jsts/org/locationtech/jts/io/OL3Parser'
import GeometryFactory from 'jsts/org/locationtech/jts/geom/GeometryFactory';
import Polygonizer from 'jsts/org/locationtech/jts/operation/polygonize/Polygonizer';
import UnaryUnionOp from 'jsts/org/locationtech/jts/operation/union/UnaryUnionOp';
// import UnionOp from 'jsts/org/locationtech/jts/operation/union/UnionOp.js';
import OverlayOp from 'jsts/org/locationtech/jts/operation/overlay/OverlayOp';
// OL OPENLAYERS //
import Feature from 'ol/Feature';
import { Geometry, GeometryCollection, LinearRing, LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon } from 'ol/geom';

@Injectable({
  providedIn: 'root'
})
export class ToolsService {
  private polIndex: number = 0;

  constructor(private _mapService: MapService) {
    // Vector sources and layers are accessed directly from MapService
  }


  /**
   * Description Metodo para cortar poligonos con una linea
   *
   * @param {*} linea 
   * @param {*} poligono 
   */
  cortarPoligonosConLinea(linea: any, poligono: any) {
    console.log('Metodo cortarPoligonosJSTS', linea, poligono);

    if (poligono === null) {
      console.log(this._mapService.map.getAllLayers());
      this._mapService.lineVectorSource.removeFeature(linea); // Aqui hay que coger el vector source del servicio del map de su propiedad que no esta todavia declarada.
      alert('No intersecta ningun feature')
      return
    }

    // Factoria de geometrias y parses para convertir ol<-->jsts features
    const geomFactory = new GeometryFactory;
    const parser = new (OL3Parser as any)(geomFactory);
    // Inyeccion para las geometrias convertibles
    parser.inject(
      Point,
      LineString,
      LinearRing,
      Polygon,
      MultiPoint,
      MultiLineString,
      MultiPolygon,
      GeometryCollection
    );

    // Parsear las geometrias a jsts
    let polGeometry = parser.read(poligono.getGeometry());
    let lineGeometry = parser.read(linea.getGeometry());
    console.log('JSTS polGeometry', polGeometry);
    console.log('JSTS lineGeometry', lineGeometry);

    ///////// Para cortar poligono con Agujeros /////////
    //Perform union of Polygon and Line and use Polygonizer to split the polygon by line        
    let holes = polGeometry._holes;
    // Quitando las orejas
    let insideLines = lineGeometry.intersection(polGeometry);
    console.log('Lineas Interiores', insideLines);

    let union = polGeometry.getExteriorRing().union(lineGeometry);
    let polygonizeHoles = new Polygonizer();

    //Splitting polygon in two part        
    polygonizeHoles.add(union);

    // // Quitando las orejas
    let insideLine = lineGeometry.intersection(polGeometry);
    // insideLine.buffer(10);
    console.log('lineas intersect', insideLines);

    // Coger el perimetro de poligono
    let bordePoligono = polGeometry.getBoundary();

    // unir perimetro a linea y forzar union nodal
    // bordePoligono.Union
    let perimeters = bordePoligono.union(insideLine);// poner insideLine para ver si quita las orejas del perimetro // o lineGeometry para meterle toda la linea
    let nodalPerimeter = UnaryUnionOp.union(perimeters);
    console.log('JSTS Geometry', polGeometry);

    // Intento de hacer la diferencia entre el perimetro nuevo incluido linea y el anterior solo del poligono
    // let finalPerimeter = OverlayOp.difference(nodalPerimeter,bordePoligono);

    // Convertir a poligonos, tiene que devolver 2 o mas
    let polygonizer = new Polygonizer();
    polygonizer.add(nodalPerimeter);

    // Cogemos poligonos del poligonizer, es un ArrayList con los metodos de Java
    const polygons = polygonizeHoles.getPolygons(); // "polygonizer" para feature sin huecos / "polygonizeHoles" para feature con huecos // Se podria mejorar con un if(holes.length>0)
    console.log('Poligonos generados', polygons)
    // Si se generan 2 o mas poligonos
    if (polygons.size() >= 2) {
      // Iterator para recorrer los nuevos poligonos
      let itPolygon = polygons.iterator();
      while (itPolygon.hasNext()) {
        let jstsPol = itPolygon.next() as any;

        // Logic for splitting polygon with holes // https://geoknight.medium.com/split-a-polygon-with-holes-by-line-in-openlayers-3ad022a268f1 // info
        holes.forEach((hole: any) => {
          let arr = []
          for (let i in hole.getCoordinates()) {
            arr.push([hole.getCoordinates()[i].x, hole.getCoordinates()[i].y])
          }
          hole = parser.read(new Polygon([arr]));
          jstsPol = jstsPol.difference(hole);
        });

        // Convertir poligono de jsts a Ol
        const olPol = parser.write(jstsPol);

        let newPolygon = new Feature({
          geometry: olPol,
          style: styleArray[0].polygon,
          name: 'Pol_' + this.polIndex
        })
        this.polIndex++
        newPolygon.set('__originalStyle', styleArray[0].polygon);
        newPolygon.set('selected', false);
        this._mapService.drawnVectorSource.addFeature(newPolygon);
        console.log('Poligonos en drawnVectorSource', this._mapService.drawnVectorSource.getFeatures());
      }

    }
    this._mapService.drawnVectorSource.removeFeature(poligono);
    this._mapService.lineVectorSource.removeFeature(linea);
    // console.log('Linea de corte añadida al mapa',this.lineVectorSource.getFeatures());
  }
}
