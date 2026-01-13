import { Component, OnInit } from '@angular/core';
import { MapService } from '../../../services/map.service';

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
      // Seguir Aqui
      if (layers.length > 0) {
        this.layers = layers;
      }
    });

    // this.layers = this._mapService.getLayerArray();
    // console.log('Layers desde LayerComponent',this.layers);
  }

  onClick(layer: any, $event: any, i: number) {
    console.log("AppLayersComponent - onClick", $event);
    console.log("Layer seleccionado:", layer, 'I:', i);
    console.log(this.layers);

    this._mapService.toggleLayerVisibility(layer);
  }

}
