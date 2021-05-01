import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ModalComponent } from '../shared/modal.component';
import { RequestService } from '../shared/request.service';
import { Request } from '../models/request';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { List } from 'immutable';
import { PaginationPage } from '../shared/pagination/pagination.component';
import * as _ from 'underscore';
import * as moment from 'moment';
@Component({
  templateUrl: './nursedashboard.component.html',
  styleUrls: ['./nursedashboard.component.scss']
})

export class NursedashboardComponent implements OnInit, OnDestroy {
  @ViewChild('nurseModal', { static: true })
  public nurseModal: ModalComponent;
  newRequests: Request[];
  inProgressRequests: Request[];
  skip = 0;
  inProgressSkip = 0;
  limit = 10;
  pageSize = 10;
  pages = List<PaginationPage>();
  inProgressPages = List<PaginationPage>();
  taskForm: FormGroup;
  newRequestTimerSubscription: any;
  inProgressRequestTimerSubscription: any;
  currentTab = 'inProgress';
  constructor(private requestService: RequestService) { }

  ngOnInit(): void {
    this.taskForm = new FormGroup({
      _id: new FormControl('', [Validators.required]),
      req_nurse_id: new FormControl('', [Validators.required]),
      req_status: new FormControl('', [Validators.required]),
    });
    this.getRequest();
    this.getRequest(2);
    this.initializeTimer();
    this.requestService.onResourceUpdated.subscribe((request) => {
      const newRequestIndex = this.newRequests.findIndex(t => t._id === request._id);
      const inProgressRequestIndex = this.inProgressRequests.findIndex(t => t._id === request._id);
      if (newRequestIndex > -1) {
        this.newRequests.splice(newRequestIndex, 1);
        this.inProgressRequests.push(request);
      } else if (inProgressRequestIndex > -1) {
        this.inProgressRequests.splice(inProgressRequestIndex, 1);
      }
    });
  }
  initializeTimer() {
    if (!this.newRequestTimerSubscription) {
      this.newRequestTimerSubscription = setInterval(() => {
        this.skip = 0;
        this.getRequest();
      }, 15000);
    }

    if (!this.inProgressRequestTimerSubscription) {
      this.inProgressRequestTimerSubscription = setInterval(() => {
        this.inProgressSkip = 0;
        this.getRequest(2);
      }, 60000);
    }
  }
  // Get data from "Query API" to display on Nurse-Dashboard
  getRequest(progressStatus = 1): void {
    const payload = this.getPayload(progressStatus);
    this.requestService.getRequests(payload).subscribe(result => {
      if (progressStatus === 2 || progressStatus === 3) {
        this.inProgressPages = List(_.range(0, result.total, this.pageSize).map(i => ({
          number: (i / this.pageSize) + 1,
          start: i
        })));
        this.inProgressRequests = result.data;
      } else {
        this.pages = List(_.range(0, result.total, this.pageSize).map(i => ({
          number: (i / this.pageSize) + 1,
          start: i
        })));
        this.newRequests = result.data;
      }
    });
  }

  getPayload(progressStatus): any {
    let defaultPayload;
    switch (progressStatus) {
      case 1: defaultPayload = {function: 'OutstandingRequestsByPage', offset: this.skip, limit: this.limit};
              break;
      case 2: defaultPayload = { function: 'InProgressByPage', offset: this.inProgressSkip, limit: this.limit };
              break;
      default: defaultPayload =  { function: 'CompletedRequestsByPage', offset: this.inProgressSkip , limit: this.limit };
    }
    return defaultPayload;
  }


  // StartTask button: Add req_nurse_id, req_start_datetime & change status to "2"
  startTask(): void {
    this.requestService.appendNurseID(this.taskForm.value).subscribe(result => {
      this.closeModal();
    });

  }

  // tslint:disable-next-line:variable-name
  openModal(_id: string, req_status: number): void {
    this.nurseModal.open();
    this.taskForm.patchValue(
      { _id, req_status }
    );
  }

  closeModal(): void {
    this.taskForm.reset();
    this.nurseModal.close();
  }

  setStart(start: number): void {
    this.skip = start;
    this.getRequest();
  }

  setInProgressStart(start: number): void {
    this.inProgressSkip = start;
    this.getRequest(this.currentTab === 'inProgress' ? 2 : 3);
  }

  ngOnDestroy(): void {
    clearInterval(this.newRequestTimerSubscription);
    clearInterval(this.inProgressRequestTimerSubscription);
    this.newRequestTimerSubscription = null;
    this.inProgressRequestTimerSubscription = null;
    while (this.newRequestTimerSubscription !== null) {
      this.newRequestTimerSubscription = null;
    }
    while (this.inProgressRequestTimerSubscription !== null) {
      this.inProgressRequestTimerSubscription = null;
    }
  }

  toggleTab(currentTab): void {
    this.currentTab = currentTab;
    if (this.currentTab === 'inProgress') {
      if (!this.inProgressRequestTimerSubscription) {
        this.inProgressSkip = 0;
        this.getRequest(2);
        this.inProgressRequestTimerSubscription = setInterval(() => {
          this.inProgressSkip = 0;
          this.getRequest(2);
        }, 60000);
      }
    } else {
      clearInterval(this.inProgressRequestTimerSubscription);
      this.inProgressRequestTimerSubscription = null;
      while (this.inProgressRequestTimerSubscription !== null) {
        this.inProgressRequestTimerSubscription = null;
      }
      this.inProgressSkip = 0;
      this.getRequest(3);
    }
  }

  getLocalTime(time) {
    const local = moment.utc(time).local().format('DD/MM/YYYY hh:mm a');
    return local;
  }

}
