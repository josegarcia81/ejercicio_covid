// COMUN //
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

// VARIABLES COMUNES //
import { styleArray } from '../../shared/styles';

// MODELOS //
import { CovidData } from '../../models/CovidData.model';
import { StateInfo } from '../../models/StateInfo.model';

// SERVICIOS //
import { CovidDataService } from '../../services/covid-data.service';
import { MapService } from '../../services/map.service';

// LIBRERIA OL //
import Map from "ol/Map";
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import { Geometry, GeometryCollection, LinearRing, LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon } from 'ol/geom';
import DragAndDrop from 'ol/interaction/DragAndDrop'
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify'

// LIBRERIA TURF //
import { booleanIntersects } from '@turf/turf';

// LIBRERIA JSTS
import 'jsts/org/locationtech/jts/monkey.js'; // Soluciona el problema de ".union" function doesn`t exist
import OL3Parser from 'jsts/org/locationtech/jts/io/OL3Parser'
import GeometryFactory from 'jsts/org/locationtech/jts/geom/GeometryFactory';
import Polygonizer from 'jsts/org/locationtech/jts/operation/polygonize/Polygonizer';
import UnaryUnionOp from 'jsts/org/locationtech/jts/operation/union/UnaryUnionOp';
// import UnionOp from 'jsts/org/locationtech/jts/operation/union/UnionOp.js';
import OverlayOp from 'jsts/org/locationtech/jts/operation/overlay/OverlayOp';

