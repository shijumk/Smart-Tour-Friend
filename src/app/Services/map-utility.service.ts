import { Injectable } from '@angular/core';
import { CurrentGeoService } from './current-geo.service';
import { DrawMapService } from './draw-map.service';
import { MapConstants } from '../Constants/map-constants';

declare let L;
declare let tomtom;

@Injectable({
  providedIn: 'root'
})
export class MapUtilityService {

    public trafficOptions;
    public trafficFlowOptions;

    // map variables
    public map;
    public resultsList;
    public markers = [];
    public route;
    public placeVal;
    public markersLayer;
    public currPosLayer;
    public currGeoPosition = [];
    public mapConst: any = {};
    public priceArr;
    public tomtom: any;
    public L: any;
    public loaderElem;

    public locationsSubscription;

    constructor(public geoservice: CurrentGeoService, public drawmapsrvc: DrawMapService) {
        this.mapConst = new MapConstants();
    }

   /*
    * Create Map using tomtom sdk
    */
    createMap() {
        // Setting TomTom keys
        const key = this.mapConst.mapkey;
        tomtom.setProductInfo(this.mapConst.mapprodinfo, this.mapConst.mapsnapshot);
        tomtom.searchKey(key);
        tomtom.routingKey(key);

        this.trafficOptions = {
            style: 's3',
            refresh: 5000,
            key: key,
            diff: true
        };

        this.trafficFlowOptions = {
            key: key,
            refresh: 180000
        };
        this.map = tomtom.L.map('map', {
            key: key,
            basePath: '../assets/sdk',
            /* Not using traffic API as the network request is more and exceeds daily API limit */
            // traffic: this.trafficOptions,
            // trafficFlow: this.trafficFlowOptions,
            center: [12.7879934, 77.6512728],
            zoom: 2,
            source: 'raster'
        });

        this.tomtom = tomtom;
        this.L = L;

        this.markers = [];
        this.getCoordsService();

        this.markersLayer = L.tomTomMarkersLayer().addTo(this.map);
        this.currPosLayer = L.tomTomMarkersLayer().addTo(this.map);
        this.resultsList = tomtom.resultsList().addTo(this.map);
    }
   /*
    * Clearing Map Elements
    */
    clear(loaderElem) {
        this.loaderElem = loaderElem;
        this.resultsList.clear();
        this.markersLayer.clearLayers();
        this.currPosLayer.clearLayers();
    }
   /*
    * Clearing Map
    */
    clearMap() {
        const mapval = this.map;
        if (this.route) {
            mapval.removeLayer(this.route);
        }

        this.markers.forEach(function(marker) {
            mapval.removeLayer(marker);
        });
        this.markers = [];
    }

  /*
   * Prepare parameters for the search call
   */
    prepareServiceCall = (placeVal, searchName, queryValue, callFlag, coords) => {
        const selectedLangCode = 'en-US';
        const queryVal = (placeVal !== 'Your location' && !callFlag) ? placeVal : queryValue; // 'important tourist attraction';
        const minFuzzyValue = '1';
        const maxFuzzyValue = '2';
        const limitValue = '10';
        const viewValue = 'IN';
        const defaultOpts = {
            unwrapBbox: true
        };
        let call;

        call = this.tomtom[searchName](defaultOpts).query(queryVal);
        if (placeVal !== 'Your location' && !callFlag) {
            call = this.tomtom['fuzzySearch'](defaultOpts).query(queryVal);
            call = call.minFuzzyLevel(minFuzzyValue);
            call = call.maxFuzzyLevel(maxFuzzyValue);
        }
        call = call.language(selectedLangCode);

        if (!this.configureServiceCall(placeVal, call, callFlag, coords)) {
            return null;
        }

        return call
            .limit(limitValue)
            .view(viewValue);
    }
  /*
    * Adding more parameters for the search call
  */
    configureServiceCall(placeVal, call, callFlag, coords) {
        let coordinates;
        coordinates = this.getLatLng();
        if (placeVal !== 'Your location' && callFlag) {
            coordinates = coords;
        }
        if (placeVal === 'Your location' || callFlag) {
            call.radius(200000);
            if (coordinates) {
                call.center(coordinates);
            } else {
                return false;
            }
        }
        return true;
    }
    showLoader() {
        this.loaderElem.style.display = 'block';
    }

    hideLoader() {
        this.loaderElem.style.display = 'none';
    }

    isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

  /*
    * For getting optimized route
  */
    getRoute(placeVal, searchResponses, locations, computeBestOrder, routeRepresentation, coords) {
        this.showLoader();
        this.clearMap();
        this.placeVal = placeVal;

        let currentLocation;

        if (placeVal !== 'Your location') {
            currentLocation = coords;
        } else {
            currentLocation = this.getLatLng();
        }

        locations.unshift({
            lat: parseFloat(currentLocation[0]),
            lon: parseFloat(currentLocation[1])
        });


        const routing = this.tomtom.routing({
                traffic: false
            })
            .locations(locations)
            .routeRepresentation(routeRepresentation)
            .computeBestOrder(computeBestOrder);

        routing.go()
            .then((routeJson) => {
                const dataObj = {
                    tomtom: this.tomtom,
                    L: this.L,
                    map: this.map,
                    route: this.route,
                    markers: this.markers,
                    markersLayer: this.markersLayer,
                    currPosLayer: this.currPosLayer,
                    resultsList: this.resultsList,
                    currGeoPosition: this.getLatLng()
                };
                if (routeRepresentation === 'polyline') {
                    this.route = this.tomtom.L.geoJson(routeJson, {
                        style: {
                            color: '#06f',
                            opacity: 1
                        }
                    }).addTo(this.map);
                    this.drawmapsrvc.drawRoute(dataObj, searchResponses, locations, routeJson, placeVal, currentLocation);
                }
                this.hideLoader();
            }).catch(() => {
                this.hideLoader();
                // this.tomtom.messageBox({closeAfter: 3000}).setContent('An error occured, please try again').openOn(this.map);
            });
    }

    getCoordsService() {
        // var coords = [this.latInput.value, this.lonInput.value];
        // var coords = ["51.507351","-0.127758"]; //london
        // coords = ["12.7879934","77.6512728"]; //jigani

        let locCoords = [];
        this.geoservice.autoUpdate().subscribe({
            next(position) {
              locCoords = position['coords'];
            },
            error(msg) {
                console.log('Error Getting Location: ', msg);
            }
        });
        window.setTimeout(() => {
            this.currGeoPosition = locCoords;
        }, 5000);
        window.setInterval(() => {
            this.currGeoPosition = locCoords;
            if (this.placeVal === 'Your location') {
                this.drawmapsrvc.drawCurrentPosition(this.getLatLng());
            }
        }, 60000);
        return this.currGeoPosition;
    }

    getLatLng() {
        let coords = ['51.507351', '-0.127758'];
        if (this.currGeoPosition['latitude']) {
            coords = [this.currGeoPosition['latitude'].toFixed(7).toString(), this.currGeoPosition['longitude'].toFixed(7).toString()];
            return [coords[0].trim(), coords[1].trim()];
        } else {
            return coords;
        }
    }
}
