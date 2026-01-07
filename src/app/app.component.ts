import { Component, OnInit } from '@angular/core';

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
  public selectedNavBar: string = 'layers';

  ngOnInit(): void {
    console.log("AppComponent initialized");
  }

}
