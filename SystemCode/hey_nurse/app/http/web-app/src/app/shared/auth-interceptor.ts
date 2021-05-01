import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private cookieService: CookieService,private router: Router) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // add authorization header with basic auth credentials if available
        const userToken = this.cookieService.get('token');
        if (userToken) {
                
            request = request.clone({
                setHeaders: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': 'true',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
                    Authorization: `Bearer ${userToken}`
                }
            });
        }
        return next.handle(request).pipe(catchError(err => {
            if (err instanceof HttpErrorResponse) {
                if (err.status === 401) {
                    localStorage.clear();
                    this.cookieService.deleteAll();
                    this.router.navigate(['login']);
                }
              }
              return throwError(err.statusText);
        }));
    }
}