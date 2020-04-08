import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing';

import { MapViewComponent } from './map-view.component';
import { Observable } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';



describe('MapViewComponent', () => {
 // let component: MapViewComponent;
//  let fixture: ComponentFixture<MapViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    //  imports: [HttpClientTestingModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        MapViewComponent
      ]
    }).compileComponents();
  }));


  // beforeEach(() => {
  //   fixture = TestBed.createComponent(MapViewComponent);
  //   component = fixture.componentInstance;
  //   fixture.detectChanges();
  // });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });

  it('ngInit should get contractNr from history else from getStorageContractNr', inject([MapViewComponent], cmp => {

    spyOn(cmp, 'getOverviewData');
    spyOn(cmp.ContractSvc, 'getStorageContractNr').and.returnValue('123456');

    const spyiedCase = spyOn(cmp.route, 'paramMap');
    spyiedCase.and.returnValue(new Observable());
    cmp.ngOnInit();
    expect(cmp.getOverviewData).toHaveBeenCalled();
  }));

});
