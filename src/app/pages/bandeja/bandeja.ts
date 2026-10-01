import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AppToast, DataTable, DataTableColumn, PageContentComponent, PageHeaderComponent, PageToolbarComponent, Toast } from '@rassini/rassini-ui';

import { AprobacionesApiService } from '../../core/services/aprobaciones-api.service';
import { SolicitudResponse } from '../../core/models/domain.models';

@Component({
  selector: 'app-bandeja',
  standalone: true,
  imports: [PageHeaderComponent, PageToolbarComponent, PageContentComponent, DataTable, AppToast, ButtonModule],
  templateUrl: './bandeja.html',
  styleUrl: './bandeja.scss'
})
export class BandejaComponent implements OnInit {
  readonly columns: DataTableColumn[] = [
    { field: 'folio', header: 'Folio' },
    { field: 'solicitante', header: 'Solicitante' },
    { field: 'situacionActualDescripcion', header: 'Situación' },
    { field: 'actions', header: 'Acciones', type: 'actions' }
  ];

  solicitudes: SolicitudResponse[] = [];

  constructor(
    private readonly api: AprobacionesApiService,
    private readonly router: Router,
    private readonly toast: Toast
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.getSolicitudes({ page: 0, size: 50 }).subscribe({
      next: (response) => this.solicitudes = response.content,
      error: (error) => {
        if (error.status === 401) {
          this.toast.error('Tu token venció.');
        } else {
          this.toast.error('No se pudo cargar la bandeja.');
        }
      }
    });
  }

  verDetalle(row: SolicitudResponse): void {
    this.router.navigate(['/solicitudes', row.id]);
  }
}
