import { Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { CovidData } from '../models/CovidData.model';
import { StateInfo } from '../models/StateInfo.model';
import { BehaviorSubject, Observable } from 'rxjs';
// import popData from '../../assets/data/us-states-population.json'

export interface Population {
  name: string;
  population: string;
}

@Injectable({
  providedIn: 'root'
})
export class CovidDataService {
  // Subject para emitir estado para la visualizacion //
  private selectedStateSubject: BehaviorSubject<{codigo: string,
                                                value: boolean,
                                                }> = new BehaviorSubject<{codigo: string,
                                                                        value: boolean,
                                                                        }>({codigo: '', value: false});
  public selectedState$ = this.selectedStateSubject.asObservable();

  public activateCompare: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private resetStyleSubject: BehaviorSubject<{value: boolean,
                                              codigo: string,
                                              selected: boolean
                                            }> = new BehaviorSubject<{ value: boolean,
                                                                       codigo: string,
                                                                      selected: boolean
                                                                      }>({value: false, codigo: "",selected: false})
  public resetStyle$ = this.resetStyleSubject.asObservable();

  private resetStylesSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  public resetStyles$ = this.resetStylesSubject.asObservable();

  private countriesData: CovidData[] = [];
  private statesInfo: StateInfo[] = [];

  private urlCovidData = 'https://api.covidtracking.com/v1/states/current.json'
  private urlStatesInfo = 'https://api.covidtracking.com/v1/states/info.json'
  private urlPopulationData = 'assets/data/us-states-population.json';

  constructor(private _http: HttpClient) { 
    
  }

  /**
   * Description Peticion de datos a la API de covidTracking
   *
   * @returns {Observable<CovidData[]>} 
   */
  getCovidData(): Observable<CovidData[]> {
    // Realiza la petición HTTP y mapea los datos al modelo CovidData
    return this._http
      .get<any[]>(this.urlCovidData)// Se pone any[] porque no tenemos interfaz que lo capture, si creamos un interfaz para ello podemos definirlo hay
      .pipe(
        map(arr => arr.map(d => new CovidData(d.positive, d.state, d.total, d.positiveIncrease, d.hospitalizedCumulative, d.hospitalizedCurrently, d.totalTestResults, d.stateName='')))
      );
  }

  /**
   * Description Peticion de datos a la API de covidTracking
   *
   * @returns {*} 
   */
  getStatesInfo(){
    return this._http
      .get<any[]>(this.urlStatesInfo)// Se pone any[] porque no tenemos interfaz que lo capture, si creamos un interfaz para ello podemos definirlo hay
      .pipe(
        map(arr => arr.map(d => new StateInfo(d.state, d.name)))
      );
  }

  /**
   * Description Metodo que recibe el codigo de estado y un booleano para emitir y cambiar valores en nav-bar
   *
   * @param {string} stateCode 
   * @param {boolean} value 
   */
  setSelectedState(stateCode: string, value: boolean){
    // El if es para no reemitir el mismo valor y evitar bucles interminables
    // if(this.selectedStateSubject.value === stateName){
    //   return
    // }
    // Si habilito el control de bucles no me cambia el click
    this.selectedStateSubject.next({codigo : stateCode, value: value});
    // console.log("NEXT")
  }

  /**
   * Description Metodo que envia un true para activar la comparacion de estados en nav-bar
   *
   * @param {boolean} activated 
   */
  setCompare(activated: boolean){
    this.activateCompare.next(activated)
  }

  /**
   * Description Metodo que emite los valores necesarios para que desde el nav-bar se pueda cambiar el color del estado en map
   *
   * @param {boolean} activated 
   * @param {string} estado_codigo 
   * @param {boolean} select 
   */
  setOriginalStyle(activated:boolean, estado_codigo: string, select: boolean){

    this.resetStyleSubject.next({value: activated, codigo: estado_codigo, selected: select}); // Si la clave valor se llaman igual como en este caso selected: selected se puede omitir y dejar solo un selected
    
  }

  /**
   * Description Metodo que tras comparar estados en nav-bar emite para resetear todos los colores de estados a su original en el map
   *
   * @param {boolean} activated 
   */
  setOriginalStyles(activated:boolean){

    this.resetStylesSubject.next(activated);
    
  }

  /**
   * Description Metodo para cargar los datos de poblacion desde el json para usarlos en nav-bar
   *
   * @returns {Observable<Population[]>} 
   */
  getPopulationData(): Observable<Population[]>{
    // console.log("population")
    return this._http.get<Array<Population>>(this.urlPopulationData);
  }
  

}
