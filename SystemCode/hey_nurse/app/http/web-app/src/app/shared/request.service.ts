import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { catchError, map, tap } from 'rxjs/operators';
import { Request } from '../models/request';
import * as _ from 'underscore';
import { RESTQueryResult } from '../models/util';
import { Observable, throwError } from 'rxjs';
import fileSaver from 'file-saver';
import * as mime from 'mime/lite';
@Injectable({ providedIn: 'root' })
export class RequestService {
  onResourceUpdated = new EventEmitter<Request>();
  constructor(
    private httpClient: HttpClient
  ) { }

  // Get data from "Query API" to display on Nurse-Dashboard
  getRequests(payload): Observable<RESTQueryResult<Request>> {
    let params = new HttpParams();
    _.keys(payload).forEach(key => {
      params = params.set(key, payload[key]);
    });
    return this.httpClient
      .get<RESTQueryResult<Request>>('http://localhost:4433/api/requests', { params })
      .pipe(map(r => new RESTQueryResult(r, m => new Request(m))));
  }

  // Write data from FormPopup to "Update API"
  appendNurseID(payload): Observable<Request> {
    return this.httpClient
      .patch('http://localhost:4433/api/requests', payload)
      .pipe(
        map(r => new Request(r)),
        tap(r => this.onResourceUpdated.emit(r))
      );
  }

  getAnalytics(query) {
    let params = new HttpParams();
    _.keys(query).forEach(key => {
      params = params.set(key, query[key]);
    });
    return this.httpClient
      .get<RESTQueryResult<{name: string, value: number}>>('http://localhost:4433/api/analyseData', { params });
  }

  exportToExcel(query, fileName): Observable<Blob> {
    let params = new HttpParams();
    _.keys(query).forEach(key => {
      params = params.set(key, query[key]);
    });
    return this.httpClient
      .get('http://localhost:4433/api/analyseData/excel', { params, responseType: 'blob' })
      .pipe(
        map(
          r => {
            this.saveFile(r, fileName);
            return r;
          }),
        catchError(err => {
          if (err instanceof HttpErrorResponse && err.error instanceof Blob && err.error.type === 'application/json') {
            return new Promise<any>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e: Event) => {
                try {
                  const errorMsg = JSON.parse((e.target as any).result);
                  reject(new HttpErrorResponse({
                    error: errorMsg,
                    headers: err.headers,
                    status: err.status,
                    statusText: err.statusText,
                    url: err.url
                  }));
                } catch (e) {
                  reject(err);
                }
              };
              reader.onerror = (e) => {
                reject(err);
              };
              reader.readAsText(err.error);
            });
          }
          return throwError(err);
        })
      );
  }

  saveFile(blob: Blob, fileName: string): void {
    if (/CriOS/.test(navigator.userAgent)) {
      const reader = new FileReader();
      reader.onload = (e) => location.href = (reader.result as string);
      reader.readAsDataURL(new Blob([blob], { type: mime.getType(fileName) }));
    } else {
      fileSaver.saveAs(blob, fileName);
    }
  }

}
