import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { AppToast, PageContentComponent, PageHeaderComponent, PageToolbarComponent, Toast } from '@rassini/rassini-ui';

import { AprobacionesApiService } from '../../../core/services/aprobaciones-api.service';
import { RutaResponse, TipoSolicitud } from '../../../core/models/domain.models';

@Component({
  selector: 'app-solicitud-nueva',
  standalone: true,
  imports: [PageHeaderComponent, PageToolbarComponent, PageContentComponent, AppToast, FormsModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, TextareaModule, RouterLink],
  templateUrl: './solicitud-nueva.html',
  styleUrl: './solicitud-nueva.scss'
})
export class SolicitudNuevaComponent implements OnInit {
  rutas: RutaResponse[] = [];

  model = {
    claveRuta: '',
    tipoSolicitud: 'ANTICIPO' as TipoSolicitud,
    descripcion: '',
    monto: null as number | null,
    referenciaExterna: ''
  };

  readonly tipoSolicitudOptions = [
    { label: 'ANTICIPO', value: 'ANTICIPO' },
    { label: 'REEMBOLSO', value: 'REEMBOLSO' },
    { label: 'FOLIO', value: 'FOLIO' },
    { label: 'OTRO', value: 'OTRO' }
  ];

  constructor(private readonly api: AprobacionesApiService, private readonly router: Router, private readonly toast: Toast) {}

  ngOnInit(): void {
    this.api.getRutas().subscribe({
      next: (data) => this.rutas = data,
      error: () => this.toast.warn('No se pudieron cargar las rutas.')
    });
  }

  crear(): void {
    if (!this.model.claveRuta) {
      this.toast.warn('Selecciona una ruta.');
      return;
    }

    this.api.crearSolicitud({
      claveRuta: this.model.claveRuta,
      tipoSolicitud: this.model.tipoSolicitud,
      descripcion: this.model.descripcion || undefined,
      monto: this.model.monto ?? undefined,
      referenciaExterna: this.model.referenciaExterna || undefined
    }).subscribe({
      next: (response) => {
        this.toast.success(`Solicitud creada con folio ${response.folio}`);
        this.router.navigate(['/solicitudes', response.id]);
      },
      error: (error) => {
        if (error.status === 401) {
          this.toast.error('Token expirado. Accede nuevamente desde el portal.');
        } else {
          this.toast.error('No se pudo crear la solicitud.');
        }
      }
    });
  }
}
