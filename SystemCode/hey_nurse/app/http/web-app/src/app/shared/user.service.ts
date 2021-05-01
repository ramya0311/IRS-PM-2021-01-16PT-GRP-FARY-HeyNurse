import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { User } from '../models/user';
import * as _ from 'underscore';
import { RESTQueryResult } from '../models/util';
import { Observable } from 'rxjs';
import * as moment from 'moment';
import { CookieService } from 'ngx-cookie-service';
import { SnackBarService } from './snackbar.service';
@Injectable({ providedIn: 'root' })
export class UserService {
  onResourceCreated = new EventEmitter<User>();
  onResourceEdited = new EventEmitter<User>();
  onUserLoaded: EventEmitter<User> = new EventEmitter();
  onUserLoggedIn: EventEmitter<boolean> = new EventEmitter();
  currentUser: User;
  constructor(
    private httpClient: HttpClient,
    private cookieService: CookieService,
    private snackbarService: SnackBarService
  ) {
    this.onUserLoaded.subscribe(user => {
      this.handleUserLoaded(user);
    });
  }

  handleUserLoaded(user: User): void {
    this.getLoggedInUser()
      .toPromise()
      .then(profile => {
        this.currentUser = _.extend({}, user, profile);
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.onUserLoggedIn.emit(true);
      })
      .catch(err => {
        this.handleLoginError(err);
        this.onUserLoggedIn.emit(false);
      });
  }

  handleLoginError(err: HttpErrorResponse) {
    this.snackbarService.pop(err.error.error, 'error');
  }

  getLoggedInUser(): Observable<User> {
    return this.httpClient.get('http://localhost:4433/api/session').pipe(
      map(res => new User(res))
    );
  }

  logout() {
    return this.httpClient.delete('http://localhost:4433/api/session');
  }


  createUser(payload): Observable<User> {
    return this.httpClient
      .post('http://localhost:4433/api/user', payload)
      .pipe(
        map(r => new User(r)),
        tap(r => this.onResourceCreated.emit(r))
      );
  }

  editUser(payload): Observable<User> {
    return this.httpClient
      .patch('http://localhost:4433/api/user', payload)
      .pipe(
        map(r => new User(r)),
        tap(r => this.onResourceEdited.emit(r))
      );
  }

  changePassword(payload): Observable<User> {
    return this.httpClient
      .patch('http://localhost:4433/api/password', payload)
      .pipe(
        map(r => new User(r)),
        tap(r => this.onResourceEdited.emit(r))
      );
  }

  deleteUser(userID): Observable<User> {
    return this.httpClient.
      delete<RESTQueryResult<User>>(`http://localhost:4433/api/${userID}/user`)
      .pipe(
        map(res => new User(res))
      );
  }

  getUserByID(userID: string): Observable<User> {
    return this.httpClient.
      get(`http://localhost:4433/api/${userID}/user`)
      .pipe(
        map(res => new User(res))
      );
  }

  getAllUsers(payload): Observable<RESTQueryResult<User>> {
    let params = new HttpParams();
    _.keys(payload).forEach(k => {
      params = params.set(k, payload[k]);
    });
    return this.httpClient.
      get<RESTQueryResult<User>>('http://localhost:4433/api/user', { params })
      .pipe(map(r => new RESTQueryResult(r, m => new User(m))));
  }

  sendVerificationEmail(payload) {
    return this.httpClient
        .post('http://localhost:4433/api/verification-email', payload);
  }

  verifyEmail(payload) {
    return this.httpClient
        .post('http://localhost:4433/api/verify-email', payload);
  }

  login(payload): void {
    this.httpClient
      .post<{ access_token: string, expires_at: number}>('http://localhost:4433/api/login', payload)
      .pipe(map(r => r))
      .subscribe(token => {
        this.cookieService.set('token', token.access_token, token.expires_at);
        this.currentUser = new User({
          access_token: token.access_token,
          expires_in: token.expires_at,
          expires_at: moment.unix(token.expires_at).format('DD MM YYYY hh:mm:ss'),
        });
        this.onUserLoaded.emit(this.currentUser);
      }, err => {
        console.log('err', err);
        this.handleLoginError(err);
      });
  }
}
