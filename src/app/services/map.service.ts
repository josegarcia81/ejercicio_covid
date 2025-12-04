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

@Injectable({
  providedIn: 'root'
})
export class MapService {
  // Subject para emitir en caso de cambios en el mapa
  public map!: Map;

  constructor() { }

  getMap(){

    // const mapControls = [/*attributionControl, scaleLineControl, overViewMapControl,*/ zoomControl]

    this.map = new Map({
        view: new View({
          center: fromLonLat([-99.92,35.56]),
          // center: olProj.toLonLat([-10834205.143065585,4533066.249497813],'EPSG:3857'),
          zoom: 4,
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


}
