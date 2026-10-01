import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { AppToast, PageContentComponent, PageHeaderComponent, PageToolbarComponent, Toast } from '@rassini/rassini-ui';

import { AprobacionesApiService } from '../../core/services/aprobaciones-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [PageHeaderComponent, PageToolbarComponent, PageContentComponent, AppToast, ButtonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  resumen = {
    rutas: '-',
    situacionesComprobaciones: '-',
    situacionesFolios: '-',
    solicitudes: '-'
  };

  constructor(private readonly api: AprobacionesApiService, private readonly toast: Toast) {}

  ngOnInit(): void {
    forkJoin({
      rutas: this.api.getRutas().pipe(catchError(() => of([]))),
      sitCom: this.api.getSituaciones('COMPROBACIONES').pipe(catchError(() => of([]))),
      sitFol: this.api.getSituaciones('FOLIOS').pipe(catchError(() => of([]))),
      solicitudes: this.api.getSolicitudes({ page: 0, size: 1 }).pipe(catchError(() => of({ content: [], page: 0, size: 1, totalElements: 0, totalPages: 0 })))
    }).subscribe({
      next: ({ rutas, sitCom, sitFol, solicitudes }) => {
        this.resumen.rutas = String(rutas.length || 0);
        this.resumen.situacionesComprobaciones = String(sitCom.length || 0);
        this.resumen.situacionesFolios = String(sitFol.length || 0);
        this.resumen.solicitudes = String(solicitudes.totalElements || 0);
      },
      error: () => {
        this.toast.warn('No fue posible cargar todos los indicadores del inicio.');
      }
    });
  }
}
