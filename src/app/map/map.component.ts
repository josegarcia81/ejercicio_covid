// COMUN //
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

// VARIABLES COMUNES //
import { styleArray } from '../shared/styles';

// SERVICIOS //
import { CovidDataService } from '../services/covid-data.service';
import { MapService } from '../services/map.service';

// LIBRERIA OL //
import Map from "ol/Map";
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import { Geometry, LineString, MultiLineString, Polygon } from 'ol/geom';

// LIBRERIA TURF //
import { booleanIntersects, featureCollection, lineSplit, polygonize, polygonToLine, union, lineString, lineStrings } from '@turf/turf';


// LIBRERIA OL-EXT //
import Toggle from 'ol-ext/control/Toggle';
import Bar from 'ol-ext/control/Bar';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify'
import  Transform  from 'ol-ext/interaction/Transform';

// MODELOS //
import { CovidData } from '../models/CovidData.model';
import { StateInfo } from '../models/StateInfo.model';
import { findIndex } from 'rxjs';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, AfterViewInit {
  // para capturar e introducir texto en el letrero
  @ViewChild('letreroTexto') letreroTexto! : ElementRef<HTMLDivElement>;
  // Datos de la API
  private countriesData: CovidData[] = [];
  public statesInfo: StateInfo[] = [];

  // p-listbox
  public cities: Array<string> = [];
  public selectedCity: any;

  // p-autocomplete
  public selectedCountry:any;
  public suggestions:any
  
  // Mapa y features
  public map!: Map;
  public selectedState:string = '';
  public usSource!: VectorSource;
  public estadoAnterior!:Feature;
  
  // Will be set in ngAfterViewInit when the ViewChild is available
  public etiqueta!: HTMLElement;
  public letreroTextoOverlay!: Overlay;
  public ctrlDisabled: boolean = false;
  private selected: boolean = false; // Usado de toggle al seleccionar un feature seleccionado.
  
  // Controles //
  public controlBar!: InstanceType<typeof Bar>;
  public subControlBar!: InstanceType<typeof Bar>;
    // Pintar
  private drawnVectorSource!:VectorSource;
  public drawVectorLayer!: VectorLayer; // La capa donde se van a mostrar
  public polygonAnterior!: Polygon;
  private featureAnterior!: Feature;
  private isDrawing: boolean = false;
  public draw!:Draw; // Interaccion que permite pintar
  private drawnFeatureAtPixel!: any[]
  private polIndex: number = 0;
  private drawInteraction!: Draw;
  private featureUno!: Feature<Geometry>;
  private featureDos!: Feature<Geometry>;

    // Eliminar Poligono
  private estadosTocadosArray: Array<Feature>= []
  private borradoPoligono: boolean = false;

    // Modificar
  private modifyInteraction!: Modify;
  public modify!: Modify;
  private modificado: boolean = false;
    // Transform
  private transformInteraction!: typeof Transform;
  private featureSeleccionada!: Feature<Geometry>;
  private transformado: boolean = false;
    // Cortar
  private lineVectorSource!: VectorSource;
  public lineVectorLayer!: VectorLayer;
  private cutInteraction!: Draw;
  
  
  public bluePolygon: any;
  
  
  
  
  constructor(
    private _covidData: CovidDataService, // Datos de la API
    private _mapService:MapService, // Mapa,
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
      this.statesInfo.forEach(state=>{
        this.cities.push(state.name)
        
      })
    });
    // console.log('States Info =>',this.statesInfo)
    // console.log('Cities Info =>',this.cities)

    


    // // Botton Pintar Poligono
    // const drawInteraction = arrayInteractions[0].draw
    // const drawPoligon = new Toggle({
    //   html: '<i-lucide name="vector-square" [size]="20"></i-lucide>',
    //   className: 'ctrl-button',
    //   title: 'Draw',
    //   interaction: arrayInteractions[0].draw,
    //   active:false,
    //   bar:this.subControlBar,
    //   ontoggle: this.drawPoligon(drawInteraction)
    // })
    // this.controlBar.addControl(drawPoligon)

  }

  /** Description placeholder */
  ngAfterViewInit(){

    

    let clicked:boolean = false;
    
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
      if(isFeatureAtPixel && !!featureAtPixel[0].get('ste_name')){
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
    this.usSource =  new VectorSource({
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
    
    // Aniado la Layer que contiene ya los features cargados del Source Al Mapa
    this.map.addLayer(usStates)
    // Setear layer a visible
    usStates.setVisible(true)



    // Cuando se carguen los estilos //
    // Cambiar estilo de los estados segun datos de positivos //
    this.usSource.on('featuresloadend', () => { // Si se usa function(){} no va a funcionar porque no deja acceder a constantes de fuera
      //console.log(usSource.getFeatures());
      //console.log(this.map.getAllLayers())
      this.usSource.getFeatures().forEach((feature,index) => {
        // Setear propiedad del Feature 'selected' a false por defecto
        feature.set('selected', false);
        // console.log(feature);
        const state_code = feature.get("ste_stusps_code")
        const matchedState = this.countriesData.find(country => country.getState() === state_code);
        const positives = matchedState?.getPositive();
        
        if(feature instanceof Feature && matchedState){ // 19/11/2025 - Con matchedState parece que ya carga bien los colores del mapa y no los carga en rojo
          //console.log(index, feature.getStyle());
          //console.log(feature)
          if (positives! >= 0 && positives! <= 200000){
            feature.setStyle(styleArray[0].green);
            feature.set('__originalStyle', feature.getStyle());
            // console.log('green' + positives);
          } else if(positives! > 200000 && positives! <= 400000){
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
        }else{return} // 19/11/2025 - Aniadido a la vez que matchedState
        
      })
    });

    
      // Cambiar estilo al hacer click en un estado //
    
      this.map.on('click', (e) => {
        if(!this.isDrawing){
          // console.log('Features en drawnVectorSource',this.drawnVectorSource.getFeatures());
          // console.log('Click habilitado:',!this.isDrawing)
          // console.log('Interactions added:',this.map.getInteractions().forEach((item)=>item.getN === 'Draw')

          // Todas las features en el pixel clickado
          const features: any[] = this.map.getFeaturesAtPixel(e.pixel) || [];
          // Features dibujados en el pixel clickado aplicado filtro de capa(VectorLayer)
          this.drawnFeatureAtPixel = this.map.getFeaturesAtPixel(e.pixel,{layerFilter: (layer)=>{return layer === this.drawVectorLayer;}}) || [];
          

          console.log('Nombre del Feature Seleccionado pixel:',this.drawnFeatureAtPixel[0]?.get('name'));// Con interrogacion la indicamos que puede haber o no para que no falle.
          console.log('Filtro por capa drawnFeatureAtPixel:',this.drawnFeatureAtPixel);
          console.log('AllFeatures at pixel',features);

          // Formato GEOJson de OpenLayers
          const formatGJ = new GeoJSON();
          // Coger la primera feature del array (la de mas arriba)
          const olFeature = features[0];
          // Convertir la feature de OL a GeoJSON compatible con Turf
          const usTurfFeature = formatGJ.writeFeatureObject(olFeature,{
            featureProjection: this.map.getView().getProjection(),
            dataProjection: 'EPSG:4326'
          });

          // Convertir la feature de OL a GeoJSON compatible con Turf
          const drawnTurfFeature = formatGJ.writeFeatureObject(olFeature,{
            featureProjection: this.map.getView().getProjection(),
            dataProjection: 'EPSG:4326'
          });

          // todo: turf poligon union test

          //const miPol = new Polygon(olFeature.getGeometry().getCoordinates());
          
          
          // const drawnTurfFeature = new GeoJSON().writeFeatureObject(this.drawnFeatureAtPixel[0]!);

          console.log('ol-Polygon',olFeature,features[0].getGeometry() as Polygon);
          console.log('turf-Polygon GeoJson',usTurfFeature);
          //console.log('ol-Polygon miPol',miPol);

          // const formatGJ = new GeoJSON();
      
          // GeoJSON del polígono dibujado (en lon/lat EPSG:4326) — compatible con Turf
          // const drawnGeoJSON = formatGJ.writeFeatureObject(this.drawnFeatureAtPixel[0]!, { // estoy cogiendo el numero 0 tengo que mandar el clickado arriba en on click
          //   featureProjection: this.map.getView().getProjection(),
          //   dataProjection: 'EPSG:4326'
          // });

          // // convertir la feature del estado a GeoJSON en EPSG:4326 para Turf
          // const stateGeoJSON = formatGJ.writeFeatureObject(features[0], {
          //   featureProjection: this.map.getView().getProjection(),
          //   dataProjection: 'EPSG:4326'
          // });

          // const unionPolygon = union(featureCollection([drawnGeoJSON.geometry as any, stateGeoJSON.geometry as any]));
          // const newPolygon = new Feature({
          //   geometry: formatGJ.readGeometry(unionPolygon!.geometry),
          // })
          // console.log('Union Polygon Turf:',unionPolygon!.geometry);
          // console.log('New Polygon OL:',newPolygon.getGeometry());

          // this.drawnVectorSource.addFeature(newPolygon);

          // Si hay features dibujados en el pixel clickado
          if(this.drawnFeatureAtPixel.length > 0 ){
            this.subControlBar.setVisible(true); // Si se clica un Feature dibujado se habilita boton borrado/compare
            delPoligon.setActive(false); // Activar boton borrar poligono

            this.selected = this.drawnFeatureAtPixel[0].get('selected') ? false : true;
            console.log('Valor de selected del poldibujado',this.selected) // marcar como seleccionado ? false : true;
            this.drawnFeatureAtPixel[0].set('selected', this.selected);// Marcar como seleccionado el feature Clicado
            console.log('Valor de selected del poldibujado 2',this.drawnFeatureAtPixel[0].get('selected'))
            // Feature clicada en capa drwawnFeatureAtPixel parseada a Polygon
            const polygonClicado = this.drawnFeatureAtPixel[0].getGeometry() as Polygon;
            // console.log('Pligonos Pintados Anterior y Clicado:',this.polygonAnterior, polygonClicado);
            // Guardar el poligon en poligonoAnterior si no existia porque es el primero
            // Este primer viaje funciona ok
            if(!this.polygonAnterior){ // Si no existe poligono anterior entra
              console.log('IF NO HAY POLIGONO ANTERIOR');
              this.featureAnterior = this.drawnFeatureAtPixel[0];// Guarda el Feature clicado actual como anterior
              this.polygonAnterior = polygonClicado; // Guarda el Poligono clicado actual como anterior
              const featureClicada = this.drawnFeatureAtPixel[0] as Feature; // Guardar el feature clicado
              //featureClicada.set('__originalStyle', styleArray[0].polygon);// Setear original Style aqui cogido del array de estilos
              let centerCoords = polygonClicado.getInteriorPoint().getCoordinates();// Recoger coordenadas del centro del poligono
              this.map.getView().animate({center: centerCoords}, {zoom: 5},{duration: 600});// Coger la view del map y viajar a sus coordenadas
              this.estadosTocados(polygonClicado);// Llamar funcion para pintar estados
              
             }else if(this.featureAnterior.get('name') !== this.drawnFeatureAtPixel[0].get('name')){// Si no son iguales
              console.log('IF NO SON POLIGONOS IGUALES')
              
              if(!this.borradoPoligono){
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

              this.map.getView().animate({center: centerCoords}, {zoom: 5},{duration: 600});
            
              this.estadosTocados(polygonClicado);
              
             }else{
              // setear nuevo poligono Anterior
              this.polygonAnterior = polygonClicado;
              // this.featureAnterior.set('selected', false)// Esto creo que no hace nada

              const featureClicada = this.drawnFeatureAtPixel[0] as Feature;
              // Seteo al crearla
              // Setear original Style aqui // creo que no esta bien definido el set
              // featureClicada.set('__originalStyle', this.drawnFeatureAtPixel[0].getStyle());

              let centerCoords = polygonClicado.getInteriorPoint().getCoordinates();

              this.map.getView().animate({center: centerCoords}, {zoom: 5},{duration: 600});
            
              this.estadosTocados(polygonClicado);
            }
            
          }else {this.subControlBar.setVisible(false)}// Si se clica fuera de un Feature dibujado se deshabilita boton borrado/compare

          // console.log('Desde map - state code: ',features[0].get("ste_stusps_code"));
          // Si hay features en el pixel clickado
          if (features[0].get('selected') === true && this.drawnFeatureAtPixel.length === 0) {
            this._covidData.setSelectedState(features[0].get("ste_stusps_code"),false);

          }else{
            this._covidData.setSelectedState(features[0].get("ste_stusps_code"),true);
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
          if(feature.getStyle() === styleArray[0].rosa){
            console.log('Entrado en if de comprobacion de estilo color rosa')
            feature.setStyle(original);
            feature.set('selected', false);
          } else{
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
            this.statesInfo[index].selected = this.statesInfo[index].selected ? false : true ;
          }
        /////////////////////////////////////////////////////
        }
      
      });

    
    
    // Subscribe que hace que se resetee el estilo de un estado
    this._covidData.resetStyle$.subscribe(({value:activated,codigo:state_code, selected:select})=>{
      // console.log('Activado el reseteo de estilo a un solo estado')
      // console.log('Click desde el checkbox-MAP',activated);
      // console.log('Click desde el checkbox-MAP',state_code);
      // console.log('Click desde el checkbox-MAP',select);
      if(activated){
        const match = this.usSource.getFeatures().find(feature=>feature.get('ste_stusps_code') === state_code)
        console.log('Match de Reset-Style metodo-Map',match)
        if(match && select){
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
        console.log('ResetStyle',this.statesInfo);
        // this.usSource.getFeatures().forEach((feature,index) => {
        //   const original = feature.get('__originalStyle');
        //   feature.setStyle(original);
        //   feature.set('selected', false);
        // })
        this.usSource.forEachFeature(feature=>console.log('Holi',feature.get('selected')))
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
      zIndex: 2
    })
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
      zIndex: 99999
    })
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
      interaction: this.drawInteraction,
      active:false,
      onToggle: (active:boolean)=>{
        this.isDrawing = active
        this.subControlBar.setVisible(false)
        // this.polIndex++;
        // console.log('Toggle:',this.isDrawing)
      }
    })
    this.drawInteraction.on('drawend',(e:any)=>{
      e.feature.set('name','pol_'+this.polIndex);
      this.polIndex++;
      e.feature.set('__originalStyle', styleArray[0].polygon);
      console.log('Dibujado Draw:', e);
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
      active:false,
      onToggle: (active:boolean)=>{
        // Deshabilitar la funcion click
        this.isDrawing = active;
        this.subControlBar.setVisible(false);
        this.modificado = true;
        //this._covidData.setOriginalStyles(true)
      }
    })
    // Verificacion para pintar poligonos.
    this.modifyInteraction.on('modifyend',(e: any)=>{
      // this.modificado = true;
      let feature = e.features.item(0);
      console.log('Modificada Modify:', e, feature);
      this.estadosTocados(feature.getGeometry() as Polygon);
      // this.estadosTocados(feature.getGeometry() as Polygon);
    })
    // Aniadir toggle a barra principal.
    this.controlBar.addControl(modifyPolygon);

    // Interaccion Transform
    this.transformInteraction = new Transform ({
      enableRotation: true,
      enableScaling: true,
      keepAspectRatio: (event:any) => event.originalEvent.shiftKey, // Mantener proporción con Shift
      features: this.drawnFeatureAtPixel,
      filter:(feature:Feature, layer:VectorLayer)=>{ 
        this.featureSeleccionada = feature;
        return layer === this.drawVectorLayer }
    })
      // Botton Transformar Poligono
    const transformPolygon = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-expand-icon lucide-expand"><path d="m15 15 6 6"/><path d="m15 9 6-6"/><path d="M21 16v5h-5"/><path d="M21 8V3h-5"/><path d="M3 16v5h5"/><path d="m3 21 6-6"/><path d="M3 8V3h5"/><path d="M9 9 3 3"/></svg>',
      className: 'ctrl-button',
      title: 'Transform',
      interaction: this.transformInteraction,
      active:false,
      onToggle:(active:any)=>{
        this.subControlBar.setVisible(false);
        this.isDrawing = active
        if (active && this.featureSeleccionada) {
          this.transformInteraction.select(this.featureSeleccionada);
          console.log('Feature seleccionada:', this.featureSeleccionada);
          
        }
        this.estadosTocados(this.featureSeleccionada.getGeometry() as Polygon);
        this.subControlBar.setVisible(true);
      }
    });
    // Usar para volver a reseleccionar estados
    // Escuchar eventos de transformación
    this.transformInteraction.on(['rotateend','scaleend','translateend'], (e:any) => {
      
      let feature = e.features.item(0);
      console.log('Modificada Transformacion:', e, feature);
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

    // this.lineVectorLayer.setSource(this.lineVectorSource);
      // Interaccion dibujar Linea
    this.cutInteraction = new Draw({
      type: 'LineString',
      source: this.lineVectorSource,
      style: styleArray[0].line
    })
      // Boton Cortar poligonos con linea
    const cutPolygon = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-scissors-icon lucide-scissors"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>',
      className: 'ctrl-button',
      title: 'Cut Polygon',
      interaction: this.cutInteraction,
      active:false,
      onToggle:(active:any)=>{
        this.subControlBar.setVisible(false);
        this.isDrawing = active;
        if(!active){
          console.log('Entrando En Toggle');
          // console.log('Features en drawnVectorSource:', this.drawnVectorSource.getFeatures().length);
          if(this.drawnVectorSource.getFeatures().length > 0){
            console.log('Entrando En Toggle Si hay features');
            const features = this.lineVectorSource.getFeatures();
            const matchFeature = features.find(feature=>feature.get('name') === 'lineaDeCorte');
            console.log(matchFeature);
            console.log(this.lineVectorSource.getFeatures());
            if(matchFeature){this.cortarPoligonos(matchFeature);}
          }
        }
      }
   
    });
    this.cutInteraction.on('drawend',(e:any)=>{
      console.log('Linea para cortar poligonos dibujada:', e.feature);
      const lineaDeCorte = e.feature as Feature<LineString>;
      // lineaDeCorte.setStyle(styleArray[0].line);
      lineaDeCorte.set('name','lineaDeCorte');
      // console.log('Linea de corte:', lineaDeCorte);
      //console.log('Features en drawnVectorSource:', this.drawnVectorSource.getFeatures());
      // Llamar funcion cortar poligonos
      // this.cortarPoligonos(e.feature);
      // this.isDrawing = false;
    })
    // Aniadir a la barra pricipal
    this.controlBar.addControl(cutPolygon);

    // // Boton cortar poligonos entre ellos
    // const cutPolygonsBetween = new Toggle({
    //   html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-squares-subtract-icon lucide-squares-subtract"><path d="M10 22a2 2 0 0 1-2-2"/><path d="M16 22h-2"/><path d="M16 4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-5a2 2 0 0 1 2-2h5a1 1 0 0 0 1-1z"/><path d="M20 8a2 2 0 0 1 2 2"/><path d="M22 14v2"/><path d="M22 20a2 2 0 0 1-2 2"/></svg>',
    //   className: 'ctrl-button',
    //   title: 'Substract Polygons',
    //   interaction: this.drawInteraction,
    //   active:false,
    //   onToggle:(active:any)=>{
    //     this.subControlBar.setVisible(false);
    //     this.isDrawing = active
    //   }
    // });
    // // Aniadir a la barra pricipal
    // this.controlBar.addControl(cutPolygonsBetween);

    // // Boton unir poligonos entre ellos
    // const unitePolygonsBetween = new Toggle({
    //   html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-squares-unite-icon lucide-squares-unite"><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3a1 1 0 0 0 1 1h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-3a1 1 0 0 0-1-1z"/></svg>',
    //   className: 'ctrl-button',
    //   title: 'Unite Polygons',
    //   interaction: this.drawInteraction,
    //   active:false,
    //   onToggle:(active:any)=>{
    //     this.subControlBar.setVisible(false);
    //     this.isDrawing = active
    //   }
    // });
    // // Aniadir a la barra pricipal
    // this.controlBar.addControl(unitePolygonsBetween);

    // // Boton extraer parte de poligonos entre ellos el segundo sustrae del primero
    // const excludePolygonsBetween = new Toggle({
    //   html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-squares-exclude-icon lucide-squares-exclude"><path d="M16 12v2a2 2 0 0 1-2 2H9a1 1 0 0 0-1 1v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h0"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3a1 1 0 0 1-1 1h-5a2 2 0 0 0-2 2v2"/></svg>',
    //   className: 'ctrl-button',
    //   title: 'Substract part of Polygon',
    //   interaction: this.drawInteraction,
    //   active:false,
    //   onToggle:(active:any)=>{
    //     this.subControlBar.setVisible(false);
    //     this.isDrawing = active
    //   }
    // });
    // // Aniadir a la barra pricipal
    // this.controlBar.addControl(excludePolygonsBetween);

    // // Boton cargar archivo GeoJSON
    // const fileUpload = new Toggle({
    //   html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-plus-corner-icon lucide-file-plus-corner"><path d="M11.35 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5.35"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M14 19h6"/><path d="M17 16v6"/></svg>',
    //   className: 'ctrl-button',
    //   title: 'Upload GEOJson File',
    //   interaction: this.drawInteraction,
    //   active:false,
    //   onToggle:(active:any)=>{
    //     this.subControlBar.setVisible(false);
    //     this.isDrawing = active
    //   }
    // });
    // // Aniadir a la barra pricipal
    // this.controlBar.addControl(fileUpload);
    
    // BARRA DE SUBMENU DE SELCCION DE POLIGONO //
    this.subControlBar = new Bar({
      className: 'sub-toolbar',
      toggleOne: true,
      group:true
    })
    this.subControlBar.setVisible(false)
    
    // BOTON para BORRAR poligono
    const delPoligon = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
      className: 'sub-button',
      title: 'Delete Polygon',
      active:false,
      onToggle: (active:any)=>{
        console.log('delPolygon toggle pulsado')
        if(active){
          //Continuar aqui conpara el nombre del feature.get('name') y borrarlo de drawnVectorSource
          drawPolygon.setActive(false)
          this.borradoPoligono = true;// Usado para resetear estados tocados en el click anterior en map.on('click'
          this.isDrawing = true; // Deshabilitar la funcion click
          //this.disableDraw()

          console.log('drawnFeatureAtPixel: ',this.drawnFeatureAtPixel[0].get('name'));
          console.log('EstadosTocados - selected - feature[0]', this.estadosTocadosArray[0].get('selected'));
          const featureToDelete = this.drawnFeatureAtPixel.find(feature=>feature.get('name') === this.drawnFeatureAtPixel[0].get('name'));
          console.log('Feature to delete:',featureToDelete);
          if(featureToDelete){
            // Antes de borrar el feature comprobar si hay estados tocados y resetearlos
            const polygon = featureToDelete.getGeometry() as Polygon;
            if(this.estadosTocadosArray.length > 0){// Comprueba que hay features de estados tocado y si hay los resetea y si no hay no.
              this.estadosTocadosArray.forEach((stateFeature)=>{
                const original = stateFeature.get('__originalStyle');
                stateFeature.setStyle(original);
                stateFeature.set('selected', false);

                this.statesInfo.forEach((state)=>{
                  // console.log(state.name);
                  // console.log(feature.get('ste_name').toString());
                  if(state.name === stateFeature.get('ste_name').toString()){ // Aqui habia problema de comparacion porque uno era array y otro string
                    // Avisamos del cambio de estado al servicio
                    this._covidData.setSelectedState(state.state,false);
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
            this.map.getView().animate({center: fromLonLat([-99.92,35.56])}, {zoom: 4},{duration: 600}); // Volver al centro
          }
          
        }
        console.log('Quedan Features en drawnSource? =>',this.drawnVectorSource.getFeatures());
        console.log('Quedan Features en estadosTocados? =>',this.estadosTocadosArray);
        this.subControlBar.setVisible(false);
        this.isDrawing = false;
      }
      
    })
    // Boton ver comparacion de los estados
    const stateCompareToggle = new Toggle({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-column-stacked-icon lucide-chart-column-stacked"><path d="M11 13H7"/><path d="M19 9h-4"/><path d="M3 3v16a2 2 0 0 0 2 2h16"/><rect x="15" y="5" width="4" height="12" rx="1"/><rect x="7" y="8" width="4" height="9" rx="1"/></svg>',
      className: 'sub-button',
      title: 'Compare States',
      active:false,
      onToggle: ()=>{
        console.log('Compare toggle pulsado')
        if(this.drawnFeatureAtPixel){
          this._covidData.setCompare(true)
        }
      }
    })

    // Aniadir boton a subBarra
    this.subControlBar.addControl(delPoligon)
    this.subControlBar.addControl(stateCompareToggle)
    //console.log(this.subControlBar.getActiveControls())

    // Aniadir subBarra a Barra principal
    this.controlBar.addControl(this.subControlBar)
    
    // Aniadir barra de control
    this.map.addControl(this.controlBar)

    // Resetear estilos de los estados //
    // Lo llamo para que el subscribe este activo y escuche los cambios
    this.resetStyles()
    
    

  }
  // Funciona ok.
  /** Description Subscribe que hace que se resetee el estilo de todos los estados */
  resetStyles() {
    // Subscribe que hace que se resetee el estilo de todos los estados
    this._covidData.resetStyles$.subscribe((activated)=>{
      console.log('Activado el reseteo de estilos')
      if(activated){
        // Reset estilos Estados

        // A cada feature en el source de estados le pone su estilo original guardado
        this.usSource.getFeatures().forEach((feature)=>{
          feature.setStyle(feature.get('__originalStyle'));
          feature.set('selected',false);
        });
        // A cada estado en this.statesInfo le pone selected a false
        this.statesInfo.forEach(state=>state.selected = false);

        // Reset estilos Features dibujados
        this.drawnVectorSource.getFeatures().forEach((feature)=>{
          feature.setStyle(feature.get('__originalStyle'))
          feature.set('selected',false);
          
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
  selecState(event:any){
    // console.log('LECTURA estado anterior: ',this.estadoAnterior?.get('ste_name'));
    const stateName = event.value;
    const matchedState = this.usSource.getFeatures().find((feature: any) => feature.get('ste_name').toString() === stateName) as Feature;
    // console.log('Estado Seleccionado:',matchedState.get('ste_name'));
    // console.log('Estado inicio:',matchedState);

    
    if(!this.estadoAnterior){
      // this.estadoAnterior = matchedState;
      this.estadoAnterior = matchedState;
      console.log('a entrado en 1')
    } else if (this.estadoAnterior!.get('ste_name') !== matchedState.get('ste_name')){
      this.estadoAnterior = matchedState;
      console.log('a entrado en 2')
      console.log('SET estado anterior: ',this.estadoAnterior.get('ste_name'))
    } else{
      console.log('a entrado en 3')
      const original = this.estadoAnterior.get('__originalStyle');
      // console.log(this.estadoAnterior.getStyle())
      // console.log(original)
      this.estadoAnterior.setStyle(original);
      // this.estadoAnterior!.set('__selected', false);
    }
    
    const coord = matchedState?.get('geo_point_2d')
    const lon= coord.lon
    const lat= coord.lat
    
    // console.log(matchedState?.get('geo_point_2d'))
    // console.log(typeof(coord))

    const isSelected:boolean = matchedState.get('__selected');
    console.log('COMPARACION',(!isSelected && matchedState))

    if (!isSelected || matchedState){
      const original = this.estadoAnterior!.get('__originalStyle');
      this.estadoAnterior!.setStyle(original);
      this.estadoAnterior!.set('__selected', false);

      // viajar al estado
      this.map.getView().animate({center: fromLonLat([lon,lat])}, {zoom: 5})
      //matchedState.set('__originalStyle', matchedState.getStyle());
      matchedState.set('__selected', true);
      matchedState.setStyle(styleArray[0].rosa)
      this._covidData.setSelectedState(matchedState.get('ste_stusps_code'),true)
      
      //console.log('a entrado')
    }
  }

  /**
   * Description Pintar los estados que han sido tocados por el poligono que se ha dibujado. Se usa Libreria Turf.
   *
   * @param {Polygon} polygon 
   */
  estadosTocados(polygon:Polygon){
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
    this.usSource.forEachFeature((feature: Feature)=>{

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
      const drawnGeoJSON = formatGJ.writeFeatureObject(this.drawnFeatureAtPixel[0]!, { // estoy cogiendo el numero 0 tengo que mandar el clickado arriba en on click
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
          console.log(this.estadosTocadosArray);
          
          //Si hay coincidencia, coge el feature que viene del source usSource y lo inserta al array
          this.estadosTocadosArray.push(feature);
          //console.log('Valores true:false feature clicado, feature intersectado',this.drawnFeatureAtPixel[0].get('selected'),feature.get('selected'));

          if(this.drawnFeatureAtPixel[0].get('selected') === true && feature.get('selected') !== true){
            
            feature.setStyle(styleArray[0].rosa); // colorear con color original
            feature.set('selected', true);// Poner propiedad del Feature a true
            this._covidData.setSelectedState(feature.get('ste_stusps_code'),true);   
            // Tras cambiar el color cambiamos el select en el array this.statesInfo y en nav-bar
            this.statesInfo.forEach((state)=>{
              // console.log(state.name);
              // console.log(feature.get('ste_name').toString());
              if(state.name === feature.get('ste_name').toString()){ // Aqui habia problema de comparacion porque uno era array y otro string
                // Avisamos del cambio de estado al servicio
                // 
                console.log('ESTA ENTRANDO AQUI');
                state.selected = false;
                // console.log(state.selected);
              }
            })
           
          }else if(this.drawnFeatureAtPixel[0].get('selected') === false && feature.get('selected') === true){
              // this.drawnFeatureAtPixel[0].setStyle(this.drawnFeatureAtPixel[0].get('__originalStyle'));
              feature.setStyle(feature.get('__originalStyle')); // reset al original
              feature.set('selected', false);
              this._covidData.setSelectedState(feature.get('ste_stusps_code'),false);
              // Tras meter en el array y cambiar el color cambiamos el select en el array this.statesInfo
              this.statesInfo.forEach((state)=>{
                // console.log(state.name);
                // console.log(feature.get('ste_name').toString());
                if(state.name === feature.get('ste_name').toString()){ // Aqui habia problema de comparacion porque uno era array y otro string
                  // Avisamos del cambio de estado al servicio
                  //this._covidData.setSelectedState(state.state,);
                  console.log('ESTA ENTRANDO AQUI');
                  // state.selected = false;
                  // Revisar esto   //console.log(state.selected);
                  //////////////////// this.drawnFeatureAtPixel[0].set('selected', false);
                }
              })
            }
          
         }else{ // TODO: SEGUIR AQUI, sI NO INTERSECTA PONER LOS ESTADOS EN COLOR ORIGINAL Y DESSELECCIONAR DEL NAV-BAR = FALSE

          feature.setStyle(feature.get('__originalStyle')); // reset al original
          feature.set('selected', false);
          this._covidData.setSelectedState(feature.get('ste_stusps_code'),false);
          // Tras no intersectar cambiamos el select en el array this.statesInfo
          this.statesInfo.forEach((state)=>{
            // console.log(state.name);
            // console.log(feature.get('ste_name').toString());
            if(state.name === feature.get('ste_name').toString()){ // Aqui habia problema de comparacion porque uno era array y otro string
              // Avisamos del cambio de estado al servicio
              //this._covidData.setSelectedState(state.state)
              console.log('ESTA ENTRANDO AQUI METODO NO INTERSECT')
              state.selected = false;
              console.log(state.selected);
            }
          })
        }

      } catch (err) {
          console.warn('Intersection test failed', err);
      }

      
      
    })
    console.log('Estados Tocados:', this.estadosTocadosArray)
    this.modificado = false;
    this.transformado = false;
    console.log('Cantidad de veces true intersects',i)
    // this.subControlBar.setVisible(false);
  }

  cortarPoligonos(line:Feature){
    console.log('Metodo cortarPoligonos: Recibe linea de corte', line);
    console.log('Features en drawnVectorSource:', this.drawnVectorSource.getFeatures()[0]);
    
    // Formato GeoJSON para OL
    const formatGJ = new GeoJSON();

    // const cuttingLine = line.getGeometry() as LineString;

    // GeoJSON de la linea dibujada (en lon/lat EPSG:4326) — compatible con Turf
    const lineGeoJSON = formatGJ.writeFeatureObject(line,{
      featureProjection: this.map.getView().getProjection(),
      dataProjection: 'EPSG:4326'
    });

    // Recorrer los poligonos dibujados para comprobar interseccion y cortar
    this.drawnVectorSource.getFeatures()!.forEach((feature:Feature)=>{
      // convertir la feature del polígono a GeoJSON en EPSG:4326 para Turf
      const polygonGeoJSON = formatGJ.writeFeatureObject(feature, {
        featureProjection: this.map.getView().getProjection(),
        dataProjection: 'EPSG:4326'
      });

      try {
        if (booleanIntersects(lineGeoJSON as any, polygonGeoJSON as any)) {
          console.log('Cortar polígono:', feature.get('name'));

          // const featureToPolygon = polygonize(lineGeoJSON as any);
          // console.log('Feature to Poligon',featureToPolygon);
          // Convertir El poligono a LineString para poder cortarlo
          const polygonToLines = polygonToLine(polygonGeoJSON as any);
          console.log('Poligon to Line:',polygonToLines);

          // Usar turf para cortar el polígono con la línea
          const featuresCortadas = lineSplit(polygonToLines as any, lineGeoJSON as any);
          console.log('Polígonos resultantes del corte:', featuresCortadas);
          // console.log('Geometria:',featuresCortadas.features[0].geometry);
          // let geometria = featuresCortadas.features[0].geometry;
          // let cood = geometria.coodinates;

          // Meto al ultimo poligono su
          console.log(featuresCortadas.features[2].geometry.coordinates[0],featuresCortadas.features[2].geometry.coordinates[3]);
          let coord1 = featuresCortadas.features[2].geometry.coordinates[0];
          // let coord2 = featuresCortadas.features[2].geometry.coordinates[3];
          featuresCortadas.features[2].geometry.coordinates.push(coord1);
          // console.log(featuresCortadas.features[2].geometry);

          // let line = new lineString(
          //   [
          //     [coord1.lon, coord1.lat],
          //     [coord2.lon, coord2.lat]
          //   ],
          //   {name:'Linea1'}
          // );

          // Paso los features a polygonize
          console.log('Features sin puntos y con puntos',featuresCortadas.features,...featuresCortadas.features);
          let poligonoUno = featureCollection([featuresCortadas.features[2],featuresCortadas.features[1],featuresCortadas.features[0]]);

          // Coger las lineas del primer polígono resultante y crear un nuevo polígono
          // const lineasUno = featuresCortadas.features[1];
          // console.log('Lineas del poligono Uno:',lineasUno)
          // Crear nuevo polígono a partir de las lineas
          const newPolygons = polygonize(poligonoUno);
          console.log('Nuevos polígonos tras corte:', newPolygons);

          // const newFeature2 = formatGJ.readFeature(lineasUno, {
          //     featureProjection: this.map.getView().getProjection(),
          //     dataProjection: 'EPSG:4326'
          //   });

          // console.log('Feature creado tras corte:', newFeature2 as Feature<Geometry>);

          // Eliminar el polígono original del source
          this.drawnVectorSource.removeFeature(feature);

          

          // // Pruebas para ver si los puedo pintar en el mapa
          // const newFeature1 = formatGJ.readFeature(featuresCortadas.features[0], {
          //     featureProjection: this.map.getView().getProjection(),
          //     dataProjection: 'EPSG:4326'
          //   });
          // const newFeature2 = formatGJ.readFeature(featuresCortadas.features[1], {
          //     featureProjection: this.map.getView().getProjection(),
          //     dataProjection: 'EPSG:4326'
          //   });
          //   const newFeature3 = formatGJ.readFeature(featuresCortadas.features[2], {
          //     featureProjection: this.map.getView().getProjection(),
          //     dataProjection: 'EPSG:4326'
          //   });
          
          // console.log('Features creados tras corte:', newFeature1 as Feature<Geometry>, newFeature2, newFeature3);
          // // newFeature1.getGeometry();

          // this.drawnVectorSource.addFeature(newFeature1 as Feature<Geometry>);
          // this.drawnVectorSource.addFeature(newFeature2 as Feature<Geometry>);
          // this.drawnVectorSource.addFeature(newFeature3 as Feature<Geometry>);

          // this.drawnVectorSource.refresh();

          // console.log('Features en drawnVectorSource tras corte:', this.drawnVectorSource.getFeatures());

          // Añadir los nuevos polígonos resultantes al source
          newPolygons.features.forEach((poly: any) => {
            const newFeature = formatGJ.readFeature(poly, {
              featureProjection: this.map.getView().getProjection(),
              dataProjection: 'EPSG:4326'
            });
            console.log('Polygonos ? Features:',poly,newFeature);
            // // Guardar estilo original
            // newFeature.set('__originalStyle', styleArray[0].polygon);
            // newFeature.setStyle(styleArray[0].polygon);
            this.drawnVectorSource.addFeature(newFeature as Feature<Geometry>);
          });
        }
      } catch (err) {
          console.warn('Intersection test failed', err);
      }
    });
    this.isDrawing = false;
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
