import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { AppToast, DataTable, DataTableColumn, PageContentComponent, PageHeaderComponent, PageToolbarComponent, Toast } from '@rassini/rassini-ui';

import { AprobacionesApiService } from '../../../core/services/aprobaciones-api.service';
import { SituacionResponse, TipoFlujo } from '../../../core/models/domain.models';

@Component({
  selector: 'app-catalogo-situaciones',
  standalone: true,
  imports: [PageHeaderComponent, PageToolbarComponent, PageContentComponent, DataTable, AppToast, ButtonModule, SelectModule, FormsModule],
  templateUrl: './catalogo-situaciones.html'
})
export class CatalogoSituacionesComponent {
  readonly columns: DataTableColumn[] = [
    { field: 'codigo', header: 'Código', sortable: true },
    { field: 'descripcionCorta', header: 'Descripción corta' },
    { field: 'descripcionLarga', header: 'Descripción larga' },
    { field: 'tipoFlujo', header: 'Tipo de flujo', sortable: true }
  ];

  tipoFlujo: TipoFlujo = 'COMPROBACIONES';
  situaciones: SituacionResponse[] = [];

  tipoOptions = [
    { label: 'COMPROBACIONES', value: 'COMPROBACIONES' },
    { label: 'FOLIOS', value: 'FOLIOS' }
  ];

  constructor(private readonly api: AprobacionesApiService, private readonly toast: Toast) {
    this.cargar();
  }

  cargar(): void {
    this.api.getSituaciones(this.tipoFlujo).subscribe({
      next: (data) => this.situaciones = data,
      error: () => this.toast.error('No fue posible consultar las situaciones.')
    });
  }
}
