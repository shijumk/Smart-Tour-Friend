import { Component, OnInit } from '@angular/core';
import { MapUtilityService } from '../../Services/map-utility.service';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.scss']
})
export class MapViewComponent implements OnInit {

    constructor(public utilitysrvc: MapUtilityService) {}

    // @Input() tomtom;
    // @Input() L;

    ngOnInit() {
        // render Map
        this.utilitysrvc.createMap();
    }

}
