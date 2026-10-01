export type TipoFlujo = 'COMPROBACIONES' | 'FOLIOS';
export type TipoSolicitud = 'ANTICIPO' | 'REEMBOLSO' | 'FOLIO' | 'OTRO';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface SituacionResponse {
  codigo: number;
  descripcionCorta: string;
  descripcionLarga: string;
  tipoFlujo: TipoFlujo;
}

export interface RutaResponse {
  claveRuta: string;
  descripcion: string;
}

export interface RutaTransicionAdmin {
  id?: number;
  situacionActual: number;
  situacionAnterior?: number | null;
  situacionSiguiente?: number | null;
  solicitarPassword: boolean;
}

export interface RutaAdminResponse {
  id: number;
  claveRuta: string;
  descripcion: string;
  activa: boolean;
  procesoBpm?: BpmProcesoRutaResponse;
  transiciones?: RutaTransicionAdmin[];
}

export interface BpmProcesoRutaResponse {
  desplegado: boolean;
  processDefinitionId?: string;
  processDefinitionKey?: string;
  version?: number;
  suspendida: boolean;
  fechaDespliegue?: string;
}

export interface BpmProcessDefinitionResponse {
  id: string;
  processDefinitionKey: string;
  name: string;
  claveRuta?: string;
  version: number;
  deploymentId: string;
  resourceName: string;
  suspendida: boolean;
  esUltimaVersion: boolean;
  fechaDespliegue?: string;
}

export interface BpmProcessInstanceResponse {
  processInstanceId: string;
  processDefinitionId: string;
  processDefinitionKey: string;
  processDefinitionName: string;
  processDefinitionVersion: number;
  inicio?: string;
  fin?: string;
  estado: string;
  motivo?: string;
  solicitudId?: number;
  folio?: string;
  claveRuta?: string;
  solicitanteUsername?: string;
  situacionActualCodigo?: number;
  situacionActualDescripcion?: string;
  solicitudActiva?: boolean;
}

export interface BpmTaskResponse {
  id: string;
  name: string;
  taskDefinitionKey: string;
  assignee?: string;
  fechaCreacion?: string;
}

export interface BpmProcessInstanceDetailResponse {
  processInstanceId: string;
  processDefinitionId: string;
  processDefinitionKey: string;
  processDefinitionName: string;
  processDefinitionVersion: number;
  inicio?: string;
  fin?: string;
  duracionMs?: number;
  estado: string;
  motivo?: string;
  tareasActivas: BpmTaskResponse[];
  solicitud?: SolicitudResponse;
  historial: SolicitudHistorialResponse[];
}

export type EstadoInstancia = 'todas' | 'activas' | 'terminadas';

export interface RutaTransicionRequest {
  situacionActualCodigo: number;
  situacionAnteriorCodigo?: number | null;
  situacionSiguienteCodigo?: number | null;
  solicitarPassword: boolean;
}

export interface CrearRutaAdminRequest {
  claveRuta: string;
  descripcion: string;
  activa: boolean;
  transiciones: RutaTransicionRequest[];
}

export interface ActualizarRutaAdminRequest {
  descripcion: string;
  activa: boolean;
  transiciones: RutaTransicionRequest[];
}

export interface SolicitudResponse {
  id: number;
  folio: string;
  tipoSolicitud: TipoSolicitud;
  tipoFlujo: TipoFlujo;
  descripcion?: string;
  monto?: number;
  solicitante: string;
  claveRuta: string;
  situacionActualCodigo: number;
  situacionActualDescripcion: string;
  processInstanceId?: string;
  fechaCreacion?: string;
}

export interface SolicitudHistorialResponse {
  id: number;
  situacionAnterior?: number;
  situacionNueva: number;
  accion: string;
  comentario?: string;
  usuario?: string;
  fechaEvento: string;
}

export interface CrearSolicitudRequest {
  claveRuta: string;
  tipoSolicitud: TipoSolicitud;
  descripcion?: string;
  monto?: number;
  referenciaExterna?: string;
}

export interface TransicionRequest {
  situacionDestino: number;
  comentario?: string;
  password?: string;
}

export interface RutaTransicionResponse {
  id: number;
  claveRuta: string;
  situacionActual: number;
  situacionAnterior?: number | null;
  situacionSiguiente?: number | null;
  solicitarPassword: boolean;
}
