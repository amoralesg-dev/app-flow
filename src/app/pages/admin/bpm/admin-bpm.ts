import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import {
  AppDialog,
  AppToast,
  DataTable,
  DataTableColumn,
  PageContentComponent,
  PageHeaderComponent,
  PageToolbarComponent,
  Toast
} from '@rassini/rassini-ui';

import { AprobacionesApiService } from '../../../core/services/aprobaciones-api.service';
import { BpmProcessDefinitionResponse, BpmProcessInstanceResponse, EstadoInstancia } from '../../../core/models/domain.models';

interface FilaProceso {
  id: string;
  key: string;
  name: string;
  claveRuta: string;
  version: number;
  estadoTexto: string;
  esUltimaVersion: boolean;
  fechaDespliegueTexto: string;
}

interface FilaInstancia {
  processInstanceId: string;
  folio: string;
  procesoTexto: string;
  claveRuta: string;
  solicitante: string;
  inicioTexto: string;
  finTexto: string;
  estado: string;
  estadoTexto: string;
  solicitudId?: number;
}

type AccionBpm = 'suspender' | 'activar';

const SIN_DATO = '—';

function formatearFecha(iso?: string): string {
  if (!iso) {
    return SIN_DATO;
  }
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) {
    return SIN_DATO;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(fecha.getDate())}/${pad(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
}

@Component({
  selector: 'app-admin-bpm',
  standalone: true,
  imports: [PageHeaderComponent, PageToolbarComponent, PageContentComponent, DataTable, AppDialog, AppToast, ButtonModule, SelectModule, InputTextModule, CheckboxModule, TextareaModule, FormsModule, SelectButtonModule],
  templateUrl: './admin-bpm.html',
  styleUrl: './admin-bpm.scss'
})
export class AdminBpmComponent {
  readonly opcionesPestana = [
    { label: 'Procesos desplegados', value: 'procesos' },
    { label: 'Instancias de proceso', value: 'instancias' }
  ];
  readonly opcionesEstado = [
    { label: 'Todas', value: 'todas' },
    { label: 'Activas', value: 'activas' },
    { label: 'Terminadas', value: 'terminadas' }
  ];

  readonly columnsProcesos: DataTableColumn[] = [
    { field: 'key', header: 'Proceso', sortable: true },
    { field: 'name', header: 'Nombre' },
    { field: 'claveRuta', header: 'Ruta' },
    { field: 'version', header: 'Versión', sortable: true },
    { field: 'estadoTexto', header: 'Estado' },
    { field: 'fechaDespliegueTexto', header: 'Desplegado' },
    { field: 'actions', header: 'Acciones', type: 'actions' }
  ];

  readonly columnsInstancias: DataTableColumn[] = [
    { field: 'folio', header: 'Folio', sortable: true },
    { field: 'procesoTexto', header: 'Proceso' },
    { field: 'claveRuta', header: 'Ruta' },
    { field: 'solicitante', header: 'Solicitante' },
    { field: 'inicioTexto', header: 'Inicio' },
    { field: 'finTexto', header: 'Fin' },
    { field: 'estadoTexto', header: 'Estado' },
    { field: 'actions', header: 'Acciones', type: 'actions' }
  ];

  pestana: 'procesos' | 'instancias' = 'procesos';

  procesos: FilaProceso[] = [];
  filtroProceso = '';
  todasVersiones = false;
  procesosCargando = false;

  instancias: FilaInstancia[] = [];
  filtroInstancia = '';
  estadoInstancia: EstadoInstancia = 'todas';
  instanciasCargando = false;
  page = 0;
  size = 10;
  totalRecords = 0;

  xmlVisible = false;
  xmlContenido = '';
  xmlProcesoLabel = '';
  xmlCargando = false;

  diagramaVisible = false;
  diagramaUrl?: string;
  diagramaProcesoLabel = '';
  diagramaCargando = false;

  accionVisible = false;
  accion: AccionBpm = 'suspender';
  accionFila?: FilaProceso;
  accionIncluirInstancias = false;
  accionEjecutando = false;

  cancelarVisible = false;
  cancelarInstancia?: FilaInstancia;
  cancelarMotivo = '';
  cancelarEjecutando = false;

  constructor(
    private readonly api: AprobacionesApiService,
    private readonly toast: Toast,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {
    setTimeout(() => this.cargarProcesos());
  }

  cambiarPestana(valor: string): void {
    this.pestana = valor as 'procesos' | 'instancias';
    if (this.pestana === 'procesos') {
      this.cargarProcesos();
    } else {
      this.page = 0;
      this.cargarInstancias();
    }
  }

  cargarProcesos(): void {
    this.procesosCargando = true;
    this.repintar();
    this.api.getProcessDefinitions({
      proceso: this.filtroProceso || undefined,
      todasVersiones: this.todasVersiones
    }).subscribe({
      next: (definiciones) => {
        this.procesos = definiciones.map((def) => ({
          id: def.id,
          key: def.processDefinitionKey,
          name: def.name,
          claveRuta: def.claveRuta ?? SIN_DATO,
          version: def.version,
          estadoTexto: def.suspendida ? 'Suspendida' : 'Activa',
          esUltimaVersion: def.esUltimaVersion,
          fechaDespliegueTexto: formatearFecha(def.fechaDespliegue)
        }));
        this.procesosCargando = false;
        this.repintar();
      },
      error: (error) => {
        this.procesosCargando = false;
        this.repintar();
        this.mostrarError(error, 'No fue posible obtener las definiciones de proceso.');
      }
    });
  }

  verXml(fila: FilaProceso): void {
    this.xmlProcesoLabel = `${fila.key} v${fila.version}`;
    this.xmlCargando = true;
    this.repintar();
    this.api.getProcessDefinitionXml(fila.id).subscribe({
      next: (xml) => {
        this.xmlContenido = xml;
        this.xmlVisible = true;
        this.xmlCargando = false;
        this.repintar();
      },
      error: (error) => {
        this.xmlCargando = false;
        this.repintar();
        this.mostrarError(error, 'No fue posible obtener el XML del proceso.');
      }
    });
  }

  verDiagrama(fila: FilaProceso): void {
    this.diagramaProcesoLabel = `${fila.key} v${fila.version}`;
    this.diagramaCargando = true;
    this.repintar();
    this.api.getProcessDefinitionDiagrama(fila.id).subscribe({
      next: (blob) => {
        if (blob.size === 0) {
          this.diagramaCargando = false;
          this.repintar();
          this.toast.warn('Este proceso no tiene diagrama disponible.');
          return;
        }
        if (this.diagramaUrl) {
          URL.revokeObjectURL(this.diagramaUrl);
        }
        this.diagramaUrl = URL.createObjectURL(blob);
        this.diagramaVisible = true;
        this.diagramaCargando = false;
        this.repintar();
      },
      error: (error) => {
        this.diagramaCargando = false;
        this.repintar();
        this.mostrarError(error, 'No fue posible generar el diagrama del proceso.');
      }
    });
  }

  abrirAccion(tipo: AccionBpm, fila: FilaProceso): void {
    this.accion = tipo;
    this.accionFila = fila;
    this.accionIncluirInstancias = false;
    this.accionVisible = true;
    this.repintar();
  }

  ejecutarAccion(): void {
    const fila = this.accionFila;
    if (!fila) {
      return;
    }
    this.accionEjecutando = true;
    this.repintar();
    const peticion = this.accion === 'suspender'
      ? this.api.suspenderProcessDefinition(fila.id, this.accionIncluirInstancias)
      : this.api.activarProcessDefinition(fila.id, this.accionIncluirInstancias);
    peticion.subscribe({
      next: (resultado) => {
        this.accionEjecutando = false;
        this.accionVisible = false;
        this.toast.success(this.accion === 'suspender'
          ? `Proceso ${resultado.processDefinitionKey} v${resultado.version} suspendido.`
          : `Proceso ${resultado.processDefinitionKey} v${resultado.version} activado.`);
        this.cargarProcesos();
      },
      error: (error) => {
        this.accionEjecutando = false;
        this.repintar();
        this.mostrarError(error, 'No fue posible cambiar el estado del proceso.');
      }
    });
  }

  onLazyLoadInstancias(evento: { first?: number | null; rows?: number | null }): void {
    this.page = Math.floor((evento.first ?? 0) / (evento.rows ?? this.size));
    this.size = evento.rows ?? this.size;
    this.cargarInstancias();
  }

  cargarInstancias(): void {
    this.instanciasCargando = true;
    this.repintar();
    this.api.getProcessInstances({
      proceso: this.filtroInstancia || undefined,
      estado: this.estadoInstancia,
      page: this.page,
      size: this.size
    }).subscribe({
      next: (pagina) => {
        this.instancias = pagina.content.map((inst) => ({
          processInstanceId: inst.processInstanceId,
          folio: inst.folio ?? SIN_DATO,
          procesoTexto: `${inst.processDefinitionKey} v${inst.processDefinitionVersion}`,
          claveRuta: inst.claveRuta ?? SIN_DATO,
          solicitante: inst.solicitanteUsername ?? SIN_DATO,
          inicioTexto: formatearFecha(inst.inicio),
          finTexto: formatearFecha(inst.fin),
          estado: inst.estado,
          estadoTexto: this.estadoLabel(inst.estado),
          solicitudId: inst.solicitudId
        }));
        this.totalRecords = pagina.totalElements;
        this.instanciasCargando = false;
        this.repintar();
      },
      error: (error) => {
        this.instanciasCargando = false;
        this.repintar();
        this.mostrarError(error, 'No fue posible obtener las instancias de proceso.');
      }
    });
  }

  verSolicitud(fila: FilaInstancia): void {
    if (fila.solicitudId !== undefined && fila.solicitudId !== null) {
      this.router.navigate(['/solicitudes', fila.solicitudId]);
    }
  }

  abrirCancelar(fila: FilaInstancia): void {
    this.cancelarInstancia = fila;
    this.cancelarMotivo = '';
    this.cancelarVisible = true;
    this.repintar();
  }

  ejecutarCancelacion(): void {
    const instancia = this.cancelarInstancia;
    if (!instancia) {
      return;
    }
    this.cancelarEjecutando = true;
    this.repintar();
    this.api.cancelarProcessInstance(instancia.processInstanceId, this.cancelarMotivo || undefined).subscribe({
      next: (mensaje) => {
        this.cancelarEjecutando = false;
        this.cancelarVisible = false;
        this.toast.success(mensaje || 'Instancia cancelada.');
        this.cargarInstancias();
      },
      error: (error) => {
        this.cancelarEjecutando = false;
        this.repintar();
        this.mostrarError(error, 'No fue posible cancelar la instancia.');
      }
    });
  }

  private estadoLabel(estado: string): string {
    if (estado === 'ACTIVA') {
      return 'Activa';
    }
    if (estado === 'CANCELADA') {
      return 'Cancelada';
    }
    if (estado === 'TERMINADA') {
      return 'Terminada';
    }
    return estado;
  }

  private mostrarError(error: { status?: number }, fallback: string): void {
    if (error.status === 401) {
      this.toast.error('Tu sesión expiró. Vuelve a entrar desde el portal.');
    } else if (error.status === 403) {
      this.toast.error('Se requieren permisos de administrador para esta operación.');
    } else {
      this.toast.error(fallback);
    }
  }

  private repintar(): void {
    setTimeout(() => this.cdr.detectChanges());
  }
}
