import { Component, OnInit } from '@angular/core';
import { MapService } from './services/map.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ejercicio_covid';

  public viewStates : boolean = true;
  public viewLayers : boolean = false;
  public viewAreaCalc : boolean = false;
  public selectedNavBar: string = '';

  constructor(private _mapService:MapService) { }

  ngOnInit(): void {
    console.log("AppComponent initialized");

    // Suscribirse a los cambios de la barra de navegacion
    this._mapService.navToShow$.subscribe(nav => {
      this.selectedNavBar = nav;
      console.log("Navegacion seleccionada:", this.selectedNavBar);
    });

  }

}
