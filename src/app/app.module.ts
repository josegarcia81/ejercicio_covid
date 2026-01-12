// Angular Core //
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// PRIMENG //
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from "primeng/button";
import { ListboxModule } from 'primeng/listbox';
import { AutoCompleteModule } from 'primeng/autocomplete';

// Routing //
import { AppRoutingModule } from './app-routing.module';

// Componentes //
import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { AppLayersComponent } from './app-layers/app-layers.component'
import { AreaCalcComponent } from './area-calc/area-calc.component';

// NavBar Module //
import { NavBarModule } from './nav-bar/nav-bar.module';

// Lucide Icons //
import {  LucideAngularModule, 
          VectorSquare, 
          Minimize2, 
          Move, 
          Scissors,
          SquaresSubtract, 
          SquaresUnite, 
          SquaresExclude,
          FilePlusCorner,
          Trash2 
         } from 'lucide-angular';


@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    NavBarComponent,
    AppLayersComponent,
    AreaCalcComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    TableModule,
    CheckboxModule,
    ButtonModule,
    NavBarModule,
    ListboxModule,
    AutoCompleteModule,
    LucideAngularModule.pick({
      VectorSquare, 
      Minimize2, 
      Move, 
      Scissors, 
      SquaresSubtract, 
      SquaresUnite, 
      SquaresExclude, 
      FilePlusCorner,
      Trash2
    })
],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
