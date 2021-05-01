import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { SharedModule } from './shared/shared.module';
import { SignupComponent } from './signup/signup.component';
import { AdminPanelPageComponent } from './admin/admin-panel/admin-panel.page';
import { NursedashboardComponent } from './nursedashboard/nursedashboard.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './shared/auth-interceptor';
import { MomentPipe } from './shared/moment.pipe';
import { NgbModule, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { SpinnerComponent } from './shared/spinner.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { VerificationComponent } from './verification/verification.component';
import { AdminAnalyticsPageComponent } from './admin/admin-analytics/admin-analytics.page';
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    SignupComponent,
    AdminPanelPageComponent,
    NursedashboardComponent,
    MomentPipe,
    SpinnerComponent,
    AdminAnalyticsPageComponent,
    VerificationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    SharedModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgxChartsModule,
    MatSnackBarModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    NgbTooltipConfig
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
