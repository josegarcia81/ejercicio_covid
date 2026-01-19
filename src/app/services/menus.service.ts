import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenusService {

  private menuSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public menu$ = this.menuSubject.asObservable();

  constructor() { }


  /**
   * Description Alternar la visibilidad del menu.
   *
   * @param {boolean} menu 
   */
  toggleMenu(menu: boolean) {
    this.menuSubject.next(menu);
  }

}
