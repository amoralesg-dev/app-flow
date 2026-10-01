import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TimelineModule } from 'primeng/timeline';
import { TextareaModule } from 'primeng/textarea';
import { PasswordModule } from 'primeng/password';
import {
  AppConfirmDialog,
  AppDialog,
  AppToast,
  Dialog,
  PageContentComponent,
  PageHeaderComponent,
  PageToolbarComponent,
  Toast
} from '@rassini/rassini-ui';

import { AprobacionesApiService } from '../../../core/services/aprobaciones-api.service';
import { RutaTransicionResponse, SolicitudHistorialResponse, SolicitudResponse } from '../../../core/models/domain.models';

@Component({
  selector: 'app-solicitud-detalle',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PageHeaderComponent,
    PageToolbarComponent,
    PageContentComponent,
    AppToast,
    AppDialog,
    AppConfirmDialog,
    ButtonModule,
    TimelineModule,
    FormsModule,
    TextareaModule,
    PasswordModule
  ],
  templateUrl: './solicitud-detalle.html',
  styleUrl: './solicitud-detalle.scss'
})
export class SolicitudDetalleComponent implements OnInit {
  solicitud?: SolicitudResponse;
  historial: SolicitudHistorialResponse[] = [];
  transiciones: RutaTransicionResponse[] = [];

  passwordVisible = false;
  comentario = '';
  password = '';
  transicionSeleccionada?: RutaTransicionResponse;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly api: AprobacionesApiService,
    private readonly toast: Toast,
    private readonly dialog: Dialog,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.recargar();
  }

  recargar(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getSolicitudById(id).subscribe({
      next: (solicitud) => {
        this.solicitud = solicitud;
        this.repintar();
        this.cargarHistorialYTransiciones(id, solicitud);
      },
      error: (error) => this.mostrarError(error)
    });
  }

  private cargarHistorialYTransiciones(id: number, solicitud: SolicitudResponse): void {
    combineLatest([
      this.api.getHistorial(id),
      this.api.getTransicionesRuta(solicitud.claveRuta, solicitud.situacionActualCodigo)
    ]).subscribe({
      next: ([historial, transiciones]) => {
        this.historial = historial;
        this.transiciones = transiciones.filter((item) =>
          item.situacionSiguiente !== null && item.situacionSiguiente !== undefined
        );
        this.repintar();
      },
      error: (error) => this.mostrarError(error)
    });
  }

  private repintar(): void {
    setTimeout(() => this.cdr.detectChanges());
  }

  private mostrarError(error: { status?: number }): void {
    if (error.status === 401) {
      this.toast.error('Token no válido.');
    } else {
      this.toast.error('No se pudo obtener el detalle.');
    }
  }

  labelTransicion(item: RutaTransicionResponse): string {
    if (item.situacionSiguiente === 99) {
      return 'Cancelar';
    }
    if (item.situacionSiguiente === null || item.situacionSiguiente === undefined) {
      return 'Finalizar ruta';
    }
    if (item.situacionSiguiente > item.situacionActual) {
      return `Avanzar a ${item.situacionSiguiente}`;
    }
    return `Cambiar a ${item.situacionSiguiente}`;
  }

  solicitarTransicion(item: RutaTransicionResponse): void {
    this.transicionSeleccionada = item;
    this.comentario = '';
    this.password = '';

    if (item.solicitarPassword) {
      this.passwordVisible = true;
      return;
    }

    this.confirmarYEjecutar();
  }

  ejecutarDesdeDialogo(): void {
    this.passwordVisible = false;
    this.confirmarYEjecutar();
  }

  private confirmarYEjecutar(): void {
    if (!this.solicitud || !this.transicionSeleccionada) {
      return;
    }

    const destino = this.transicionSeleccionada.situacionSiguiente;
    if (destino === null || destino === undefined) {
      return;
    }

    this.dialog.confirm({
      header: 'Confirmar transición',
      message: `¿Deseas mover la solicitud al estado ${destino}?`,
      accept: () => {
        this.api.ejecutarTransicion(this.solicitud!.id, {
          situacionDestino: destino,
          comentario: this.comentario || undefined,
          password: this.password || undefined
        }).subscribe({
          next: () => {
            this.toast.success('Transición ejecutada correctamente.');
            this.recargar();
          },
          error: (error) => {
            if (error.status === 401) {
              this.toast.error('Token expirado. Ir a pantalla de acceso.');
              this.router.navigate(['/acceso']);
            } else {
              this.toast.error('No se pudo ejecutar la transición.');
            }
          }
        });
      }
    });
  }
}
