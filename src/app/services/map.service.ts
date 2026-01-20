import { Injectable } from '@angular/core';
// LIBRERIA OL //
// Capas
import Tile from 'ol/layer/Tile';
import Map from "ol/Map";
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import View from 'ol/View';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Zoom from 'ol/control/Zoom'
// Interacciones
import Draw from 'ol/interaction/Draw'
import { defaults } from 'ol/interaction/defaults'
// Features
import { Feature } from 'ol';
import { Geometry, GeometryCollection, LinearRing, LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon } from 'ol/geom';

// RxJS //
import { BehaviorSubject, Observable } from 'rxjs';
import VectorLayer from 'ol/layer/Vector';
import { styleArray } from '../shared/styles';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  // Subject para emitir en caso de cambios en el mapa
  public map!: Map;
  public layers: any[] = [];

  // Source y Capa para pintar Lineas
  public lineVectorSource: any;
  public lineVectorLayer: any;

  // Source y Capa para pintar Poligonos
  public drawnVectorSource: any;
  public drawnVectorLayer: any;

  // Subject para emitir en caso de cambios en el array de las capas del mapa
  private layerArraySubject: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([{ name: 'Cargando...', selected: false }]);
  public layerArray$ = this.layerArraySubject.asObservable();

  // Subject para emitir en caso de cambios en el nombre de la navegación a mostrar
  private navToShowSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public navToShow$ = this.navToShowSubject.asObservable();

  // Subject para emitir en caso de cambios en el área del polígono
  private polAreaSubject: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public polArea$ = this.polAreaSubject.asObservable();

  // Subject para emitir en caso de cambios en la visibilidad de una capa
  private layerVisibilitySubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public layerVisibility$ = this.layerVisibilitySubject.asObservable();

  // Subject para emitir en caso de cambios en el estado del menu
  private menuSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public menu$ = this.menuSubject.asObservable();



  constructor() { }

  /**
   * Description Devuelve el mapa creado.
   *
   * @returns {Map} 
   */
  getMap() {

    // const mapControls = [/*attributionControl, scaleLineControl, overViewMapControl,*/ zoomControl]

    this.map = new Map({
      view: new View({
        center: fromLonLat([-97, 35.56]),
        // center: olProj.toLonLat([-10834205.143065585,4533066.249497813],'EPSG:3857'),
        zoom: 4.5,
        // No funciona
        //extent:[-14470164.744565764,2160596.1727030342,-6979732.56896254,6902424.938499223]
        //projection: olProj.toLonLat([-11097468.579299154, 4836162.802892406]),
      }),
      layers: [
        new Tile({
          source: new OSM()
        })
      ],
      target: 'map',
      interactions: defaults({
        doubleClickZoom: false
      })
    });

    // Se devuelve el mapa //
    return this.map;
  }

  /**
   * Description Devuelve el source de las lineas.
   *
   * @returns {VectorSource<Feature<LineString>>} 
   */
  getLineVectorSource() {
    this.lineVectorSource = new VectorSource<Feature<LineString>>({
      format: new GeoJSON
    });
    console.log('Source de lineas desde el map.service.ts');
    return this.lineVectorSource;
  }

  /**
   * Description Devuelve la capa de las lineas.
   *
   * @returns {VectorLayer<Feature<LineString>>} 
   */
  getLineVectorLayer() {
    this.lineVectorLayer = new VectorLayer({
      source: this.lineVectorSource,
      visible: true,
      zIndex: 2,
      style: styleArray[0].lineBlue
    });
    this.map.addLayer(this.lineVectorLayer);
    console.log('Capa de lineas desde el map.service.ts');
    return this.lineVectorLayer;
  }

  /**
   * Description Devuelve el source de los poligonos.
   *
   * @returns {VectorSource<Feature<Polygon>>} 
   */
  getDrawnVectorSource() {
    this.drawnVectorSource = new VectorSource<Feature<Polygon>>({
      format: new GeoJSON
    });
    console.log('Source de poligonos desde el map.service.ts');
    return this.drawnVectorSource;
  }

  /**
   * Description Devuelve la capa de los poligonos.
   *
   * @returns {VectorLayer<Feature<Polygon>>} 
   */
  getDrawnVectorLayer() {
    this.drawnVectorLayer = new VectorLayer({
      source: this.drawnVectorSource,
      visible: true,
      zIndex: 2,
      style: styleArray[0].polygon
    });
    this.map.addLayer(this.drawnVectorLayer);
    console.log('Capa de poligonos desde el map.service.ts');
    return this.drawnVectorLayer;
  }

  /**
   * Description Setea los nombres de las capas disponibles.
   *
   * @param {any[]} layers 
   */
  setLayerArray(layers: any[]) {
    this.layerArraySubject.next(layers);
  }

  /**
   * Description Setea la navegación a mostrar.
   * @param nav - The name of the navigation item to show
   */
  setNavToShow(nav: string) {
    this.navToShowSubject.next(nav);
  }

  /**
   * Description Setea el área del polígono.
   *
   * @param {number} area 
   */
  setPolygonArea(area: number) {
    this.polAreaSubject.next(area);
  }

  /**
   * Description Alternar la visibilidad de una capa.
   *
   * @param {*} layer
   */
  toggleLayerVisibility(layer: any) {
    this.layerVisibilitySubject.next(layer);
  }

  /**
   * Description Alternar la visibilidad del menu.
   *
   * @param {boolean} menu 
   */
  toggleMenu(menu: boolean) {
    this.menuSubject.next(menu);
  }

}
