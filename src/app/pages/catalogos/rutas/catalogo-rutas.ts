import { ChangeDetectorRef, Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AppDialog, AppToast, DataTable, DataTableColumn, PageContentComponent, PageHeaderComponent, PageToolbarComponent, Toast } from '@rassini/rassini-ui';

import { AprobacionesApiService } from '../../../core/services/aprobaciones-api.service';
import { RutaResponse, RutaTransicionResponse } from '../../../core/models/domain.models';

@Component({
  selector: 'app-catalogo-rutas',
  standalone: true,
  imports: [PageHeaderComponent, PageToolbarComponent, PageContentComponent, DataTable, AppDialog, AppToast, ButtonModule],
  templateUrl: './catalogo-rutas.html',
  styleUrl: './catalogo-rutas.scss'
})
export class CatalogoRutasComponent {
  readonly columns: DataTableColumn[] = [
    { field: 'claveRuta', header: 'Código', sortable: true },
    { field: 'descripcion', header: 'Descripción', sortable: true },
    { field: 'actions', header: 'Acciones', type: 'actions' }
  ];

  rutas: RutaResponse[] = [];

  get rutasVisibles(): RutaResponse[] {
    return this.rutas;
  }

  showDetalle = false;
  detalleRuta = '';
  transiciones: RutaTransicionResponse[] = [];

  constructor(
    private readonly api: AprobacionesApiService,
    private readonly toast: Toast,
    private readonly cdr: ChangeDetectorRef
  ) {
    setTimeout(() => this.cargar());
  }

  cargar(): void {
    this.api.getRutas().subscribe({
      next: (data) => {
        this.rutas = data;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => this.toast.error('No fue posible obtener rutas.')
    });
  }

  verTransiciones(ruta: RutaResponse): void {
    this.api.getTransicionesRuta(ruta.claveRuta).subscribe({
      next: (items) => {
        this.detalleRuta = `${ruta.claveRuta} - ${ruta.descripcion}`;
        this.transiciones = items;
        this.showDetalle = true;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => this.toast.warn(`No fue posible cargar las transiciones de la ruta ${ruta.claveRuta}.`)
    });
  }

  etiquetaSituacion(codigo: number | null | undefined, esAnterior: boolean): string {
    if (codigo === null || codigo === undefined) {
      return esAnterior ? '—' : 'FIN';
    }
    return String(codigo);
  }
}
