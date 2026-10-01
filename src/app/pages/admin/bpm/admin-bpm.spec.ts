import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { AdminBpmComponent } from './admin-bpm';
import { AprobacionesApiService } from '../../../core/services/aprobaciones-api.service';
import { BpmProcessDefinitionResponse, BpmProcessInstanceResponse } from '../../../core/models/domain.models';

describe('AdminBpmComponent', () => {
  let component: AdminBpmComponent;
  let api: AprobacionesApiService;

  const definicion: BpmProcessDefinitionResponse = {
    id: 'ruta_2328:2:abc',
    processDefinitionKey: 'ruta_2328',
    name: 'Proceso de aprobación 2328',
    claveRuta: '2328',
    version: 2,
    deploymentId: 'dep-1',
    resourceName: 'ruta_2328.bpmn20.xml',
    suspendida: false,
    esUltimaVersion: true,
    fechaDespliegue: '2026-09-09T14:43:36.701'
  };

  const instancia: BpmProcessInstanceResponse = {
    processInstanceId: 'inst-1',
    processDefinitionId: 'ruta_2328:2:abc',
    processDefinitionKey: 'ruta_2328',
    processDefinitionName: 'Proceso de aprobación 2328',
    processDefinitionVersion: 2,
    inicio: '2026-09-09T10:02:39.539',
    estado: 'ACTIVA',
    solicitudId: 2,
    folio: 'CMP-20260909-00001',
    claveRuta: '2328',
    solicitanteUsername: 'admin.mock',
    solicitudActiva: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBpmComponent],
      providers: [provideHttpClient(), MessageService, ConfirmationService]
    }).compileComponents();

    api = TestBed.inject(AprobacionesApiService);
    vi.spyOn(api, 'getProcessDefinitions').mockReturnValue(of([definicion]));
    vi.spyOn(api, 'getProcessInstances').mockReturnValue(of({ content: [instancia], page: 0, size: 10, totalElements: 1, totalPages: 1 }));
    vi.spyOn(api, 'getProcessDefinitionXml').mockReturnValue(of('<definitions />'));
    vi.spyOn(api, 'getProcessDefinitionDiagrama').mockReturnValue(of(new Blob(['png'], { type: 'image/png' })));
    vi.spyOn(api, 'suspenderProcessDefinition').mockReturnValue(of({ ...definicion, suspendida: true }));
    vi.spyOn(api, 'activarProcessDefinition').mockReturnValue(of({ ...definicion, suspendida: false }));
    vi.spyOn(api, 'cancelarProcessInstance').mockReturnValue(of('Instancia cancelada'));

    const fixture = TestBed.createComponent(AdminBpmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolver) => setTimeout(resolver, 0));
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('carga las definiciones de proceso al iniciar', () => {
    expect(component.procesos.length).toBe(1);
    expect(component.procesos[0].key).toBe('ruta_2328');
    expect(component.procesos[0].version).toBe(2);
    expect(component.procesos[0].estadoTexto).toBe('Activa');
    expect(component.procesos[0].fechaDespliegueTexto).not.toBe('—');
  });

  it('carga el XML de una definición al pedirlo', () => {
    component.verXml(component.procesos[0]);
    expect(component.xmlContenido).toBe('<definitions />');
    expect(component.xmlVisible).toBe(true);
  });

  it('carga el diagrama como blob y genera una URL de objeto', () => {
    component.verDiagrama(component.procesos[0]);
    expect(component.diagramaUrl).toMatch(/^blob:/);
    expect(component.diagramaVisible).toBe(true);
  });

  it('suspende y reactiva una definición', () => {
    component.abrirAccion('suspender', component.procesos[0]);
    expect(component.accionVisible).toBe(true);
    expect(component.accion).toBe('suspender');
    component.ejecutarAccion();

    expect(api.suspenderProcessDefinition).toHaveBeenCalledWith('ruta_2328:2:abc', false);

    component.abrirAccion('activar', component.procesos[0]);
    component.ejecutarAccion();
    expect(api.activarProcessDefinition).toHaveBeenCalledWith('ruta_2328:2:abc', false);
  });

  it('carga instancias en la pestaña de instancias', () => {
    component.cambiarPestana('instancias');
    expect(component.instancias.length).toBe(1);
    expect(component.instancias[0].folio).toBe('CMP-20260909-00001');
    expect(component.instancias[0].estadoTexto).toBe('Activa');
    expect(component.totalRecords).toBe(1);
  });

  it('cancela una instancia con motivo', () => {
    component.cambiarPestana('instancias');
    component.abrirCancelar(component.instancias[0]);
    expect(component.cancelarVisible).toBe(true);
    component.cancelarMotivo = 'Prueba unitaria';
    component.ejecutarCancelacion();

    expect(api.cancelarProcessInstance).toHaveBeenCalledWith('inst-1', 'Prueba unitaria');
    expect(component.cancelarVisible).toBe(false);
  });
});
