import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AppDialog, AppToast, DataTable, DataTableColumn, PageContentComponent, PageHeaderComponent, PageToolbarComponent, Toast } from '@rassini/rassini-ui';

import { AprobacionesApiService } from '../../../core/services/aprobaciones-api.service';
import { RutaTransicionRequest } from '../../../core/models/domain.models';

interface FilaTabla {
  id: number;
  claveRuta: string;
  descripcion: string;
  activa: boolean;
  activaTexto: string;
  procesoBpmTexto: string;
  desplegando?: boolean;
}

interface FilaTransicion {
  situacionActualCodigo: number | null;
  situacionAnteriorCodigo: number | null;
  situacionSiguienteCodigo: number | null;
  solicitarPassword: boolean;
}

interface OpcionSituacion {
  label: string;
  value: number;
}

const FIN = 0;

@Component({
  selector: 'app-admin-rutas',
  standalone: true,
  imports: [PageHeaderComponent, PageToolbarComponent, PageContentComponent, DataTable, AppDialog, AppToast, ButtonModule, SelectModule, InputTextModule, CheckboxModule, FormsModule],
  templateUrl: './admin-rutas.html',
  styleUrl: './admin-rutas.scss'
})
export class AdminRutasComponent implements OnInit {
  readonly columns: DataTableColumn[] = [
    { field: 'claveRuta', header: 'Código', sortable: true },
    { field: 'descripcion', header: 'Descripción', sortable: true },
    { field: 'activaTexto', header: 'Activa' },
    { field: 'procesoBpmTexto', header: 'Proceso BPM' },
    { field: 'actions', header: 'Acciones', type: 'actions' }
  ];

  filas: FilaTabla[] = [];
  situacionOptions: OpcionSituacion[] = [];
  siguienteOptions: OpcionSituacion[] = [];
  anteriorOptions: OpcionSituacion[] = [];

  dialogVisible = false;
  editandoId: number | null = null;
  guardando = false;

  form = { claveRuta: '', descripcion: '', activa: true };
  transiciones: FilaTransicion[] = [];

  constructor(
    private readonly api: AprobacionesApiService,
    private readonly toast: Toast,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarSituaciones();
  }

  get tituloDialog(): string {
    return this.editandoId === null ? 'Nueva ruta' : `Editar ruta ${this.form.claveRuta}`;
  }

  cargar(): void {
    this.api.getRutasAdmin().subscribe({
      next: (data) => {
        this.filas = data.map((ruta) => ({
          id: ruta.id,
          claveRuta: ruta.claveRuta,
          descripcion: ruta.descripcion,
          activa: ruta.activa,
          activaTexto: ruta.activa ? 'Sí' : 'No',
          procesoBpmTexto: this.textoProcesoBpm(ruta.procesoBpm)
        }));
        this.repintar();
      },
      error: (error) => this.toast.error(this.mensajeError(error, 'No fue posible obtener las rutas.'))
    });
  }

  desplegarBpmn(fila: FilaTabla): void {
    fila.desplegando = true;
    this.repintar();
    this.api.desplegarBpmnRuta(fila.id).subscribe({
      next: (ruta) => {
        fila.desplegando = false;
        this.toast.success(`Proceso BPMN de la ruta ${ruta.claveRuta} desplegado en Flowable.`);
        this.cargar();
      },
      error: (error) => {
        fila.desplegando = false;
        this.repintar();
        this.toast.error(this.mensajeError(error, `No fue posible desplegar el BPMN de la ruta ${fila.claveRuta}.`));
      }
    });
  }

  private textoProcesoBpm(proceso?: { desplegado: boolean; version?: number; suspendida: boolean }): string {
    if (!proceso?.desplegado) {
      return 'No desplegado';
    }
    return `v${proceso.version ?? '?'} · ${proceso.suspendida ? 'Suspendida' : 'Activa'}`;
  }

  abrirNueva(): void {
    this.editandoId = null;
    this.form = { claveRuta: '', descripcion: '', activa: true };
    this.transiciones = [this.filaVacia()];
    this.dialogVisible = true;
  }

  abrirEditar(fila: FilaTabla): void {
    this.api.getRutaAdminById(fila.id).subscribe({
      next: (detalle) => {
        this.editandoId = detalle.id;
        this.form = { claveRuta: detalle.claveRuta, descripcion: detalle.descripcion, activa: detalle.activa };
        this.transiciones = (detalle.transiciones ?? []).map((t) => ({
          situacionActualCodigo: t.situacionActual,
          situacionAnteriorCodigo: t.situacionAnterior ?? FIN,
          situacionSiguienteCodigo: t.situacionSiguiente ?? FIN,
          solicitarPassword: t.solicitarPassword
        }));
        if (this.transiciones.length === 0) {
          this.transiciones.push(this.filaVacia());
        }
        this.dialogVisible = true;
      },
      error: (error) => this.toast.error(this.mensajeError(error, 'No fue posible cargar la ruta.'))
    });
  }

