// Clase que carga la barra lateral izquierda en la app pral.
// Importaciones Angular
import { NgIf } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
// Servicios
import { CovidDataService, Population } from '../services/covid-data.service';
import { MessageService } from 'primeng/api';
// Modelos
import { CovidData } from '../models/CovidData.model';
import { StateInfo } from '../models/StateInfo.model';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
  providers: [MessageService]
})
export class NavBarComponent implements OnInit, AfterViewInit {
  
  // Datos para la tabla
  public statesInfo:StateInfo[] = [];
  // public checked: boolean = false;
  // public binary: boolean = true;
  public color: string = 'black';
  // public inputId: string = '';
  // public value1: StateInfo[] = [];
  
  // Control detail view
  public visible: boolean = false;
  public headerName!: string;
  public covidDataArray: CovidData[] = [];
  public totalCases!: number;
  public newCases!: number;
  public totalHosp!: number;
  public currentHosp!: number;
  public totalTest!: number;
  // ngIf al comparar
  public comparar: boolean = false;
  public population: Population[] = []
  public porcentajeCasos: Number = 0;
  public porcentajeHosp: Number = 0;
  public estado1:number = 0;
  public estado:number = 0;
  public classChange:boolean = false; 
  // Botones
  public rounded: any = true;
  public text: boolean = true;

  // Array compare // Comparacion
  public compareArray: CovidData[] = [];
  public messages: any = [{error:'Error message'}];
  public compareOk: boolean = false;

  public dialogStyles = { 
    'width': '70rem', 
    'display': 'flex', 
    'flex-direction': 'column'
  }
  

  // Constructor //
  constructor(
    private _covidData:CovidDataService,
    private _messageService: MessageService  
  ) { }
  // Carga de los datos a usar desde los servicios
  ngOnInit(): void {
    // Obtener datos de la API
    // this._covidData.getCovidData().subscribe(countries => {
    //   this.data = countries; // CovidData[] ya mapeado en el servicio
    // });

    // Obtener datos de la API Nombre e Iniciales
    this._covidData.getStatesInfo().subscribe(statesInfo => {
      this.statesInfo = statesInfo; // CovidData[] ya mapeado en el servicio
      console.log('Nav-Bar statesInfo',this.statesInfo);
      
    });

    // Obtener datos Covid completos de cada estado
    this._covidData.getCovidData().subscribe(covidData => {
      this.covidDataArray = covidData; // CovidData[] ya mapeado en el servicio
      console.log('Nav-Bar Covid data array',this.covidDataArray);
      
      // Insertar el nombre de cada estado
      this.statesInfo.forEach((state, index)=>{
        this.covidDataArray[index].setStateName(state.name);
        // console.log('Covid data name',state.name);
      })
      // Obtener datos de poblacion del Json en essets/data
      this._covidData.getPopulationData().subscribe(data => {
        this.population = data
        // console.log(this.population)

        // Insertar los datos de poblacion a cada estado
        this.population.forEach((pop,index)=>{
          let population = Number(pop.population);
          let totalCases = this.covidDataArray[index].getTotal();
          let totalHosp = this.covidDataArray[index].getHospitalizedCumulative();

          this.covidDataArray[index].setPopulation(population);
          this.covidDataArray[index].setCasePerc(this.getPorcentaje(population, totalCases));
          this.covidDataArray[index].setHospPerc(this.getPorcentaje(population, totalHosp));
        // this.compareArray.find((item)=>item.getStateName() === pop.name)
        })
      });
    
    });

  }

  // Leer si en el componente map se ha seleccionado un estado
  // y marcarlo en el checkbox y aniadir a array de comparacion
  ngAfterViewInit(){
    
    // Suscricion a selectedState$ para controlar el estado que se clica desde map
    this._covidData.selectedState$.subscribe((stateCode) => {
      if (!!stateCode) {
        //REVISAR AQUI
        //console.log('NavBar componente - Estado seleccionado: ' + typeof(stateName));
        const stCode:string = stateCode;
        console.log('Desde NavBar - State code: ' + stateCode);
        // Buscar el estado emitido
        const stateData = this.statesInfo.find(state => state.state === stCode);
        // Buscar en indice en el array
        const index = this.statesInfo.findIndex(state => state.state === stCode);
        // Cambiar estado del selected para que aparezca o no el checkbox
        console.log(this.statesInfo, index);
        this.statesInfo[index].selected = this.statesInfo[index].selected ? false : true ;
        
          // Si el indice es valido
        if(index !== -1){
          // Elimino el elemento 
          this.statesInfo.splice(index, 1);
          // lo meto el primero
          this.statesInfo = [stateData as StateInfo, ...this.statesInfo]
          // console.log(this.statesInfo);
  
          // console.log('Indice del estado seleccionado: ' + index);
          // console.log('Estado cambiado: ' + stateData?.name);
          // this.statesInfo[0].selected = true;
  
          // Cambiar estado del selected para que aparezca o no el checkbox
              // this.statesInfo[0].selected = this.statesInfo[0].selected ? false : true ;
          // console.log(this.statesInfo[0].selected)
  
          // Meter el elemento en el array si no esta
          const match = this.compareArray.find((item) => item.getState() === stateData!.state);
          if(this.statesInfo[0].selected && !match){
            // console.log(this.compareArray.length)
            this.arrayComparacion(stateData , index)
          } else {
            this.compareArray.forEach((item, index) => {
              if(item.getState() === stateData!.state){
                this.compareArray.splice(index, 1);
              }
            })
          }
          //this.compareArray.push(this.covidDataArray.find(item => item.getState() === this.statesInfo[0].state)!);
        }
        console.log('NAV-BAR-STATES-INFO: ',this.statesInfo);
      }
    });

    // Activar metodo compare desde el componente mapa
    this._covidData.activateCompare.subscribe((active)=>{
      if(active) this.compare();
    })
    
  }
  //// CHECKBOX ////
  // Pertenece al evento de seleccionar casillas CHECKBOX //
  onClick(state:any, event:any,i:number){
    // console.log(state)
    // console.log(state.state);
    // console.log('Click desde el checkbox',state.selected);

    // Se emite el estado para ponerlo de color rosado en el mapa
    const match = this.compareArray.find((item) => item.getState() === state.state);
    //console.log('Encontrado:' + match);

    if(state.selected && !match){
      this.arrayComparacion(state , i)
    } else {
      this.compareArray.forEach((item, index) => {
        if(item.getState() === state.state){
          this.compareArray.splice(index, 1);
          
        }
      })
    }
    this._covidData.setOriginalStyle(true,state.state,state.selected)
    console.log("Array de comparacion:", this.compareArray);
    console.log('Click desde el checkbox-NAV',state.selected);
  }
  
