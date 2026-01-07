import { Component, OnInit } from '@angular/core';
import { MapService } from '../services/map.service';

@Component({
  selector: 'app-layers',
  templateUrl: './app-layers.component.html',
  styleUrls: ['./app-layers.component.scss']
})
export class AppLayersComponent implements OnInit {

  public layers: any[] = [];

  constructor(private _mapService: MapService) { }

  ngOnInit(): void {

    this._mapService.layerArray$.subscribe(layers => {
      this.layers = layers;
    })

    // this.layers = this._mapService.getLayerArray();
    // console.log('Layers desde LayerComponent',this.layers);
  }

  onClick($event: any) {
    console.log("AppLayersComponent - onClick", $event);
  }

}