  agregarFila(): void {
    this.transiciones.push(this.filaVacia());
  }

  quitarFila(indice: number): void {
    this.transiciones.splice(indice, 1);
  }

  cerrarDialog(): void {
    if (!this.guardando) {
      this.dialogVisible = false;
    }
  }

  guardar(): void {
    if (this.editandoId === null && !this.form.claveRuta.trim()) {
      this.toast.warn('Indica el código de la ruta.');
      return;
    }
    if (!this.form.descripcion.trim()) {
      this.toast.warn('Indica la descripción de la ruta.');
      return;
    }

    const transicionesEnviar = this.armarTransiciones();
    if (transicionesEnviar === null) {
      return;
    }

    if (this.form.activa) {
      if (transicionesEnviar.length === 0) {
        this.toast.warn('Una ruta activa requiere al menos una transición.');
        return;
      }
      const cubreInicial = transicionesEnviar.some(
        (t) => t.situacionActualCodigo === 20 || t.situacionActualCodigo === 60
      );
      if (!cubreInicial) {
        this.toast.warn('Una ruta activa debe tener una transición desde la situación inicial 20 ó 60.');
        return;
      }
    }

    this.guardando = true;
    const peticion = this.editandoId === null
      ? this.api.crearRutaAdmin({
          claveRuta: this.form.claveRuta.trim(),
          descripcion: this.form.descripcion.trim(),
          activa: this.form.activa,
          transiciones: transicionesEnviar
        })
      : this.api.actualizarRutaAdmin(this.editandoId, {
          descripcion: this.form.descripcion.trim(),
          activa: this.form.activa,
          transiciones: transicionesEnviar
        });

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.dialogVisible = false;
        this.toast.success(this.editandoId === null ? 'Ruta creada correctamente.' : 'Ruta actualizada correctamente.');
        this.cargar();
      },
      error: (error) => {
        this.guardando = false;
        this.toast.error(this.mensajeError(error, 'No fue posible guardar la ruta.'));
      }
    });
  }

  private filaVacia(): FilaTransicion {
    return { situacionActualCodigo: null, situacionAnteriorCodigo: null, situacionSiguienteCodigo: null, solicitarPassword: false };
  }

  private armarTransiciones(): RutaTransicionRequest[] | null {
    const resultado: RutaTransicionRequest[] = [];
    for (const fila of this.transiciones) {
      const estaVacia = fila.situacionActualCodigo === null
        && fila.situacionAnteriorCodigo === null
        && fila.situacionSiguienteCodigo === null
        && !fila.solicitarPassword;
      if (estaVacia) {
        continue;
      }
      if (fila.situacionActualCodigo === null) {
        this.toast.warn('Toda transición requiere una situación actual.');
        return null;
      }
      resultado.push({
        situacionActualCodigo: fila.situacionActualCodigo,
        situacionAnteriorCodigo: fila.situacionAnteriorCodigo === FIN ? null : fila.situacionAnteriorCodigo,
        situacionSiguienteCodigo: fila.situacionSiguienteCodigo === FIN ? null : fila.situacionSiguienteCodigo,
        solicitarPassword: fila.solicitarPassword
      });
    }
    return resultado;
  }

  private cargarSituaciones(): void {
    forkJoin({
      comprobaciones: this.api.getSituaciones('COMPROBACIONES'),
      folios: this.api.getSituaciones('FOLIOS')
    }).subscribe({
      next: ({ comprobaciones, folios }) => {
        const todas = [...comprobaciones, ...folios].sort((a, b) => a.codigo - b.codigo);
        this.situacionOptions = todas.map((situacion) => ({
          label: `${situacion.codigo} · ${situacion.descripcionCorta} (${situacion.tipoFlujo})`,
          value: situacion.codigo
        }));
        this.siguienteOptions = [...this.situacionOptions, { label: 'FIN · termina la ruta', value: FIN }];
        this.anteriorOptions = [{ label: '— sin anterior', value: FIN }, ...this.situacionOptions];
        this.repintar();
      },
      error: () => this.toast.warn('No fue posible cargar el catálogo de situaciones.')
    });
  }

  private repintar(): void {
    setTimeout(() => this.cdr.detectChanges());
  }

  private mensajeError(error: unknown, fallback: string): string {
    const http = error as { status?: number; error?: { message?: string } };
    if (http?.status === 401) {
      return 'Tu sesión expiró. Vuelve a entrar desde el portal.';
    }
    if (http?.status === 403) {
      return 'Se requieren permisos de administrador para esta operación.';
    }
    if (http?.status === 400 && http?.error?.message) {
      return http.error.message;
    }
    return fallback;
  }
}