  // Pertenece al evento de hacer click en el ojo / Visualizacion de detalles //
  /**
   * Description placeholder Pertenece al evento de hacer click en el ojo Visualizacion de detalles
   * 
   * @param {*} state 
   * @param {*} event 
   * @param {number} i 
   */
  detail(state:any, event:any,i:number){
    console.log("Detalle del estado:", state);

    
    console.log("Array de comparacion:", this.compareArray);
    // Nombre del header recogido de los datos que vienen del front
    this.headerName = state.name;
    // Buscar si el estado ya esta en el array de comparacion
    const match = this.compareArray.find((item) => item.getState() === state.state);
    // this.compareOk = this.compareOk ? false: false;
    if(match){
      this.compareArray=[]
      this.arrayComparacion(state , i)
      this.compareOk = true;
      state.__selected=true;
      // this.covidDataArray[i].setStateName(state.name)
      // this.compareArray.push(this.covidDataArray.find(item => item.getState() === state.state)!);
      console.log("Array de comparacion:", this.compareArray);
      this.compareOk = true;
      state.__selected=true;
      console.log('Opcion1')
    } else if(!match) {
      this.compareArray=[]
      this.arrayComparacion(state , i)
      this.compareOk = true;
      state.__selected=true;
      console.log('Opcion2')
    } else{
      this.compareOk = false;
      state.__selected=false;
      console.log('Opcion3')
    }
    this.visible = this.visible ? false : true;
    console.log(this.visible)
  }

  // Accion de boton comparar Estados
  compare(){

    //     PIPE AQUI O EN EL HTML
    // const value = 0.03;
    // console.log(this.percentPipe.transform(value)); // 3%
    // console.log(this.percentPipe.transform(value, '1.2-3')); // 3.00%
    // console.log(this.percentPipe.transform(value, '2.2-3', 'en_GB')); // 03.00%
    // 

    // Nombre del header
    this.headerName = "Comparación de Estados";
    // Longitud del array de comparacion
    let comp = this.compareArray.length
    
    // Si es menos de 2 suelta error (toast)
    if(comp < 2){
      // El toast usa un servicio de mensajes de primeng
      this._messageService.add({severity:'error', summary:'Error', detail:'Seleccione al menos dos estados para comparar.'});
      this.compareOk = false;
      this.visible=false;
    }else{
      // this.visible = true;
      this.comparar = true;
      this.visible = this.visible ? false : true;
      this.compareOk = true;
      console.log("Estados a comparar:", this.compareArray);      
    }
  }

  // Reset del array de comparacion al pulsar ok
  resetArray(){
    //this.compareArray.splice(this.compareArray.length-1, 1);
    this.compareArray = [];
    this.compareOk = false;
    this.visible = false;
    // console.log("Array: ", this.compareArray);
    this.statesInfo.forEach(state=>state.selected=false)
    // Avisar al servicio para resetear estilos en mapa
    this._covidData.setOriginalStyles(true)
  }
  // Relleno del array de comparacion
  /**
   * Description Relleno del array de comparacion
   *
   * @param {*} state 
   * @param {number} i 
   */
  arrayComparacion(state:any , i:number){
    // Setear nombre del estado.
    // console.log('Desde Nav-Bar Setear nombre del estado',state.name)
    // console.log('comapreArray Index',i)
    //this.covidDataArray[i].setStateName(state.name)
    //this.covidDataArray[i].setStateName(state.name)
    this.compareArray.push(this.covidDataArray.find(item => item.getState() === state._state)!)
    
    // Setear nombre del estado.
  }
  
  /**
   * Description placeholder
   *
   * @param {number} population 
   * @param {number} total 
   * @returns {number} 
   */
  getPorcentaje(population: number, total: number){
    // population => const pop = coun?.getPopulation() ?? 0;
    if (!population) return 0;
    let result = (total * 100) / population;
    // console.log(result);
    return result;
  }
  
  compararDosEstadosCase(i:number){
    const dato1 = this.compareArray[0].getCasePerc()
    const dato2 = this.compareArray[1].getCasePerc()

    if (this.compareArray.length === 2 && i === 0){
      return dato1! > dato2! ? 'rojo' : 'verde';
    } else if(this.compareArray.length === 2 && i === 1){
      return dato1! < dato2! ? 'rojo' : 'verde';
    } else{
      return '';
    }
    
  }
  compararDosEstadosHosp(i:number){
    const dato1 = this.compareArray[0].getHospPerc()
    const dato2 = this.compareArray[1].getHospPerc()

    if (this.compareArray.length === 2 && i === 0){
      return dato1! > dato2! ? 'rojo' : 'verde';
    } else if(this.compareArray.length === 2 && i === 1){
      return dato1! < dato2! ? 'rojo' : 'verde';
    } else{
      return '';
    }
    
  }

}
