import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class SnackBarService {
  constructor(private mdSnackBar: MatSnackBar) { }

  pop(message: string, style?: 'success'|'warning'|'error', duration: number = 5000) {
    return this.mdSnackBar.open(message, undefined, {
      panelClass: [style],
      duration
    });
  }

  openFromComponent<T>(component: any, config?: MatSnackBarConfig) {
    return this.mdSnackBar.openFromComponent<T>(component, config);
  }

  openFromTemplate(template: any, config?: MatSnackBarConfig) {
    return this.mdSnackBar.openFromTemplate(template, {
      duration: 5000,
      panelClass: config ? config['panelClass'] : []
    });
  }
}
