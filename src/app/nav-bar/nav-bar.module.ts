
// Imports Generales Angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// Modulo routing // No se usa
import { NavBarRoutingModule } from './nav-bar-module-routing.module';
// Imports PrimeNg //
import { ButtonModule } from "primeng/button";
import { MessagesModule } from 'primeng/messages';
import { DialogModule } from 'primeng/dialog';
import { AccordionModule } from 'primeng/accordion';
import { SplitterModule } from 'primeng/splitter';
import { ToastModule } from 'primeng/toast';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ButtonModule,
    MessagesModule,
    NavBarRoutingModule,
    DialogModule,
    AccordionModule,
    SplitterModule,
    ToastModule,
    BrowserAnimationsModule
  ],
  exports: [
    CommonModule,
    ButtonModule,
    MessagesModule,
    DialogModule,
    AccordionModule,
    SplitterModule,
    ToastModule,
    BrowserAnimationsModule
  ]
})
export class NavBarModule { }
