import { Component, ViewChild, ElementRef, AfterViewInit  } from '@angular/core';
import { FormBuilder, FormGroup} from '@angular/forms';
import { MapUtilityService } from '../../Services/map-utility.service';
import { GetVenueIdService } from '../../Services/get-venue-id.service';

@Component({
  selector: 'app-map-input-form',
  templateUrl: './map-input-form.component.html',
  styleUrls: ['./map-input-form.component.scss']
})

export class MapInputFormComponent implements AfterViewInit {

    public inputMapForm: FormGroup;
    @ViewChild('loader') loader: ElementRef;

    public loaderElem;

    constructor(private formBuilder: FormBuilder, private utilitysrvc: MapUtilityService, private venueidsrvc: GetVenueIdService) {
        this.createForm();
    }

    ngAfterViewInit() {
        // Getting Loader Element
        this.loaderElem = this.loader.nativeElement;
    }

    /* Creating Search Form */
    createForm = () => {
        this.inputMapForm = this.formBuilder.group({
            query: [''],
            price: ['0'],
            place: ['']
        });
    }

    submitForm() {
        this.utilitysrvc.clear(this.loaderElem);
        this.utilitysrvc.clearMap();
        const formResponse = this.inputMapForm.value;
        const queryVal = (formResponse.query === '') ? 'important tourist attraction' : formResponse.query;
        let priceArr = [];
        if (Array.isArray(formResponse.price)) {
            priceArr = formResponse.price || [];
        } else {
            priceArr.push(formResponse.price);
        }
        const placeVal = (formResponse.place === '') ? 'Your location' : formResponse.place;

        if (!queryVal) {
            return false;
        }

        const selectedSearch = 'poiSearch';
        let callFlag = false;
        const searchCall = this.utilitysrvc.prepareServiceCall(placeVal, selectedSearch, queryVal, callFlag, null);
        if (!searchCall) {
            return false;
        }
        searchCall.go(async (geoResponses) => {
            if (formResponse.place !== '') {
                const coords = [];
                if (geoResponses.length) {
                    coords.push(geoResponses[0].position.lat.toFixed(7).toString());
                    coords.push(geoResponses[0].position.lon.toFixed(7).toString());
                }
                callFlag = true;
                const newCall = this.utilitysrvc.prepareServiceCall(placeVal, selectedSearch, queryVal, callFlag, coords);
                if (!newCall) {
                    return false;
                }
                newCall.go(async (countrygeoResp) => {
                    this.searchCurrentPos(countrygeoResp, priceArr, placeVal, coords);
                });
            } else {
                this.searchCurrentPos(geoResponses, priceArr, placeVal, null);
            }
        });
        return false;
    }

    /* Search places based on user input */
    searchCurrentPos = async (geoResponses, priceArr, placeVal, coords) => {
      const locations = [], promiseList = [], noSearchArr = [];
      let newResultArr = [];

      if (geoResponses.length > 0) {
          geoResponses.forEach((elem) => {
              locations.push(elem.position);
          });
          locations.length = (locations.length > 9) ? 9 : locations.length;
          geoResponses.length = locations.length;

          geoResponses.forEach((placedetail) => {
              promiseList.push(this.venueidsrvc.search(placedetail, false));
          });

          newResultArr = await Promise.all(promiseList);
          newResultArr.forEach((elem, index) => {
              if (!elem) {
                  noSearchArr.push(index);
              } else if (elem.venueHours === false) {
                noSearchArr.push(index);
              }
              let priceFlag;
              priceArr.forEach((priceElem) => {
                  priceFlag = true;
                  if (elem.venuePrice && (elem.venuePrice !== priceElem)) {
                      priceFlag = false;
                  }
              });
              if (!priceFlag) {
                noSearchArr.push(index);
              }
          });
          noSearchArr.forEach((index) => {
              geoResponses.splice(index, 1);
              locations.splice(index, 1);
          });
          this.utilitysrvc.getRoute(placeVal, geoResponses, locations, true, 'polyline', coords);
      } else {
          // this.resultsList.setContent('Results not found.');
      }
  }
}
