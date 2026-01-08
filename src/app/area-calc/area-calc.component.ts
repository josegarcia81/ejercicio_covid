import { Component, OnInit } from '@angular/core';
import { MapService } from '../services/map.service';

@Component({
  selector: 'app-area-calc',
  templateUrl: './area-calc.component.html',
  styleUrls: ['./area-calc.component.scss']
})
export class AreaCalcComponent implements OnInit {

  areaCalcResult: number | null = null;

  constructor(private _mapService:MapService) { }

  ngOnInit(): void {

    this._mapService.polArea$.subscribe(area => {
      this.areaCalcResult = area;
    });

  }

}
