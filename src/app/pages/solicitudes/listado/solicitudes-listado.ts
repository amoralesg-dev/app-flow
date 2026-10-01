import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { AppToast, DataTable, DataTableColumn, PageContentComponent, PageHeaderComponent, PageToolbarComponent, Toast } from '@rassini/rassini-ui';

import { AprobacionesApiService } from '../../../core/services/aprobaciones-api.service';
import { SolicitudResponse, TipoFlujo } from '../../../core/models/domain.models';

@Component({
  selector: 'app-solicitudes-listado',
  standalone: true,
  imports: [PageHeaderComponent, PageToolbarComponent, PageContentComponent, DataTable, AppToast, ButtonModule, SelectModule, FormsModule, InputTextModule, RouterLink],
  templateUrl: './solicitudes-listado.html',
  styleUrl: './solicitudes-listado.scss'
})
export class SolicitudesListadoComponent implements OnInit {
  readonly columns: DataTableColumn[] = [
    { field: 'folio', header: 'Folio', sortable: true },
    { field: 'tipoSolicitud', header: 'Tipo', sortable: true },
    { field: 'tipoFlujo', header: 'Flujo', sortable: true },
    { field: 'solicitante', header: 'Solicitante', sortable: true },
    { field: 'situacionActualDescripcion', header: 'Situación actual' },
    { field: 'actions', header: 'Acciones', type: 'actions' }
  ];

  solicitudes: SolicitudResponse[] = [];
  totalRecords = 0;
  loading = false;

  page = 0;
  rows = 10;

  tipoFlujo: TipoFlujo | '' = '';
  situacion: number | null = null;

  flujoOptions = [
    { label: 'Todos', value: '' },
    { label: 'COMPROBACIONES', value: 'COMPROBACIONES' },
    { label: 'FOLIOS', value: 'FOLIOS' }
  ];

  constructor(
    private readonly api: AprobacionesApiService,
    private readonly router: Router,
    private readonly toast: Toast
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.api.getSolicitudes({ tipoFlujo: this.tipoFlujo, situacion: this.situacion, page: this.page, size: this.rows }).subscribe({
      next: (response) => {
        this.solicitudes = response.content;
        this.totalRecords = response.totalElements;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 401) {
          this.toast.error('Sesión no válida. Ingresa nuevamente desde el portal.');
        } else {
          this.toast.error('No fue posible cargar solicitudes.');
        }
      }
    });
  }

  onPage(event: any): void {
    this.page = event.page ?? 0;
    this.rows = event.rows ?? this.rows;
    this.cargar();
  }

  verDetalle(row: SolicitudResponse): void {
    this.router.navigate(['/solicitudes', row.id]);
  }
}
