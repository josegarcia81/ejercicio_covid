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
import VectorSource from 'ol/source/Vector';

@Injectable({
  providedIn: 'root'
})
export class ToolsService {
  private polIndex: number = 0;
  private drawnVectorSource: VectorSource;
  private lineVectorSource: VectorSource;

  constructor(private _mapService: MapService) {
    // Vector sources and layers are accessed directly from MapService
    this.drawnVectorSource = this._mapService.getDrawnVectorSource();
    this.lineVectorSource = this._mapService.getLineVectorSource();
  }


  /**
   * Description Metodo para cortar poligonos con una linea
   *
   * @param {*} linea 
   * @param {*} poligono 
   */
  cortarPoligonosConLinea(linea: any, poligono: any) {
    // console.log('Metodo cortarPoligonosJSTS', linea, poligono);

    if (poligono === null) {
      // console.log(this._mapService.map.getAllLayers());
      this.lineVectorSource.removeFeature(linea); // Aqui hay que coger el vector source del servicio del map de su propiedad que no esta todavia declarada.
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
    // console.log('JSTS polGeometry', polGeometry);
    // console.log('JSTS lineGeometry', lineGeometry);

    ///////// Para cortar poligono con Agujeros /////////
    //Perform union of Polygon and Line and use Polygonizer to split the polygon by line        
    let holes = polGeometry._holes;
    // Quitando las orejas
    let insideLines = lineGeometry.intersection(polGeometry);
    // console.log('Lineas Interiores', insideLines);

    let union = polGeometry.getExteriorRing().union(lineGeometry);
    let polygonizeHoles = new Polygonizer();

    //Splitting polygon in two part        
    polygonizeHoles.add(union);

    // // Quitando las orejas
    let insideLine = lineGeometry.intersection(polGeometry);
    // insideLine.buffer(10);
    // console.log('lineas intersect', insideLines);

    // Coger el perimetro de poligono
    let bordePoligono = polGeometry.getBoundary();

    // unir perimetro a linea y forzar union nodal
    // bordePoligono.Union
    let perimeters = bordePoligono.union(insideLine);// poner insideLine para ver si quita las orejas del perimetro // o lineGeometry para meterle toda la linea
    let nodalPerimeter = UnaryUnionOp.union(perimeters);
    // console.log('JSTS Geometry', polGeometry);

    // Intento de hacer la diferencia entre el perimetro nuevo incluido linea y el anterior solo del poligono
    // let finalPerimeter = OverlayOp.difference(nodalPerimeter,bordePoligono);

    // Convertir a poligonos, tiene que devolver 2 o mas
    let polygonizer = new Polygonizer();
    polygonizer.add(nodalPerimeter);

    // Cogemos poligonos del poligonizer, es un ArrayList con los metodos de Java
    const polygons = polygonizeHoles.getPolygons(); // "polygonizer" para feature sin huecos / "polygonizeHoles" para feature con huecos // Se podria mejorar con un if(holes.length>0)
    // console.log('Poligonos generados', polygons)
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
        this._mapService.addFeatureToDrawnVectorSource(newPolygon);

      }
      // console.log('Poligonos en drawnVectorSource', this._mapService.drawnVectorSource.getFeatures());
    }
    this._mapService.removeFeatureFromDrawnVectorSource(poligono);
    this._mapService.removeFeatureFromLineVectorSource(linea);
    // console.log('Linea de corte añadida al mapa',this.lineVectorSource.getFeatures());
  }

  /**
   * Description Metodo para cortar poligono con poligono
   * 
   * @param {any} pol1
   * @param {any} pol2
   * @param {string} tool
   * @returns {any}
   */
  cortarPoligonoConPoligono(pol1: any, pol2: any, tool: string) {

    // Factoria de geometrias y parses para convertir ol<-->jsts features
    let geomFactory = new GeometryFactory;
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
    let pol1Geometry = parser.read(pol1!.getGeometry()).buffer(0);
    let pol2Geometry = parser.read(pol2!.getGeometry()).buffer(0);
    // console.log('JSTS polGeometry-1', pol1Geometry);
    // console.log('JSTS polGeometry-2', pol2Geometry);

    let holes = pol2Geometry._holes;

    // Bordes de poligonos
    let bordePoligono1 = pol1Geometry.getBoundary();
    // console.log('Borde-Pol1', bordePoligono1);
    let bordePoligono2 = pol2Geometry.getBoundary();
    // console.log('Borde-Pol2', bordePoligono2);
    // bordePoligono2 = pol2Geometry.buffer(0); // Para solucionar el problema de la forma de reloj de arena o pajarita // esto solo no funciona
    // bordePoligono2 = UnaryUnionOp.union(bordePoligono2);// Para solucionar el problema de la forma de reloj de arena o pajarita
    // Aniadir un if para ver si se cortan por el perimetro

    let cortan = bordePoligono2.intersects(bordePoligono1);
    if (cortan && tool === 'substract') {
      console.log('SI se cortan - SUBSTRACT');
      let resultPol = OverlayOp.difference(pol1Geometry, pol2Geometry);
      // let resultPol = OverlayOp.symDifference(pol1Geometry, pol2Geometry);
      // console.log('Resultado despues de OverlayOp resultPol', resultPol);

      let olPol = parser.write(resultPol);
      // Revisar porque crea multipolygon y necesito tipo polygon
      // console.log('olPol despues de parsearlo a ol', olPol);
      // Control para ver si es multipolygon
      if (olPol.getType() === 'MultiPolygon') {
        let newPolygons = olPol.getPolygons();
        newPolygons.forEach((pol: any) => {

          let resultFeature = new Feature({
            geometry: pol,
            style: styleArray[0].polygon,
            name: 'Pol_' + this.polIndex
          })
          this.polIndex++
          resultFeature.set('__originalStyle', styleArray[0].polygon);
          resultFeature.set('selected', false);
          this._mapService.addFeatureToDrawnVectorSource(resultFeature);
        })
      } else {
        let resultFeature = new Feature({
          geometry: olPol,
          style: styleArray[0].polygon,
          name: 'Pol_' + this.polIndex
        })
        this.polIndex++
        resultFeature.set('__originalStyle', styleArray[0].polygon);
        resultFeature.set('selected', false);
        this._mapService.addFeatureToDrawnVectorSource(resultFeature);
      }

      this._mapService.removeFeatureFromDrawnVectorSource(pol1);
      // this.map.updateSize();
      // this.map.render();
      // console.log(this.map, this.drawnVectorSource.getFeatures(), pol2);

    } else if (cortan && tool === 'exclude') {
      console.log('SI se cortan - EXCLUDE');
      //let resultPol = OverlayOp.difference(pol1Geometry, pol2Geometry);
      let resultPol = OverlayOp.symDifference(pol1Geometry, pol2Geometry);
      let olPol = parser.write(resultPol);
      // console.log('Ver resultado Multipolygon JSTS, OpenLayers', resultPol, olPol);

      const newPolygons = olPol.getPolygons();
      // console.log('newPolygons OL', newPolygons)
      // Recorrer el array y crear features

      newPolygons.forEach((pol: any) => {

        let resultFeature = new Feature({
          geometry: pol,
          style: styleArray[0].polygon,
          name: 'Pol_' + this.polIndex
        })
        this.polIndex++
        resultFeature.set('__originalStyle', styleArray[0].polygon);
        resultFeature.set('selected', false);
        this._mapService.addFeatureToDrawnVectorSource(resultFeature);
        console.log('Hola')
      })

      this._mapService.removeFeatureFromDrawnVectorSource(pol1);
      this._mapService.removeFeatureFromDrawnVectorSource(pol2);

    } else {
      // console.log('NO se cortan los bordes, es Interior');
      let resultPol = OverlayOp.difference(pol1Geometry, pol2Geometry);

      let olPol = parser.write(resultPol);

      let resultFeature = new Feature({
        geometry: olPol,
        style: styleArray[0].polygon,
        name: 'Pol_' + this.polIndex
      })
      this.polIndex++

      resultFeature.set('__originalStyle', styleArray[0].polygon);
      resultFeature.set('selected', false);
      this._mapService.addFeatureToDrawnVectorSource(resultFeature);

      this._mapService.removeFeatureFromDrawnVectorSource(pol1);
      this._mapService.removeFeatureFromDrawnVectorSource(pol2);
    }
  }

  /**
   * Description Metodo para unir Poligonos
   *
   * @param {*} pol1 
   * @param {*} pol2 
   */
  unirPoligonoConPoligono(pol1: any, pol2: any) {

    //console.log('Metodo unirPoligonoConPoligono', pol1, pol2);

    if (pol1 === null || pol2 === null) {
      alert('No hay poligonos que unir')
      return
    }

    // Factoria de geometrias y parses para convertir ol<-->jsts features
    let geomFactory = new GeometryFactory;
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
    let pol1Geometry = parser.read(pol1!.getGeometry()).buffer(0);
    let pol2Geometry = parser.read(pol2!.getGeometry()).buffer(0);
    //console.log('JSTS polGeometry', pol1Geometry);
    //console.log('JSTS lineGeometry', pol2Geometry);

    let resultPol = OverlayOp.union(pol1Geometry, pol2Geometry);

    let olPol = parser.write(resultPol);

    if (olPol.getType() === 'MultiPolygon') {
      let newPolygons = olPol.getPolygons();
      newPolygons.forEach((pol: any) => {

        let resultFeature = new Feature({
          geometry: pol,
          style: styleArray[0].polygon,
          name: 'Pol_' + this.polIndex
        })
        this.polIndex++
        resultFeature.set('__originalStyle', styleArray[0].polygon);
        resultFeature.set('selected', false);
        this._mapService.addFeatureToDrawnVectorSource(resultFeature);
      })
    } else {
      let resultFeature = new Feature({
        geometry: olPol,
        style: styleArray[0].polygon,
        name: 'Pol_' + this.polIndex
      })
      this.polIndex++
      resultFeature.set('__originalStyle', styleArray[0].polygon);
      resultFeature.set('selected', false);
      this._mapService.addFeatureToDrawnVectorSource(resultFeature);
    }

    this._mapService.removeFeatureFromDrawnVectorSource(pol1);
    this._mapService.removeFeatureFromDrawnVectorSource(pol2);

  }
}