// LIBRERIA OL-EXT //
import Toggle from 'ol-ext/control/Toggle';
import Bar from 'ol-ext/control/Bar';
import Transform from 'ol-ext/interaction/Transform';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, AfterViewInit {
  // para capturar e introducir texto en el letrero
  @ViewChild('letreroTexto') letreroTexto!: ElementRef<HTMLDivElement>;
  // Datos de la API
  private countriesData: CovidData[] = [];
  public statesInfo: StateInfo[] = [];

  // p-listbox
  public cities: Array<string> = [];
  public selectedCity: any;

  // p-autocomplete
  public selectedCountry: any;
  public suggestions: any

  // Mapa y features
  public map!: Map;
  public selectedState: string = '';
  public usSource!: VectorSource;
  public estadoAnterior!: Feature;

  // Will be set in ngAfterViewInit when the ViewChild is available
  public etiqueta!: HTMLElement;
  public letreroTextoOverlay!: Overlay;
  public ctrlDisabled: boolean = false;
  private selected: boolean = false; // Usado de toggle al seleccionar un feature seleccionado.

  //// Controles ////
  public controlBar!: InstanceType<typeof Bar>;
  public subControlBar!: InstanceType<typeof Bar>;
  public subControlBarNavBar!: InstanceType<typeof Bar>

  // Pintar
  private drawnVectorSource!: VectorSource;
  public drawVectorLayer!: VectorLayer; // La capa donde se van a mostrar
  public polygonAnterior!: Polygon;
  private featureAnterior!: Feature;
  private isDrawing: boolean = false;
  public draw!: Draw; // Interaccion que permite pintar
  private drawnFeatureAtPixel!: any[]
  private polIndex: number = 0;
  private drawInteraction!: Draw;
  private featureUno!: Feature<Geometry>;
  private featureDos!: Feature<Geometry>;

  // Eliminar Poligono
  private estadosTocadosArray: Array<Feature> = []
  private borradoPoligono: boolean = false;

  // Modificar
  private modifyInteraction!: Modify;
  public modify!: Modify;
  private modificado: boolean = false;
  // Transform
  private transformInteraction!: typeof Transform;
  private featureSeleccionada!: Feature<Geometry>;
  private transformado: boolean = false;
  // Cortar con linea
  private lineVectorSource!: VectorSource;
  public lineVectorLayer!: VectorLayer;
  private cutInteraction!: Draw;
  // Cortar con Poligono
  private cutWithPolygon!: Draw;
  // Aniadir archivo a source
  private fileVectorSource!: VectorSource;
  private fileVectorLayer!: VectorLayer;
  private dragAndDropInteraction!: DragAndDrop;
  public fileUpload: boolean = false;

  // Array nombres capas
  public layerNames: Array<{ name: string; selected: boolean }> = [];

  constructor(
    private _covidData: CovidDataService, // Datos de la API
    private _mapService: MapService, // Mapa
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    //console.log(styleArray[0].green);
    // Obtener el mapa del servicio
    this.map = this._mapService.getMap();

    // Obtener datos de la API   
    this._covidData.getCovidData().subscribe(countries => {
      this.countriesData = countries; // CovidData[] ya mapeado en el servicio
      //console.log(this.countriesData);
      //console.log(countries[0].getPositive() + " " + countries[1].getState());
    })

    this._covidData.getStatesInfo().subscribe(statesInfo => {
      this.statesInfo = statesInfo; // CovidData[] ya mapeado en el servicio
      //console.log(this.statesInfo)
      this.statesInfo.forEach(state => {
        this.cities.push(state.name)

      })
    });

    this._mapService.layerVisibility$.subscribe(layer => {
      this.layerNames.forEach((layerName, i) => {
        if (layerName.name === layer.name) {
          let layer = this.map.getLayers().getArray().find(lay => lay.get('name') === layerName.name);
          layer?.setVisible(layerName.selected);
        }
      });
    });
    // console.log('States Info =>',this.statesInfo)
    // console.log('Cities Info =>',this.cities)


  }

  /** Description placeholder */
  ngAfterViewInit() {



    let clicked: boolean = false;

    // Note: overlay and pointer handlers are set in ngAfterViewInit where
    // the overlay element (ViewChild) is available.
    // Pointer move handler is attached in ngAfterViewInit after overlay
    // element is available.
    // Now that the view is initialized, we can access the overlay element
    this.etiqueta = this.letreroTexto.nativeElement;

    // Ensure the map is attached to the DOM target now that the view is ready
    // (MapService may have created the map earlier without a DOM target).
    // id='map'
    this.map.setTarget('map');

    // Create and add overlay using the DOM element
    const letreroTextoOverlay = new Overlay({
      element: this.etiqueta,
      positioning: 'top-center',
      stopEvent: false
    });
    this.map.addOverlay(letreroTextoOverlay); // Aniadir overlay al mapa

    this.letreroTextoOverlay = letreroTextoOverlay; // Guardar referencia al overlay

    // Hacer que el letrero del nombre del punto siga al puntero mientras 
    // que este este dentro de el punto del feature
    this.map.on('pointermove', (e) => {
      let isFeatureAtPixel = this.map.hasFeatureAtPixel(e.pixel);
      // Si el puntero esta encima de un feature (true)
      let featureAtPixel = this.map.getFeaturesAtPixel(e.pixel);
      if (isFeatureAtPixel && !!featureAtPixel[0].get('ste_name')) {
        let featureName = featureAtPixel[0].get('ste_name');
        this.letreroTextoOverlay.setPosition(e.coordinate);
        // Setear el nombre del feature en el overlay
        this.etiqueta.innerHTML = featureName?.[0];
        //this.cd.detectChanges();
        // Cambia el tipo de puntero a MANO //
        this.map.getViewport().style.cursor = 'pointer';
      } else {
        this.letreroTextoOverlay.setPosition(undefined)
        this.map.getViewport().style.cursor = '';
      }
    })


    // Features de los estados
    this.usSource = new VectorSource({
      url: "../../assets/data/us-states.geojson",
      format: new GeoJSON()
    })
    // Capa con los estados Hacer asi mejor 
    const usStates = new VectorLayer({
      source: this.usSource,
      style: styleArray[0].polygon,
      visible: true,
      zIndex: 1
    })
    // Dar nopmbre al layer
    usStates.set('name', 'US-States-Layer');
    // Aniadir nombre al array de nombres de capas
    this.layerNames.push({
      name: usStates.get('name'),
      selected: true
    });
    // Aniado la Layer que contiene ya los features cargados del Source Al Mapa
    this.map.addLayer(usStates)
    // Setear layer a visible
    usStates.setVisible(true)



    // Cuando se carguen los estilos //
    // Cambiar estilo de los estados segun datos de positivos //
    this.usSource.on('featuresloadend', () => { // Si se usa function(){} no va a funcionar porque no deja acceder a constantes de fuera
      //console.log(usSource.getFeatures());
      //console.log(this.map.getAllLayers())
      this.usSource.getFeatures().forEach((feature, index) => {
        // Setear propiedad del Feature 'selected' a false por defecto
        feature.set('selected', false);
        // console.log(feature);
        const state_code = feature.get("ste_stusps_code")
        const matchedState = this.countriesData.find(country => country.getState() === state_code);
        const positives = matchedState?.getPositive();

        if (feature instanceof Feature && matchedState) { // 19/11/2025 - Con matchedState parece que ya carga bien los colores del mapa y no los carga en rojo
          //console.log(index, feature.getStyle());
          //console.log(feature)
          if (positives! >= 0 && positives! <= 200000) {
            feature.setStyle(styleArray[0].green);
            feature.set('__originalStyle', feature.getStyle());
            // console.log('green' + positives);
          } else if (positives! > 200000 && positives! <= 400000) {
            // feature.getStyle();
            feature.setStyle(styleArray[0].yellow);
            feature.set('__originalStyle', feature.getStyle());
            // console.log('yelow' + positives);
          } else {
            //feature.getStyle();
            feature.setStyle(styleArray[0].red);
            feature.set('__originalStyle', feature.getStyle());
            // console.log('red' + positives);
          }
        } else { return } // 19/11/2025 - Aniadido a la vez que matchedState

      })
    });


    // Cambiar estilo al hacer click en un estado //

    this.map.on('click', (e) => {
      // this.subControlBarNavBar.setVisible(false); // Al clicar en el mapa se oculta el subcontrol de la navbar
      if (!this.isDrawing) {
        // console.log('Features en drawnVectorSource',this.drawnVectorSource.getFeatures());
        // console.log('Click habilitado:',!this.isDrawing)
        // console.log('Interactions added:',this.map.getInteractions().forEach((item)=>item.getN === 'Draw')

        // Todas las features en el pixel clickado
        const features: any[] = this.map.getFeaturesAtPixel(e.pixel) || [];
        // Features dibujados en el pixel clickado aplicado filtro de capa(VectorLayer)
        this.drawnFeatureAtPixel = this.map.getFeaturesAtPixel(e.pixel, { layerFilter: (layer) => { return layer === this.drawVectorLayer; } }) || [];


        console.log('Nombre del Feature Seleccionado pixel:', this.drawnFeatureAtPixel[0]?.get('name'));// Con interrogacion la indicamos que puede haber o no para que no falle.
        console.log('Filtro por capa drawnFeatureAtPixel:', this.drawnFeatureAtPixel);
        console.log('AllFeatures at pixel', features);
        console.log('Features en drawnVectorSource:', this.drawnVectorSource.getFeatures());

        // Si hay features dibujados en el pixel clickado
        if (this.drawnFeatureAtPixel.length > 0) {
          this.subControlBar.setVisible(true); // Si se clica un Feature dibujado se habilita boton borrado/compare
          delPoligon.setActive(false); // Desactivar boton borrar poligono Para que funcione bien el borrado

          this.selected = this.drawnFeatureAtPixel[0].get('selected') ? false : true;
          console.log('Valor de selected del poldibujado', this.selected) // marcar como seleccionado ? false : true;
          this.drawnFeatureAtPixel[0].set('selected', this.selected);// Marcar como seleccionado el feature Clicado
          console.log('Valor de selected del poldibujado 2', this.drawnFeatureAtPixel[0].get('selected'))
          // Feature clicada en capa drwawnFeatureAtPixel parseada a Polygon
          const polygonClicado = this.drawnFeatureAtPixel[0].getGeometry() as Polygon;
          // console.log('Pligonos Pintados Anterior y Clicado:',this.polygonAnterior, polygonClicado);
          // Guardar el poligon en poligonoAnterior si no existia porque es el primero
          // Este primer viaje funciona ok
          if (!this.polygonAnterior) { // Si no existe poligono anterior entra
            console.log('IF NO HAY POLIGONO ANTERIOR');
            this.featureAnterior = this.drawnFeatureAtPixel[0];// Guarda el Feature clicado actual como anterior
            this.polygonAnterior = polygonClicado; // Guarda el Poligono clicado actual como anterior
            const featureClicada = this.drawnFeatureAtPixel[0] as Feature; // Guardar el feature clicado
            //featureClicada.set('__originalStyle', styleArray[0].polygon);// Setear original Style aqui cogido del array de estilos
            let centerCoords = polygonClicado.getInteriorPoint().getCoordinates();// Recoger coordenadas del centro del poligono
            this.map.getView().animate({ center: centerCoords }, { zoom: 5 }, { duration: 600 });// Coger la view del map y viajar a sus coordenadas
            this.estadosTocados(polygonClicado);// Llamar funcion para pintar estados

          } else if (this.featureAnterior.get('name') !== this.drawnFeatureAtPixel[0].get('name')) {// Si no son iguales
            console.log('IF NO SON POLIGONOS IGUALES')

            if (!this.borradoPoligono) {
              // Resetear los anteriores
              this.estadosTocados(this.polygonAnterior)
              this.borradoPoligono = false;
            }//else if(this.polygonAnterior.get('ol_uid') !== polygonClicado.get('ol_uid')){
            //   this.estadosTocados(this.polygonAnterior)
            // }

            // setear nuevo poligono Anterior
            this.polygonAnterior = polygonClicado;
            this.featureAnterior.setStyle(this.featureAnterior.get('__originalStyle'));// Resetear estilo del feature anterior
            this.featureAnterior.set('selected', false)
            this.featureAnterior = this.drawnFeatureAtPixel[0];// Guarda el Feature clicado actual como anterior

            // const featureClicada = this.drawnFeatureAtPixel[0] as Feature;

            // Setear original Style aqui Lo seteo cuando la creo
            //featureClicada.set('__originalStyle', this.drawnFeatureAtPixel[0].getStyle());

            let centerCoords = polygonClicado.getInteriorPoint().getCoordinates();

            this.map.getView().animate({ center: centerCoords }, { zoom: 5 }, { duration: 600 });

            this.estadosTocados(polygonClicado);

          } else {
            // setear nuevo poligono Anterior
            this.polygonAnterior = polygonClicado;
            // this.featureAnterior.set('selected', false)// Esto creo que no hace nada

            const featureClicada = this.drawnFeatureAtPixel[0] as Feature;
            // Seteo al crearla
            // Setear original Style aqui // creo que no esta bien definido el set
            // featureClicada.set('__originalStyle', this.drawnFeatureAtPixel[0].getStyle());

            let centerCoords = polygonClicado.getInteriorPoint().getCoordinates();

            this.map.getView().animate({ center: centerCoords }, { zoom: 5 }, { duration: 600 });

            this.estadosTocados(polygonClicado);
          }

        } else { this.subControlBar.setVisible(false) }// Si se clica fuera de un Feature dibujado se deshabilita boton borrado/compare

        // console.log('Desde map - state code: ',features[0].get("ste_stusps_code"));
        // Si hay features en el pixel clickado
        if (features[0].get('selected') === true && this.drawnFeatureAtPixel.length === 0) {
          this._covidData.setSelectedState(features[0].get("ste_stusps_code"), false);

        } else {
          this._covidData.setSelectedState(features[0].get("ste_stusps_code"), true);
        }
        // console.log('geometry' +features[0].get('geometry'));
        // console.log(features[0].get('ste_area_code'));
        // console.log(features[0].get('ste_code'));
        // console.log('origStyle:' + features[0].get('__originalStyle'));

        const feature = features[0] as Feature;
        let original = feature.get('__originalStyle');
        // Seleccion de estado y cambio de color 
        // Se comprueba si el feature ya esta seleccionado
        // Se almacena el estilo original en una propiedad del feature

        // console.log('Entrado en if de comprobacion de estilo color rosa',feature.getStyle() === styleArray[0].rosa)
        if (feature.getStyle() === styleArray[0].rosa) {
          console.log('Entrado en if de comprobacion de estilo color rosa')
          feature.setStyle(original);
          feature.set('selected', false);
        } else {
          feature.setStyle(styleArray[0].rosa); // aplicar estilo de seleccionado
          feature.set('selected', true); // marcar como seleccionado
        }
        // NO LO USO, USO LOS ESTADOS EN EL SELECT DE CADA FEATURE PARA EL CONTROL DE SI ESTAN SELECCIONADOS
        //////////////////////////////////////////////////////
        // Cambiado el valor de selected
        // Buscar en indice en el array
        const index = this.statesInfo.findIndex(state => state.state === feature.get('ste_stusps_code'));
        // console.log(this.statesInfo, index, feature);
        // Cambiar estado del selected para que aparezca o no el checkbox
        if (index !== -1) {
          this.statesInfo[index].selected = this.statesInfo[index].selected ? false : true;
        }
        /////////////////////////////////////////////////////
      }

    });



    // Subscribe que hace que se resetee el estilo de un estado
    this._covidData.resetStyle$.subscribe(({ value: activated, codigo: state_code, selected: select }) => {
      // console.log('Activado el reseteo de estilo a un solo estado')
      // console.log('Click desde el checkbox-MAP',activated);
      // console.log('Click desde el checkbox-MAP',state_code);
      // console.log('Click desde el checkbox-MAP',select);
      if (activated) {
        const match = this.usSource.getFeatures().find(feature => feature.get('ste_stusps_code') === state_code)
        console.log('Match de Reset-Style metodo-Map', match)
        if (match && select) {
          match.setStyle(styleArray[0].rosa)
          console.log('entra en uno')
          console.log(match.getStyle())
          match.set('selected', true);
        } else {
          console.log('entra en dos')
          const original = match?.get('__originalStyle');
          match?.setStyle(original);
          match?.set('selected', false);
        }
        console.log(match?.get('selected'));
        console.log('ResetStyle', this.statesInfo);
        // this.usSource.getFeatures().forEach((feature,index) => {
        //   const original = feature.get('__originalStyle');
        //   feature.setStyle(original);
        //   feature.set('selected', false);
        // })
        this.usSource.forEachFeature(feature => console.log('Holi', feature.get('selected')))
      }
    })


    ///////// BOTONES///////////

    // Capa para los dibujos //
    // VectorSource va a almacenar los Features en formato GeoJSON
    this.drawnVectorSource = new VectorSource<Feature<Geometry>>({
      format: new GeoJSON
    });
    // Esta capa tipo VectorLayer su Source va a mostrar los Features dibujados
    this.drawVectorLayer = new VectorLayer({
      source: this.drawnVectorSource,
      visible: true,
      zIndex: 2,
      style: styleArray[0].polygon
    })
    // Dar nombre a la capa
    this.drawVectorLayer.set('name', 'Drawn-Features-Layer');
    // Aniadir nombre al array de nombres de capas
    this.layerNames.push({
      name: this.drawVectorLayer.get('name'),
      selected: true
    });
    // Aniadimos la VectorLayer al mapa
    this.map.addLayer(this.drawVectorLayer)

    // Capa para la linea de corte //
    // VectorSource que va a almacenar los Features de tipo LineString
    this.lineVectorSource = new VectorSource<Feature<LineString>>({
      format: new GeoJSON
    });
    // Esta capa tipo VectorLayer su VectorSource va a mostrar las Lineas dibujadas
    this.lineVectorLayer = new VectorLayer({
      source: this.lineVectorSource!,
      visible: true,
      zIndex: 4,
      style: styleArray[0].lineBlue
    })
    // Aniadimos la VectorLayer al mapa
    this.map.addLayer(this.lineVectorLayer);

    ///////// Barra de control del Mapa ///////////
    this.controlBar = new Bar({
      className: 'mapControls',
      group: true,
      toggleOne: true

    })

    this.drawInteraction = new Draw({
      type: 'Polygon',
      source: this.drawVectorLayer.getSource()!,
      style: styleArray[0].polygon
      // geometryName: 'pol_'+this.drawnVectorSource.getFeatures().length
    })
    // Botton Pintar Poligono
    // const drawInteraction = arrayInteractions[0].draw
    const drawPolygon = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil-line-icon lucide-pencil-line"><path d="M13 21h8"/><path d="m15 5 4 4"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>',
      className: 'ctrl-button',
      title: 'Draw',
      // interaction: this.drawInteraction,
      active: false,
      onToggle: (active: boolean) => {
        this.isDrawing = active
        this.subControlBar.setVisible(false)
        // this.polIndex++;
        // console.log('Toggle:',this.isDrawing)
        if (active) {
          this.map.addInteraction(this.drawInteraction);
          console.log('Activando interaction');
        } else {
          this.map.removeInteraction(this.drawInteraction);
          console.log('Desactivando interaction', this.map.getInteractions());

        }
      }
    })
    this.drawInteraction.on('drawend', (e: any) => {
      e.feature.set('name', 'pol_' + this.polIndex);
      e.feature.set('id', this.polIndex);
      this.polIndex++;
      e.feature.set('__originalStyle', styleArray[0].polygon);
      // console.log('Dibujado Draw:', e.feature.getGeometry().getCoordinates());

      let coords = e.feature.getGeometry().getCoordinates();
      let coordsX: number[] = [];
      let coordsY: number[] = [];
      coords[0].forEach((coordSet: any) => {
        // console.log('Coordenadas X del poligono dibujado:',coordSet[0]);
        coordsX.push(coordSet[0]);
        // console.log('Coordenadas Y del poligono dibujado:',coordSet[1]);
        coordsY.push(coordSet[1]);
      });
      let area = this.calculatePolygonArea(coordsX, coordsY);
      this._mapService.setPolygonArea(area);
      console.log('Area del poligono dibujado:', area, 'm²');
    })
    // Aniadir toggle a barra principal.
    this.controlBar.addControl(drawPolygon)

    // Interaccion Modify
    this.modifyInteraction = new Modify({
      source: this.drawVectorLayer.getSource()!,
      style: styleArray[0].polygon
    });
    // Botton Modificar Poligono
    // const drawInteraction = arrayInteractions[0].draw
    const modifyPolygon = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minimize2-icon lucide-minimize-2"><path d="m14 10 7-7"/><path d="M20 10h-6V4"/><path d="m3 21 7-7"/><path d="M4 14h6v6"/></svg>',
      className: 'ctrl-button',
      title: 'Modify',
      interaction: this.modifyInteraction,
      active: false,
      onToggle: (active: boolean) => {
        // Deshabilitar la funcion click
        this.isDrawing = active;
        this.subControlBar.setVisible(false);
        this.modificado = true;
        //this._covidData.setOriginalStyles(true)
      }
    })
    // Verificacion para pintar poligonos.
    this.modifyInteraction.on('modifyend', (e: any) => {
      // this.modificado = true;
      let feature = e.features.item(0);
      console.log('Modificada Modify:', e, feature);
      if (feature.get('selected')) {
        this.estadosTocados(feature.getGeometry() as Polygon);
      }
      // this.estadosTocados(feature.getGeometry() as Polygon);
    })
    // Aniadir toggle a barra principal.
    this.controlBar.addControl(modifyPolygon);

    // Interaccion Transform
    this.transformInteraction = new Transform({
      enableRotation: true,
      enableScaling: true,
      keepAspectRatio: (event: any) => event.originalEvent.shiftKey, // Mantener proporción con Shift
      features: this.drawnFeatureAtPixel,
      filter: (feature: Feature, layer: VectorLayer) => {
        this.featureSeleccionada = feature;
        return layer === this.drawVectorLayer
      }
    })
    // Botton Transformar Poligono
    const transformPolygon = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-expand-icon lucide-expand"><path d="m15 15 6 6"/><path d="m15 9 6-6"/><path d="M21 16v5h-5"/><path d="M21 8V3h-5"/><path d="M3 16v5h5"/><path d="m3 21 6-6"/><path d="M3 8V3h5"/><path d="M9 9 3 3"/></svg>',
      className: 'ctrl-button',
      title: 'Transform',
      interaction: this.transformInteraction,
      active: false,
      onToggle: (active: any) => {
        this.subControlBar.setVisible(false);
        this.isDrawing = active
        if (active && this.featureSeleccionada) {
          this.transformInteraction.select(this.featureSeleccionada);
          console.log('Feature seleccionada:', this.featureSeleccionada);

        }
        // if(this.featureSeleccionada.get('selected')){
        // this.estadosTocados(this.featureSeleccionada.getGeometry() as Polygon);
        // }
        // this.estadosTocados(this.featureSeleccionada.getGeometry() as Polygon);
        // this.subControlBar.setVisible(true);
      }
    });
    // Usar para volver a reseleccionar estados
    // Escuchar eventos de transformación
    this.transformInteraction.on(['rotateend', 'scaleend', 'translateend'], (e: any) => {

      let feature = e.features.item(0);
      console.log('Modificada Transformacion:', e, feature);
      if (this.featureSeleccionada.get('selected')) {
        this.estadosTocados(this.featureSeleccionada.getGeometry() as Polygon);
      }
      // this.estadosTocados(feature.getGeometry() as Polygon);

    });
    // this.transform.on(['rotatestart', 'rotating', 'rotateend'], (e:any) => {
    //   console.log('Rotación:', e);
    // });
    // this.transform.on(['scalestart', 'scaling', 'scaleend'], (e:any) => {
    //   console.log('Escalado:', e);
    // });
    // this.transform.on(['translatestart', 'translating', 'translateend'], (e:any) => {
    //   console.log('Traslación:', e);
    // });
    this.controlBar.addControl(transformPolygon)

    // Interaccion dibujar Linea
    this.cutInteraction = new Draw({
      type: 'LineString',
      source: this.lineVectorSource,
      style: styleArray[0].lineBlue
    })
    // Boton Cortar poligonos con linea
    const cutPolygon = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-scissors-icon lucide-scissors"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>',
      className: 'ctrl-button',
      title: 'Cut Polygon',
      interaction: this.cutInteraction,
      active: false,
      onToggle: (active: any) => {
        this.subControlBar.setVisible(false);
        this.isDrawing = active;
        if (!active) {
          console.log('Entrando En Toggle');
          // console.log('Features en drawnVectorSource:', this.drawnVectorSource.getFeatures().length);
          if (this.drawnVectorSource.getFeatures().length > 0) {
            console.log('Entrando En Toggle Si hay features');
            const features = this.lineVectorSource.getFeatures();
            const lineaCorte = features.find(feature => feature.get('name') === 'lineaDeCorte');
            console.log(lineaCorte);
            //console.log(this.lineVectorSource.getFeatures());
            // const poligono = this.drawnVectorSource.getFeatures()[this.drawnVectorSource.getFeatures().length];
            if (!!lineaCorte) {
              const extent = lineaCorte.getGeometry()!.getExtent();
              this.drawnVectorSource.forEachFeatureIntersectingExtent(extent, (feature) => {
                console.log('Poligono intersecta', feature.get('name'));
                // this.cortarPoligonosConLinea(lineaCorte,feature)
                this.cortarPoligonosConLinea(lineaCorte, feature);
                // return feature;
              }) || null;

            }
            // if(lineaCorte){;}
          }
        }
        this.lineVectorSource.clear();
      }

    });
    this.cutInteraction.on('drawend', (e: any) => {
      console.log('Linea para cortar poligonos dibujada:', e.feature);
      const lineaDeCorte = e.feature as Feature<LineString>;
      // lineaDeCorte.setStyle(styleArray[0].line);
      lineaDeCorte.set('name', 'lineaDeCorte');
      // console.log('Linea de corte:', lineaDeCorte);
      //console.log('Features en drawnVectorSource:', this.drawnVectorSource.getFeatures());
      // Llamar funcion cortar poligonos
      // this.cortarPoligonos(e.feature);
      // this.isDrawing = false;
    })
    // Aniadir a la barra pricipal
    this.controlBar.addControl(cutPolygon);

    // Interaccion dibujar poligono
    this.cutWithPolygon = new Draw({
      type: 'Polygon',
      source: this.drawnVectorSource,
      style: styleArray[0].polygon
    })

    // Boton cortar poligonos entre ellos
    const cutPolygonsBetween = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-squares-subtract-icon lucide-squares-subtract"><path d="M10 22a2 2 0 0 1-2-2"/><path d="M16 22h-2"/><path d="M16 4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-5a2 2 0 0 1 2-2h5a1 1 0 0 0 1-1z"/><path d="M20 8a2 2 0 0 1 2 2"/><path d="M22 14v2"/><path d="M22 20a2 2 0 0 1-2 2"/></svg>',
      className: 'ctrl-button',
      title: 'Substract Polygons',
      active: false,
      onToggle: (active: any) => {
        this.subControlBar.setVisible(false);
        this.isDrawing = active;
        if (active) {
          this.subControlBar.setVisible(false);
          this.isDrawing = active;
          this.map.addInteraction(this.drawInteraction);
          console.log('Activando interaction pintar');
        } else {
          this.map.removeInteraction(this.drawInteraction);
          console.log('Desactivando interaction', this.map.getInteractions());

          let index = this.drawnVectorSource.getFeatures().length - 1;
          console.log('Index of drwanFeature:', index)
          const lastFeature = this.drawnVectorSource.getFeatures()[index]; // Probar con byId

          const extent = lastFeature.getGeometry()!.getExtent();

          this.drawnVectorSource.forEachFeatureIntersectingExtent(extent, (feature) => {
            console.log('Poligono intersecta', feature.get('name'));
            console.log('FeatureTocada corte por poligonos:', feature);
            if (feature?.get('name') !== lastFeature.get('name')) {
              this.cortarPoligonoConPoligono(feature, lastFeature, 'substract');
            }
            // return feature;
          }) || null;

        }


      }
    });
    // Aniadir a la barra pricipal
    this.controlBar.addControl(cutPolygonsBetween);

    // Boton unir poligonos entre ellos
    const unitePolygonsBetween = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-squares-unite-icon lucide-squares-unite"><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3a1 1 0 0 0 1 1h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-3a1 1 0 0 0-1-1z"/></svg>',
      className: 'ctrl-button',
      title: 'Unite Polygons',
      active: false,
      onToggle: (active: any) => {
        this.subControlBar.setVisible(false);
        this.isDrawing = active;
        if (active) {
          // this.subControlBar.setVisible(false);
          // this.isDrawing = active;
          this.map.addInteraction(this.drawInteraction);
          console.log('Activando interaction pintar');
        } else {
          this.map.removeInteraction(this.drawInteraction);
          console.log('Desactivando interaction pintar', this.map.getInteractions());

          let index = this.drawnVectorSource.getFeatures().length - 1;
          console.log('Index of drwanFeature:', index)
          const lastFeature = this.drawnVectorSource.getFeatures()[index]; // Probar con byId

          const extent = lastFeature.getGeometry()!.getExtent();

          const featureTocada = this.drawnVectorSource.forEachFeatureIntersectingExtent(extent, (feature) => {
            console.log('Poligono intersecta', feature.get('name'));
            return feature;
          }) || null;
          console.log('FeatureTocada corte por poligonos:', featureTocada);
          this.unirPoligonoConPoligono(featureTocada, lastFeature);
        }
      }
    });
    // Aniadir a la barra pricipal
    this.controlBar.addControl(unitePolygonsBetween);

    // Boton extraer parte de poligonos entre ellos el segundo sustrae del primero
    const excludePolygonsBetween = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-squares-exclude-icon lucide-squares-exclude"><path d="M16 12v2a2 2 0 0 1-2 2H9a1 1 0 0 0-1 1v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h0"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3a1 1 0 0 1-1 1h-5a2 2 0 0 0-2 2v2"/></svg>',
      className: 'ctrl-button',
      title: 'Substract part of Polygon',
      active: false,
      onToggle: (active: any) => {
        this.subControlBar.setVisible(false);
        this.isDrawing = active;
        if (active) {
          // this.subControlBar.setVisible(false);
          // this.isDrawing = active;
          this.map.addInteraction(this.drawInteraction);
          console.log('Activando interaction pintar');
        } else {
          this.map.removeInteraction(this.drawInteraction);
          console.log('Desactivando interaction', this.map.getInteractions());

          let index = this.drawnVectorSource.getFeatures().length - 1;
          console.log('Index of drwanFeature:', index)
          const lastFeature = this.drawnVectorSource.getFeatures()[index]; // Probar con byId

          const extent = lastFeature.getGeometry()!.getExtent();

          const featureTocada = this.drawnVectorSource.forEachFeatureIntersectingExtent(extent, (feature) => {
            console.log('Poligono intersecta', feature.get('name'));
            return feature;
          }) || null;
          console.log('FeatureTocada corte por poligonos:', featureTocada);
          if (featureTocada?.get('name') !== lastFeature.get('name')) {
            this.cortarPoligonoConPoligono(featureTocada, lastFeature, 'exclude');
          } else {
            alert('Es el mismo poligono o no intersecta ningun poligono!!!')
          }
        }
      }
    });
    // Aniadir a la barra pricipal
    this.controlBar.addControl(excludePolygonsBetween);

    // Esta capa va a albergar los features del archivo
    this.fileVectorSource = new VectorSource({
      format: new GeoJSON
    })

    this.fileVectorLayer = new VectorLayer({
      source: this.fileVectorSource,
      visible: true,
      zIndex: 5,
      style: styleArray[0].lineRed
    })
    // Dar nombre a la capa
    this.fileVectorLayer.set('name', 'Lines-File-Layer');
    // Aniadir nombre al array de nombres de capas
    this.layerNames.push({
      name: this.fileVectorLayer.get('name'),
      selected: true
    });
    // Aniadir Layer al mapa 
    this.map.addLayer(this.fileVectorLayer);


    this.dragAndDropInteraction = new DragAndDrop({
      formatConstructors: [GeoJSON],
      source: this.fileVectorSource

    });

    // Boton cargar archivo GeoJSON
    const fileUpload = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-plus-corner-icon lucide-file-plus-corner"><path d="M11.35 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5.35"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M14 19h6"/><path d="M17 16v6"/></svg>',
      className: 'ctrl-button',
      title: 'Upload GEOJson File',
      interaction: this.dragAndDropInteraction,
      active: false,
      onToggle: (active: any) => {
        this.subControlBar.setVisible(false);
        this.isDrawing = active
        if (active) {
          this.fileUpload = true;
          // this.subControlBarNavBar.setVisible(true);
        } else {
          // this.subControlBarNavBar.setVisible(false);
          this.fileUpload = false;
        }
      }
    });

    // Aniadir a la barra pricipal
    this.controlBar.addControl(fileUpload);

    //// BARRA DE SUBMENU DE SELECCION DE POLIGONO ////
    this.subControlBar = new Bar({
      className: 'sub-toolbar',
      toggleOne: true,
      group: true
    })
    this.subControlBar.setVisible(false)

    // BOTON para BORRAR poligono
    const delPoligon = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
      className: 'sub-button',
      title: 'Delete Polygon',
      active: false,
      onToggle: (active: any) => {
        console.log('delPolygon toggle pulsado')
        if (active) {
          //Continuar aqui conpara el nombre del feature.get('name') y borrarlo de drawnVectorSource
          drawPolygon.setActive(false)
          this.borradoPoligono = true;// Usado para resetear estados tocados en el click anterior en map.on('click'
          this.isDrawing = true; // Deshabilitar la funcion click
          //this.disableDraw()

          console.log('drawnFeatureAtPixel: ', this.drawnFeatureAtPixel[0].get('name'));
          // console.log('EstadosTocados - selected - feature[0]', this.estadosTocadosArray[0].get('selected'));
          const featureToDelete = this.drawnFeatureAtPixel.find(feature => feature.get('name') === this.drawnFeatureAtPixel[0].get('name'));
          console.log('Feature to delete:', featureToDelete);
          if (featureToDelete) {
            // Antes de borrar el feature comprobar si hay estados tocados y resetearlos
            const polygon = featureToDelete.getGeometry() as Polygon;
            if (this.estadosTocadosArray.length > 0) {// Comprueba que hay features de estados tocado y si hay los resetea y si no hay no.
              this.estadosTocadosArray.forEach((stateFeature) => {
                const original = stateFeature.get('__originalStyle');
                stateFeature.setStyle(original);
                stateFeature.set('selected', false);

                this.statesInfo.forEach((state) => {
                  // console.log(state.name);
                  // console.log(feature.get('ste_name').toString());
                  if (state.name === stateFeature.get('ste_name').toString()) { // Aqui habia problema de comparacion porque uno era array y otro string
                    // Avisamos del cambio de estado al servicio
                    this._covidData.setSelectedState(state.state, false);
                    console.log('ESTA ENTRANDO AQUI');
                    state.selected = false;
                    // console.log(state.selected);
                  }
                })

              });
              // this.estadosTocados(polygon);
            }

            this.drawnVectorSource.removeFeature(featureToDelete); // Borrado del feature
            console.log('Borrado del Feature');
            this.estadosTocadosArray = []; // reset de array estadosTocados
            console.log('Volver al centro');
            this.map.getView().animate({ center: fromLonLat([-99.92, 35.56]) }, { zoom: 4.5 }, { duration: 600 }); // Volver al centro
          }

        }
        console.log('Quedan Features en drawnSource? =>', this.drawnVectorSource.getFeatures());
        console.log('Quedan Features en estadosTocados? =>', this.estadosTocadosArray);
        this.subControlBar.setVisible(false);
        this.isDrawing = false;
      }

    })
    // Boton ver comparacion de los estados
    const stateCompareToggle = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-column-stacked-icon lucide-chart-column-stacked"><path d="M11 13H7"/><path d="M19 9h-4"/><path d="M3 3v16a2 2 0 0 0 2 2h16"/><rect x="15" y="5" width="4" height="12" rx="1"/><rect x="7" y="8" width="4" height="9" rx="1"/></svg>',
      className: 'sub-button',
      title: 'Compare States',
      active: false,
      onToggle: () => {
        console.log('Compare toggle pulsado')
        if (this.drawnFeatureAtPixel) {
          this._covidData.setCompare(true)
        }
      }
    })

    // Aniadir botones a subBarra
    this.subControlBar.addControl(delPoligon)
    this.subControlBar.addControl(stateCompareToggle)
    //console.log(this.subControlBar.getActiveControls())

    // Aniadir subBarra a Barra principal
    this.controlBar.addControl(this.subControlBar)

    // Aniadir barra de control
    this.map.addControl(this.controlBar)

    //// BARRA DE SUBMENU MANEJO DE NAVEGADOR LATERAL IZQUIERDO ////
    this.subControlBarNavBar = new Bar({
      className: 'sub-toolbar-2',
      toggleOne: true,
      group: true
    })
    this.subControlBarNavBar.setVisible(true);
    this.subControlBarNavBar.setPosition('bottom-left');
    // Boton ver comparacion de los estados
    const viewStatesToggle = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-icon lucide-list"><path d="M3 5h.01"/><path d="M3 12h.01"/><path d="M3 19h.01"/><path d="M8 5h13"/><path d="M8 12h13"/><path d="M8 19h13"/></svg>',
      className: 'sub-button',
      title: 'View US states table',
      active: false,
      onToggle: () => {
        console.log('View States pulsado')
        this._mapService.setNavToShow('default');
        this.fileUpload = false;
      }
    })
    // Aniadir boton a subBarra
    this.subControlBarNavBar.addControl(viewStatesToggle);

    // Aniadir Toggle a Barra principal
    const viewPolAreaToggle = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ruler-dimension-line-icon lucide-ruler-dimension-line"><path d="M10 15v-3"/><path d="M14 15v-3"/><path d="M18 15v-3"/><path d="M2 8V4"/><path d="M22 6H2"/><path d="M22 8V4"/><path d="M6 15v-3"/><rect x="2" y="12" width="20" height="8" rx="2"/></svg>',
      className: 'sub-button',
      title: 'View Polygon Area',
      active: false,
      onToggle: () => {
        console.log('View Polygon Area')
        this._mapService.setNavToShow('areaCalc');
        this.fileUpload = false;
      }
    })
    // Aniadir boton a subBarra
    this.subControlBarNavBar.addControl(viewPolAreaToggle);

    // Aniadir subBarra a Barra principal
    const viewLayersToggle = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers-icon lucide-layers"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg>',
      className: 'sub-button',
      title: 'View Layers Control',
      active: false,
      onToggle: () => {
        console.log('View Layers Control')
        this._mapService.setNavToShow('layers');
        this.fileUpload = false;
      }
    })
    // Aniadir boton a subBarra
    this.subControlBarNavBar.addControl(viewLayersToggle);

    this.map.addControl(this.subControlBarNavBar);

    // Resetear estilos de los estados //
    // Lo llamo para que el subscribe este activo y escuche los cambios
    this.resetStyles()

    console.log(this.layerNames);

    this._mapService.setLayerArray(this.layerNames);

  }


  // Funciona ok.
  /** Description Subscribe que hace que se resetee el estilo de todos los estados */
  resetStyles() {
    // Subscribe que hace que se resetee el estilo de todos los estados
    this._covidData.resetStyles$.subscribe((activated) => {
      console.log('Activado el reseteo de estilos')
      if (activated) {
        // Reset estilos Estados

        // A cada feature en el source de estados le pone su estilo original guardado
        this.usSource.getFeatures().forEach((feature) => {
          feature.setStyle(feature.get('__originalStyle'));
          feature.set('selected', false);
        });
        // A cada estado en this.statesInfo le pone selected a false
        this.statesInfo.forEach(state => state.selected = false);

        // Reset estilos Features dibujados
        this.drawnVectorSource.getFeatures().forEach((feature) => {
          feature.setStyle(feature.get('__originalStyle'))
          feature.set('selected', false);

        });
        this.estadosTocadosArray = [];// Reset del array de estados tocados

        this.isDrawing = false;
      }

    })
    this.subControlBar.setVisible(false);

    // throw new Error('Method not implemented.');
  }

  /**
   * Description Seleccion de Estado y viaje al mismo
   *
   * @param {*} event 
   */
  selecState(event: any) {
    // console.log('LECTURA estado anterior: ',this.estadoAnterior?.get('ste_name'));
    const stateName = event.value;
    const matchedState = this.usSource.getFeatures().find((feature: any) => feature.get('ste_name').toString() === stateName) as Feature;
    // console.log('Estado Seleccionado:',matchedState.get('ste_name'));
    // console.log('Estado inicio:',matchedState);


    if (!this.estadoAnterior) {
      // this.estadoAnterior = matchedState;
      this.estadoAnterior = matchedState;
      console.log('a entrado en 1')
    } else if (this.estadoAnterior!.get('ste_name') !== matchedState.get('ste_name')) {
      this.estadoAnterior = matchedState;
      console.log('a entrado en 2')
      console.log('SET estado anterior: ', this.estadoAnterior.get('ste_name'))
    } else {
      console.log('a entrado en 3')
      const original = this.estadoAnterior.get('__originalStyle');
      // console.log(this.estadoAnterior.getStyle())
      // console.log(original)
      this.estadoAnterior.setStyle(original);
      // this.estadoAnterior!.set('__selected', false);
    }

    const coord = matchedState?.get('geo_point_2d')
    const lon = coord.lon
    const lat = coord.lat

    // console.log(matchedState?.get('geo_point_2d'))
    // console.log(typeof(coord))

    const isSelected: boolean = matchedState.get('__selected');
    console.log('COMPARACION', (!isSelected && matchedState))

    if (!isSelected || matchedState) {
      const original = this.estadoAnterior!.get('__originalStyle');
      this.estadoAnterior!.setStyle(original);
      this.estadoAnterior!.set('__selected', false);

      // viajar al estado
      this.map.getView().animate({ center: fromLonLat([lon, lat]) }, { zoom: 5 })
      //matchedState.set('__originalStyle', matchedState.getStyle());
      matchedState.set('__selected', true);
      matchedState.setStyle(styleArray[0].rosa)
      this._covidData.setSelectedState(matchedState.get('ste_stusps_code'), true)

      //console.log('a entrado')
    }
  }

  /**
   * Description Pintar los estados que han sido tocados por el poligono que se ha dibujado. Se usa Libreria Turf.
   *
   * @param {Polygon} polygon 
   */
  estadosTocados(polygon: Polygon) {
    console.log('Metodo Estados Tocados')
    let i = 0; // Contar estados tocados. 
    const layerExtentA = polygon.getExtent();
    // console.log('Extent: ',layerExtentA)

    //Siempre que entra primero resetea el contenido del array
    this.estadosTocadosArray = []

    // if(this.drawnFeatureAtPixel[0].get('selected') === true){
    //   this.drawnFeatureAtPixel[0].set('selected', false);
    //   this.drawnFeatureAtPixel[0].setStyle(this.drawnFeatureAtPixel[0].get('__originalStyle'));
    // }
    // this.usSource.forEachFeature((feature: Feature)=>{



    // })
    this.usSource.forEachFeature((feature: Feature) => {

      // COMPARACION CON EXTENT //
      // const layerExtentB = feature.getGeometry()?.getExtent()

      // if (polygon.intersectsExtent(layerExtentB!)) {

      //   estadosTocados.push(feature);
      //   // Colorear de rosa los estados coincidentes con el poligono
      //   feature.setStyle(styleArray[0].rosa);

      //   this.statesInfo.forEach((state)=>{
      //     if(state.name === feature.get('ste_name')[0]){
      //       this._covidData.setSelectedState(state.state)
      //       state.selected = true;
      //     }
      //   })
      // }

      // COMPARACION CON LIBRERIA TURF //
      const formatGJ = new GeoJSON();

      // GeoJSON del polígono dibujado (en lon/lat EPSG:4326) — compatible con Turf
      const drawnGeoJSON = formatGJ.writeFeatureObject(this.drawnFeatureAtPixel[0]! as Feature, { // estoy cogiendo el numero 0 tengo que mandar el clickado arriba en on click
        featureProjection: this.map.getView().getProjection(),
        dataProjection: 'EPSG:4326'
      });

      // convertir la feature del estado a GeoJSON en EPSG:4326 para Turf
      const stateGeoJSON = formatGJ.writeFeatureObject(feature, {
        featureProjection: this.map.getView().getProjection(),
        dataProjection: 'EPSG:4326'
      });

      try {
        // Uso booleanIntersects() de Turf para comprobar intersección
        // Se le pasan dos Features en formato GeoJSON para comparar 
        // Metodo que devuelve true o false // Si intersecta es true 
        if (booleanIntersects(drawnGeoJSON as any, stateGeoJSON as any)) {
          // console.log('BOOLEAN INTERSECTION:', feature.get('ste_name'));
          // Va haciendo un foreach y con el match intento ver si el feature ya esta en el array
          i++;
          // const matchedState = this.usSource.getFeatures().find((feature: any) => feature.get('ste_name').toString() === stateName) as Feature
          // console.log(this.estadosTocadosArray);

          //Si hay coincidencia, coge el feature que viene del source usSource y lo inserta al array
          this.estadosTocadosArray.push(feature);
          //console.log('Valores true:false feature clicado, feature intersectado',this.drawnFeatureAtPixel[0].get('selected'),feature.get('selected'));

          if (this.drawnFeatureAtPixel[0].get('selected') === true && feature.get('selected') !== true) {

            feature.setStyle(styleArray[0].rosa); // colorear con color original
            feature.set('selected', true);// Poner propiedad del Feature a true
            this._covidData.setSelectedState(feature.get('ste_stusps_code'), true);
            // Tras cambiar el color cambiamos el select en el array this.statesInfo y en nav-bar
            this.statesInfo.forEach((state) => {
              // console.log(state.name);
              // console.log(feature.get('ste_name').toString());
              if (state.name === feature.get('ste_name').toString()) { // Aqui habia problema de comparacion porque uno era array y otro string
                // Avisamos del cambio de estado al servicio
                // 
                // console.log('ESTA ENTRANDO AQUI');
                state.selected = false;
                // console.log(state.selected);
              }
            })

          } else if (this.drawnFeatureAtPixel[0].get('selected') === false && feature.get('selected') === true) {
            // this.drawnFeatureAtPixel[0].setStyle(this.drawnFeatureAtPixel[0].get('__originalStyle'));
            feature.setStyle(feature.get('__originalStyle')); // reset al original
            feature.set('selected', false);
            this._covidData.setSelectedState(feature.get('ste_stusps_code'), false);
            // Tras meter en el array y cambiar el color cambiamos el select en el array this.statesInfo
            this.statesInfo.forEach((state) => {
              // console.log(state.name);
              // console.log(feature.get('ste_name').toString());
              if (state.name === feature.get('ste_name').toString()) { // Aqui habia problema de comparacion porque uno era array y otro string
                // Avisamos del cambio de estado al servicio
                //this._covidData.setSelectedState(state.state,);
                // console.log('ESTA ENTRANDO AQUI');
                // state.selected = false;
                // Revisar esto   //console.log(state.selected);
                //////////////////// this.drawnFeatureAtPixel[0].set('selected', false);
              }
            })
            this.subControlBar.setVisible(false);
          }

        } else { // SEGUIR AQUI, sI NO INTERSECTA PONER LOS ESTADOS EN COLOR ORIGINAL Y DESSELECCIONAR DEL NAV-BAR = FALSE

          feature.setStyle(feature.get('__originalStyle')); // reset al original
          feature.set('selected', false);
          this._covidData.setSelectedState(feature.get('ste_stusps_code'), false);
          // Tras no intersectar cambiamos el select en el array this.statesInfo
          this.statesInfo.forEach((state) => {
            // console.log(state.name);
            // console.log(feature.get('ste_name').toString());
            if (state.name === feature.get('ste_name').toString()) { // Aqui habia problema de comparacion porque uno era array y otro string
              // Avisamos del cambio de estado al servicio
              //this._covidData.setSelectedState(state.state)
              // console.log('ESTA ENTRANDO AQUI METODO NO INTERSECT')
              state.selected = false;
              // console.log(state.selected);
            }
          })
        }

      } catch (err) {
        console.warn('Intersection test failed', err);
      }



    })
    // console.log('Estados Tocados:', this.estadosTocadosArray)
    this.modificado = false;
    this.transformado = false;
    // console.log('Cantidad de veces true intersects',i)
    // this.subControlBar.setVisible(false);
  }

  // cortarPoligonos(line:Feature){
  //   console.log('Metodo cortarPoligonos: Recibe linea de corte', line);
  //   console.log('Features en drawnVectorSource:', this.drawnVectorSource.getFeatures()[0]);

  //   // Formato GeoJSON para OL
  //   const formatGJ = new GeoJSON();

  //   // const cuttingLine = line.getGeometry() as LineString;

  //   // GeoJSON de la linea dibujada (en lon/lat EPSG:4326) — compatible con Turf
  //   const lineGeoJSON = formatGJ.writeFeatureObject(line,{
  //     featureProjection: this.map.getView().getProjection(),
  //     dataProjection: 'EPSG:4326'
  //   });
  //   // lineGeoJSON = truncate(lineGeoJSON,{precision:2});
  //   // Recorrer los poligonos dibujados para comprobar interseccion y cortar
  //   this.drawnVectorSource.getFeatures()!.forEach((feature:Feature)=>{
  //     // convertir la feature del polígono a GeoJSON en EPSG:4326 para Turf
  //     const polygonGeoJSON = formatGJ.writeFeatureObject(feature, {
  //       featureProjection: this.map.getView().getProjection(),
  //       dataProjection: 'EPSG:4326'
  //     });

  //     try {
  //       if (booleanIntersects(lineGeoJSON as any, polygonGeoJSON as any)) {
  //         console.log('Cortar polígono:', feature.get('name'));

  //         // const featureToPolygon = polygonize(lineGeoJSON as any);
  //         // console.log('Feature to Poligon',featureToPolygon);

  //         // Convertir El poligono a LineString para poder cortarlo
  //         const polygonToLines = polygonToLine(polygonGeoJSON as any);
  //         console.log('Poligon to Line:',polygonToLines);


  //         // Los bordes del poligono puede ser Feature o FeatureCollection
  //         const borderFeatures: any[] =
  //           polygonToLines.type === 'FeatureCollection' ? polygonToLines.features :
  //           polygonToLines.type === 'Feature' ? [polygonToLines] : [];

  //         // Trocear el borde con la línea (partimos cada tramo del borde del poligono)
  //         const borderSegments: any[] = [];// Array para meter los bordes de los poligonos que intersectan
  //         for (const bf of borderFeatures) {// Por cada feature del borde que es una linea se busca su interseccion
  //           const bs = lineSplit(bf as any, lineGeoJSON as any) as GJFeatureCollection<GJLineString>; // Se corta cada borde con la linea geojason
  //           (bs.features || []).forEach(s => borderSegments.push(s)); // si intersecta se guarda el segmento en el array borderSegments
  //         }
  //         console.log('borderSegments: ',borderSegments)

  //         // 2) Trocear la línea con el borde (para quedarnos con el tramo interior)
  //         const lineSegmentsFC = lineSplit(lineGeoJSON as any, polygonToLines as any) as GJFeatureCollection<GJLineString>;// lineSplit pero al contrario
  //         const lineSegments = (lineSegmentsFC.features || []);// lineSegments sera una coleccion de features o un array vacio
  //         console.log('lineSegments:',lineSegments)// lineSegments sera una coleccion de features o un array vacio
  //         // 3) Perimetros completo: borde + línea
  //         const perimetros = featureCollection([ // Unimos los dos arrays en un solo featureCollection
  //           ...borderSegments,
  //           ...lineSegments
  //         ]) as any;



  //         // // Usar turf para cortar el polígono con la línea
  //         // const featuresCortadas = lineSplit(polygonToLines as any, lineGeoJSON as any);
  //         // console.log('Polígonos resultantes del corte:', featuresCortadas);
  //         // // console.log('Geometria:',featuresCortadas.features[0].geometry);
  //         // // let geometria = featuresCortadas.features[0].geometry;
  //         // // let cood = geometria.coodinates;

  //         // // Meto al ultimo poligono su punto inicial
  //         // console.log('Coordenadas',featuresCortadas.features[2].geometry.coordinates[0],featuresCortadas.features[2].geometry.coordinates[3]);
  //         // let coord1 = featuresCortadas.features[2].geometry.coordinates[0];
  //         // let coord2 = featuresCortadas.features[2].geometry.coordinates[3];
  //         // featuresCortadas.features[2].geometry.coordinates.push(coord1);
  //         // // console.log(featuresCortadas.features[2].geometry);



  //         // let linea = lineString(
  //         //   [coord1, coord2],
  //         //   {name:'Linea1'}
  //         // );
  //         // let featuresPolUno = [...featuresCortadas.features];
  //         // featuresPolUno.splice(featuresPolUno.length,1)
  //         // Paso los features a polygonize
  //         //console.log('Features sin puntos y con puntos',featuresCortadas.features,...featuresCortadas.features);
  //         // let poligonoUno = featureCollection(featuresPolUno,lineGeoJSON);

  //         // let poligonoDos = featureCollection([featuresCortadas.features[featuresCortadas.features.length -1], lineGeoJSON]);
  //         // let polygonCollection = featureCollection([...featuresCortadas.features, lineGeoJSON]);
  //         ////let polygonCollection = featureCollection([featuresCortadas.features[0],featuresCortadas.features[1],featuresCortadas.features[2]]);
  //         // Coger las lineas del primer polígono resultante y crear un nuevo polígono
  //         // const lineasUno = featuresCortadas.features[1];
  //         // console.log('Lineas del poligono Uno:',lineasUno)

  //         // Crear nuevo polígono a partir de las lineas
  //         console.log('Perimetros: ',perimetros);
  //         const poligonosPoligonize = polygonize(perimetros) as GJFeatureCollection<GJPolygon>;// Realizar la union de los perimetros y devuelve array de features
  //         // const newPolygonDos = polygonize(polygonCollection);
  //         // let newPolygons = newPolygonUno;

  //         console.log('Tras Poligonize: ',poligonosPoligonize)


  //         ///////////////
  //         const pieces: any[] = [];

  //         poligonosPoligonize.features.forEach((f: any) => {
  //           const clipped = intersect(f, polygonGeoJSON);
  //           if (!clipped) return;

  //           const flat = flatten(clipped);
  //           flat.features.forEach((p: any) => pieces.push(p));
  //         });

  //         // (opcional pero muy recomendable) eliminar basura: quedarte con las 2 piezas más grandes
  //         pieces.sort((a: any, b: any) => area(b) - area(a));
  //         const top2 = pieces.slice(0, 2);
  //         //////////////

  //         const newPolygons: GJFeatureCollection<GJPolygon> = {
  //           type: 'FeatureCollection',
  //           features: top2
  //         };

  //         // Deberia haber dos poligonos resultantes
  //         // newPolygons = poligonosPoligonize.features.filter((fea:any)=>{
  //         //   booleanWithin(fea as any, polygonGeoJSON as any);
  //         // });
  //         console.log('Nuevos polígonos tras corte:', newPolygons);
  //         // Verificar que hay dor poligonos
  //         if (newPolygons.features.length !== 2) {
  //           console.warn('Esperaba 2 piezas y han salido', newPolygons.features.length);
  //           return;
  //         }


  //         // let newPolygons = featureCollection(newPolygonDos.features.concat(newPolygonUno.features));


  //         // const newFeature2 = formatGJ.readFeature(lineasUno, {
  //         //     featureProjection: this.map.getView().getProjection(),
  //         //     dataProjection: 'EPSG:4326'
  //         //   });

  //         // console.log('Feature creado tras corte:', newFeature2 as Feature<Geometry>);

  //         // Eliminar el polígono original del source
  //         this.drawnVectorSource.removeFeature(feature);



  //         // // Pruebas para ver si los puedo pintar en el mapa
  //         // const newFeature1 = formatGJ.readFeature(featuresCortadas.features[0], {
  //         //     featureProjection: this.map.getView().getProjection(),
  //         //     dataProjection: 'EPSG:4326'
  //         //   });
  //         // const newFeature2 = formatGJ.readFeature(featuresCortadas.features[1], {
  //         //     featureProjection: this.map.getView().getProjection(),
  //         //     dataProjection: 'EPSG:4326'
  //         //   });
  //         //   const newFeature3 = formatGJ.readFeature(featuresCortadas.features[2], {
  //         //     featureProjection: this.map.getView().getProjection(),
  //         //     dataProjection: 'EPSG:4326'
  //         //   });

  //         // console.log('Features creados tras corte:', newFeature1 as Feature<Geometry>, newFeature2, newFeature3);
  //         // // newFeature1.getGeometry();

  //         // this.drawnVectorSource.addFeature(newFeature1 as Feature<Geometry>);
  //         // this.drawnVectorSource.addFeature(newFeature2 as Feature<Geometry>);
  //         // this.drawnVectorSource.addFeature(newFeature3 as Feature<Geometry>);

  //         // this.drawnVectorSource.refresh();

  //         // console.log('Features en drawnVectorSource tras corte:', this.drawnVectorSource.getFeatures());
  //         //newPolygons = featureCollection([...newPolygons]);
  //         // Añadir los nuevos polígonos resultantes al source
  //         newPolygons.features.forEach((poly: any) => {
  //           const newFeature = formatGJ.readFeature(poly, {
  //             featureProjection: this.map.getView().getProjection(),
  //             dataProjection: 'EPSG:4326'
  //           });
  //           console.log('Polygonos ? Features:',poly,newFeature);
  //           // // Guardar estilo original
  //           // newFeature.set('__originalStyle', styleArray[0].polygon);
  //           // newFeature.setStyle(styleArray[0].polygon);
  //           this.drawnVectorSource.addFeature(newFeature as Feature<Geometry>);
  //         });
  //       }
  //     } catch (err) {
  //         console.warn('Intersection test failed', err);
  //     }
  //   });
  //   this.lineVectorSource.removeFeature(line);
  //   this.isDrawing = false;
  // }

  /**
   * Description placeholder
   *
   * @param {*} linea 
   * @param {*} poligono 
   */
  cortarPoligonosConLinea(linea: any, poligono: any) {
    console.log('Metodo cortarPoligonosJSTS', linea, poligono);

    if (poligono === null) {
      this.lineVectorSource.removeFeature(linea);
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

      this.drawnVectorSource.removeFeature(poligono);
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
        this.drawnVectorSource.addFeature(newPolygon);
      }

      //// Programacion para ver las lineas generadas ////
      // Convertir poligono de jsts a Ol
      // console.log(insideLines._geometries[0]);
      // insideLines._geometries.forEach((geom:any)=>{
      //   let line = parser.write(geom);
      //   let newLine = new Feature({
      //     geometry: line,
      //     name:'Line_Prueba'
      //   })
      //   this.drawnVectorSource.addFeature(newLine);
      // })
      // const olLine = parser.write(insideLine._geometries[0]);
      // let newLine = new Feature({
      //   geometry: olLine,

      //   name:'Line_Prueba'
      // })
      // this.drawnVectorSource.addFeature(newLine);

    }
    this.lineVectorSource.removeFeature(linea);
    // console.log('Linea de corte añadida al mapa',this.lineVectorSource.getFeatures());
  }

  /**
   * CORTA un polígono (feature de OpenLayers) con una línea (feature de OpenLayers).
   * 
   * Esta es la versión propuesta y corregida del método.
   *
   * @param linea La feature de OpenLayers que contiene la LineString/MultiLineString de corte.
   * @param poligono La feature de OpenLayers que contiene el Polygon a cortar.
   */
  cortarPoligonosConLineaPropuesta(linea: any, poligono: any) {
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
    const polGeometry = parser.read(poligono.getGeometry());
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
    console.log('Lines To Union', linesToUnion);
    // 4. Filtrar geometrías nulas/vacías antes de la unión para evitar el error en JSTS
    const validLinesToUnion = linesToUnion.filter(geom => geom && !geom.isEmpty());
    console.log('Valid Lines To Union', validLinesToUnion);
    // 5. Usar UnaryUnionOp para crear una única geometría de líneas "nodadas" (topológicamente correcta)
    const nodedLines = UnaryUnionOp.union(validLinesToUnion);
    console.log('Noded Lines', nodedLines);

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


  /**
   * Description Metodo para cortar poligonos, recibe un string para usar dos herramientas para cortar de diferente manera
   *
   * @param {*} pol1 
   * @param {*} pol2 
   * @param {string} tool 
   */
  cortarPoligonoConPoligono(pol1: any, pol2: any, tool: string) {
    console.log('Metodo cortarPoligonoConPoligono', pol1, pol2);
    // Controls por si solo se ha dibujado un poligono y no se reciba dos veces el mismo.
    // if(pol2.get('name') === 'pol_0'){
    //   alert('solo hay un poligon');
    //   return
    // }



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
    console.log('JSTS polGeometry-1', pol1Geometry);
    console.log('JSTS polGeometry-2', pol2Geometry);

    // Bordes de poligonos
    let bordePoligono1 = pol1Geometry.getBoundary();
    console.log('Borde-Pol1', bordePoligono1);
    let bordePoligono2 = pol2Geometry.getBoundary();
    console.log('Borde-Pol2', bordePoligono2);
    // bordePoligono2 = pol2Geometry.buffer(0); // Para solucionar el problema de la forma de reloj de arena o pajarita // esto solo no funciona
    // bordePoligono2 = UnaryUnionOp.union(bordePoligono2);// Para solucionar el problema de la forma de reloj de arena o pajarita
    // Aniadir un if para ver si se cortan por el perimetro

    let cortan = bordePoligono2.intersects(bordePoligono1);
    if (cortan && tool === 'substract') {
      console.log('SI se cortan - SUBSTRACT');
      let resultPol = OverlayOp.difference(pol1Geometry, pol2Geometry);
      // let resultPol = OverlayOp.symDifference(pol1Geometry, pol2Geometry);
      let olPol = parser.write(resultPol);
      // Revisar porque crea multipolygon y necesito tipo polygon
      console.log(olPol);

      // const newPolygons = olPol.getPolygon(); // Cambio aqui quito ()
      // console.log('newPolygons OL',newPolygons)
      // Recorrer el array y crear features

      // olPol.forEach((pol:any)=>{

      let resultFeature = new Feature({
        geometry: olPol,
        style: styleArray[0].polygon,
        name: 'Pol_' + this.polIndex
      })
      this.polIndex++
      resultFeature.set('__originalStyle', styleArray[0].polygon);
      resultFeature.set('selected', false);
      this.drawnVectorSource.addFeature(resultFeature);
      // })

      this.drawnVectorSource.removeFeature(pol1);
      this.drawnVectorSource.removeFeature(pol2);

    } else if (cortan && tool === 'exclude') {
      console.log('SI se cortan - EXCLUDE');
      //let resultPol = OverlayOp.difference(pol1Geometry, pol2Geometry);
      let resultPol = OverlayOp.symDifference(pol1Geometry, pol2Geometry);
      let olPol = parser.write(resultPol);
      console.log('Ver resultado Multipolygon JSTS, OpenLayers', resultPol, olPol);

      const newPolygons = olPol.getPolygons();
      console.log('newPolygons OL', newPolygons)
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
        this.drawnVectorSource.addFeature(resultFeature);
      })

      this.drawnVectorSource.removeFeature(pol1);
      this.drawnVectorSource.removeFeature(pol2);
    } else {
      console.log('NO se cortan los bordes, es Interior');
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
      this.drawnVectorSource.addFeature(resultFeature);

      this.drawnVectorSource.removeFeature(pol1);
      this.drawnVectorSource.removeFeature(pol2);
    }
  }

  /**
   * Description Metodo para unir Poligonos
   *
   * @param {*} pol1 
   * @param {*} pol2 
   */
  unirPoligonoConPoligono(pol1: any, pol2: any) {

    console.log('Metodo unirPoligonoConPoligono', pol1, pol2);

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
    console.log('JSTS polGeometry', pol1Geometry);
    console.log('JSTS lineGeometry', pol2Geometry);

    let resultPol = OverlayOp.union(pol1Geometry, pol2Geometry);

    let olPol = parser.write(resultPol);

    let resultFeature = new Feature({
      geometry: olPol as Polygon,
      style: styleArray[0].polygon,
      name: 'Pol_' + this.polIndex
    })
    this.polIndex++

    resultFeature.set('__originalStyle', styleArray[0].polygon);
    resultFeature.set('selected', false);
    this.drawnVectorSource.addFeature(resultFeature);

    this.drawnVectorSource.removeFeature(pol1);
    this.drawnVectorSource.removeFeature(pol2);

  }

  calculatePolygonArea(xCoords: number[], yCoords: number[]): number {
    let area = 0;
    const numPoints = xCoords.length;

    for (let i = 0; i < numPoints; i++) {
      const j = (i + 1) % numPoints; // Next vertex index (wraps around)
      area += xCoords[i] * yCoords[j] - xCoords[j] * yCoords[i];
    }

    return Math.abs(area / 2);
  }


  // drawPoligon(drawInteraction:any){
  //   // Al clickar boton activamos la interaccion
  //   // const drawInteraction = arrayInteractions[0].draw
  //   // this.map.addInteraction(drawInteraction);
  //   // const interactions = this.map.getInteractions();

  //   this.bluePolygon = drawInteraction



  //   // Al al finalizar de pintar //
  //   drawInteraction.on('drawend', (e:any)=>{
  //     // crear nuevo geoJson OL
  //     const formatGJ = new GeoJSON();
  //     const drawnGJ = formatGJ.writeFeature(e.feature);
  //     const drawnFeatures = formatGJ.readFeatures(drawnGJ)

  //     // Aniado el feature al Vector
  //     // this.polygonUno =  new VectorSource({
  //     //   features: drawnFeatures,
  //     // })

  //     // Capa con el poligono 
  //     // const bluePolygons = new VectorLayer({
  //     //   source: this.polygonUno,
  //     //   style: styleArray[0].polygon,
  //     //   visible: true,
  //     //   zIndex: 2
  //     // })

  //     // console.log(e.feature.getGeometry());
  //     // console.log(e.feature);
  //     // Parseo a Polygon para acceder a sus métodos
  //     const polygon = e.feature.getGeometry() as Polygon

  //     let centerCoords = polygon.getInteriorPoint().getCoordinates();

  //     this.map.getView().animate({center: centerCoords}, {zoom: 5},{duration: 600})
  //     // console.log(centerCoords);
  //     // this.map.addLayer(bluePolygons);
  //     this.map.removeInteraction(drawInteraction);

  //     const layerExtentA = polygon.getExtent();
  //     //console.log('Extent: ',layerExtentA)


  //     const estadosTocados:Array<Feature>= []

  //     this.usSource.forEachFeatureInExtent(layerExtentA, (feature: Feature)=>{

  //       // COMPARACION CON EXTENT //
  //       // const layerExtentB = feature.getGeometry()?.getExtent()

  //       // if (polygon.intersectsExtent(layerExtentB!)) {

  //       //   estadosTocados.push(feature);
  //       //   // Colorear de rosa los estados coincidentes con el poligono
  //       //   feature.setStyle(styleArray[0].rosa);

  //       //   this.statesInfo.forEach((state)=>{
  //       //     if(state.name === feature.get('ste_name')[0]){
  //       //       this._covidData.setSelectedState(state.state)
  //       //       state.selected = true;
  //       //     }
  //       //   })
  //       // }

  //       // COMPARACION CON LIBRERIA TURF //

  //       // GeoJSON del polígono dibujado (en lon/lat EPSG:4326) — compatible con Turf
  //       const drawnGeoJSON = formatGJ.writeFeatureObject(e.feature, {
  //         featureProjection: this.map.getView().getProjection(),
  //         dataProjection: 'EPSG:4326'
  //       });

  //       // convertir la feature del estado a GeoJSON en EPSG:4326 para Turf
  //       const stateGeoJSON = formatGJ.writeFeatureObject(feature, {
  //         featureProjection: this.map.getView().getProjection(),
  //         dataProjection: 'EPSG:4326'
  //       });

  //       try {
  //         if (booleanIntersects(drawnGeoJSON as any, stateGeoJSON as any)) {

  //           estadosTocados.push(feature);

  //           feature.setStyle(styleArray[0].rosa); // colorear
  //           //feature.set('__selected', true);

  //           this.statesInfo.forEach((state)=>{
  //             if(state.name === feature.get('ste_name')[0]){
  //               this._covidData.setSelectedState(state.state)
  //               state.selected = true;
  //             }
  //           })
  //         }
  //       } catch (err) {
  //           console.warn('Intersection test failed', err);
  //         }

  //     })
  //     // console.log('Features nueva: ',this.polygonUno.getFeatures())
  //     // console.log('Features estados: ',this.usSource.getFeatures())
  //     // console.log('Coinciden Array: ', estadosTocados)
  //   })


  //   // this.map.getView().animate({center: fromLonLat([lon,lat])}, {zoom: 5})
  // }



  // // Yo tenia esto que me instale tambien ol-ext
  // mapControls: Bar = new Bar({
  //   toggleOne: true,
  // });

  // controls: Control[] = [];

  // al hacer click en el boton aniade el control con su interaccion 
  // this.map.addControl(this.mapControls); // mapControls el objeto Bar


  // addControls(interaction: Interaction, icon: string, title: string) {
  //   this.mapControl = new Toggle({
  //     className: 'btn-map',
  //     title: title,
  //     interaction: interaction,
  //     active: false,
  //     html: icon,
  //   });

  //   this.mapControls.addControl(this.mapControl); // mapControls.addControl es un metodo del objeto Bar
  //   this.controls.push(this.mapControl);
  // }
  // // y los llamaba asi 
  //   this.addControls(
  //     this.transformInteraction,
  //     "<i class='fa-solid fa-arrows-up-down-left-right'></i>",
  //     'Transformar'
  //   );


}
