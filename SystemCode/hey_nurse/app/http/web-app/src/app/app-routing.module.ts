import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { HomeComponent } from './home/home.component';
import { HttpClientModule } from '@angular/common/http';
import { NursedashboardComponent } from './nursedashboard/nursedashboard.component';
import { AdminPanelPageComponent } from './admin/admin-panel/admin-panel.page';
import { AuthGuard } from './shared/auth-guard.service';
import { VerificationComponent } from './verification/verification.component';
import { AdminAnalyticsPageComponent } from './admin/admin-analytics/admin-analytics.page';
import { AdminGuard } from './shared/admin-guard.service';
const routes: Routes = [
  { path: '', redirectTo: '/admin', pathMatch:'full'},
  {
    path: 'dashboard',
    component: NursedashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    component: HomeComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'verification',
    component: VerificationComponent,
  },
  {
    path: 'admin',
    component: AdminPanelPageComponent,
    canActivate: [AuthGuard,AdminGuard],
  },
  {
    path: 'admin/:id/analytics',
    component: AdminAnalyticsPageComponent,
    canActivate: [AuthGuard,AdminGuard],
  },
  { path: 'login', component: LoginComponent },
  { path: 'password', component: SignupComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }),
    HttpClientModule,
  ],
  providers: [
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
