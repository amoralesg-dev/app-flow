import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ActualizarRutaAdminRequest,
  BpmProcessDefinitionResponse,
  BpmProcessInstanceDetailResponse,
  BpmProcessInstanceResponse,
  CrearRutaAdminRequest,
  CrearSolicitudRequest,
  EstadoInstancia,
  PageResponse,
  RutaAdminResponse,
  RutaResponse,
  RutaTransicionResponse,
  SituacionResponse,
  SolicitudHistorialResponse,
  SolicitudResponse,
  TipoFlujo,
  TransicionRequest
} from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class AprobacionesApiService {
  private readonly base = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getIndex(): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${this.base}/api/index`);
  }

  getSituaciones(tipoFlujo: TipoFlujo): Observable<SituacionResponse[]> {
    const params = new HttpParams().set('tipoFlujo', tipoFlujo);
    return this.http.get<SituacionResponse[]>(`${this.base}/api/catalogos/situaciones`, { params });
  }

  getRutas(filtro?: string): Observable<RutaResponse[]> {
    let params = new HttpParams();
    if (filtro?.trim()) {
      params = params.set('filtro', filtro.trim());
    }
    return this.http.get<RutaResponse[]>(`${this.base}/api/catalogos/rutas`, { params });
  }

  getTransicionesRuta(claveRuta: string, situacionActual?: number): Observable<RutaTransicionResponse[]> {
    let params = new HttpParams();
    if (situacionActual !== null && situacionActual !== undefined) {
      params = params.set('situacionActual', String(situacionActual));
    }
    return this.http.get<RutaTransicionResponse[]>(`${this.base}/api/catalogos/rutas/${claveRuta}/transiciones`, { params });
  }

  getRutasAdmin(params: { filtro?: string; activa?: boolean | null } = {}): Observable<RutaAdminResponse[]> {
    let httpParams = new HttpParams();
    if (params.filtro?.trim()) {
      httpParams = httpParams.set('filtro', params.filtro.trim());
    }
    if (params.activa !== null && params.activa !== undefined) {
      httpParams = httpParams.set('activa', String(params.activa));
    }
    return this.http.get<RutaAdminResponse[]>(`${this.base}/api/admin/rutas`, { params: httpParams });
  }

  getRutaAdminById(id: number): Observable<RutaAdminResponse> {
    return this.http.get<RutaAdminResponse>(`${this.base}/api/admin/rutas/${id}`);
  }

  crearRutaAdmin(payload: CrearRutaAdminRequest): Observable<RutaAdminResponse> {
    return this.http.post<RutaAdminResponse>(`${this.base}/api/admin/rutas`, payload);
  }

  actualizarRutaAdmin(id: number, payload: ActualizarRutaAdminRequest): Observable<RutaAdminResponse> {
    return this.http.put<RutaAdminResponse>(`${this.base}/api/admin/rutas/${id}`, payload);
  }

  desplegarBpmnRuta(id: number): Observable<RutaAdminResponse> {
    return this.http.post<RutaAdminResponse>(`${this.base}/api/admin/rutas/${id}/desplegar-bpmn`, null);
  }

  getProcessDefinitions(params: { proceso?: string; todasVersiones?: boolean } = {}): Observable<BpmProcessDefinitionResponse[]> {
    let httpParams = new HttpParams();
    if (params.proceso?.trim()) {
      httpParams = httpParams.set('proceso', params.proceso.trim());
    }
    if (params.todasVersiones) {
      httpParams = httpParams.set('todasVersiones', 'true');
    }
    return this.http.get<BpmProcessDefinitionResponse[]>(`${this.base}/api/admin/bpm/process-definitions`, { params: httpParams });
  }

  getProcessDefinitionXml(id: string): Observable<string> {
    return this.http.get(`${this.base}/api/admin/bpm/process-definitions/${id}/xml`, { responseType: 'text' });
  }

  getProcessDefinitionDiagrama(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/api/admin/bpm/process-definitions/${id}/diagrama`, { responseType: 'blob' });
  }

  suspenderProcessDefinition(id: string, incluirInstancias = false): Observable<BpmProcessDefinitionResponse> {
    return this.http.put<BpmProcessDefinitionResponse>(`${this.base}/api/admin/bpm/process-definitions/${id}/suspender`, null, {
      params: new HttpParams().set('incluirInstancias', String(incluirInstancias))
    });
  }

  activarProcessDefinition(id: string, incluirInstancias = false): Observable<BpmProcessDefinitionResponse> {
    return this.http.put<BpmProcessDefinitionResponse>(`${this.base}/api/admin/bpm/process-definitions/${id}/activar`, null, {
      params: new HttpParams().set('incluirInstancias', String(incluirInstancias))
    });
  }

  getProcessInstances(params: { proceso?: string; estado?: EstadoInstancia; page?: number; size?: number } = {}): Observable<PageResponse<BpmProcessInstanceResponse>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 10));
    if (params.proceso?.trim()) {
      httpParams = httpParams.set('proceso', params.proceso.trim());
    }
    if (params.estado) {
      httpParams = httpParams.set('estado', params.estado);
    }
    return this.http.get<PageResponse<BpmProcessInstanceResponse>>(`${this.base}/api/admin/bpm/process-instances`, { params: httpParams });
  }

  getProcessInstanceDetail(id: string): Observable<BpmProcessInstanceDetailResponse> {
    return this.http.get<BpmProcessInstanceDetailResponse>(`${this.base}/api/admin/bpm/process-instances/${id}`);
  }

  cancelarProcessInstance(id: string, motivo?: string): Observable<string> {
    let httpParams = new HttpParams();
    if (motivo?.trim()) {
      httpParams = httpParams.set('motivo', motivo.trim());
    }
    return this.http.delete(`${this.base}/api/admin/bpm/process-instances/${id}`, { params: httpParams, responseType: 'text' });
  }

  getSolicitudes(params: { tipoFlujo?: TipoFlujo | ''; situacion?: number | null; page?: number; size?: number }): Observable<PageResponse<SolicitudResponse>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 10));

    if (params.tipoFlujo) {
      httpParams = httpParams.set('tipoFlujo', params.tipoFlujo);
    }
    if (params.situacion) {
      httpParams = httpParams.set('situacion', String(params.situacion));
    }

    return this.http.get<PageResponse<SolicitudResponse>>(`${this.base}/api/solicitudes`, { params: httpParams });
  }

  crearSolicitud(payload: CrearSolicitudRequest): Observable<SolicitudResponse> {
    return this.http.post<SolicitudResponse>(`${this.base}/api/solicitudes`, payload);
  }

  getSolicitudById(id: number): Observable<SolicitudResponse> {
    return this.http.get<SolicitudResponse>(`${this.base}/api/solicitudes/${id}`);
  }

  getHistorial(id: number): Observable<SolicitudHistorialResponse[]> {
    return this.http.get<SolicitudHistorialResponse[]>(`${this.base}/api/solicitudes/${id}/historial`);
  }

  ejecutarTransicion(id: number, payload: TransicionRequest): Observable<SolicitudResponse> {
    return this.http.post<SolicitudResponse>(`${this.base}/api/solicitudes/${id}/transiciones`, payload);
  }
}
