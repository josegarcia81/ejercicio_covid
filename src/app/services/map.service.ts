import { Injectable } from '@angular/core';
// LIBRERIA OL //
import Tile from 'ol/layer/Tile';
import Map from "ol/Map";
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import View from 'ol/View';
// Controles del mapa
import {defaults} from 'ol/control/defaults'
import Zoom from 'ol/control/Zoom'
import GeoJSON from 'ol/format/GeoJSON';
import Draw from 'ol/interaction/Draw'
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  
  // Subject para emitir en caso de cambios en el mapa
  public map!: Map;
  public layers: any[] = [];


  private layerArraySubject: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([{name: 'Cargando...', selected: false}]);
  public layerArray$ = this.layerArraySubject.asObservable();

  private navToShowSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public navToShow$ = this.navToShowSubject.asObservable();

  private polAreaSubject: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public polArea$ = this.polAreaSubject.asObservable();

  private layerVisibilitySubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public layerVisibility$ = this.layerVisibilitySubject.asObservable();


  constructor() { }

  /**
   * Description Devuelve el mapa creado.
   *
   * @returns {Map} 
   */
  getMap(){

    // const mapControls = [/*attributionControl, scaleLineControl, overViewMapControl,*/ zoomControl]

    this.map = new Map({
        view: new View({
          center: fromLonLat([-99.92,35.56]),
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
        target: 'map'
        // controls: defaults({attribution: false}).extend(mapControls)
      });

      // Se devuelve el mapa //
      return this.map;
    }

    /**
     * Description Setea los nombres de las capas disponibles.
     *
     * @param {any[]} layers 
     */
    setLayerArray(layers: any[]){
      this.layerArraySubject.next(layers);
    }
    
    /**
     * Description Setea la navegación a mostrar.
     * @param nav - The name of the navigation item to show
     */
    setNavToShow(nav:string){
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
     * @param {number} i 
     */
    toggleLayerVisibility(layer: any) {
      this.layerVisibilitySubject.next(layer);
    }
  
}
