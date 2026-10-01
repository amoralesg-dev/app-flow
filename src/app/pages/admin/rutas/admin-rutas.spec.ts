import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { AdminRutasComponent } from './admin-rutas';
import { AprobacionesApiService } from '../../../core/services/aprobaciones-api.service';
import { RutaAdminResponse } from '../../../core/models/domain.models';

describe('AdminRutasComponent', () => {
  let component: AdminRutasComponent;
  let api: AprobacionesApiService;

  const rutaBase: RutaAdminResponse = {
    id: 1,
    claveRuta: '2328',
    descripcion: 'DIR. FINANZAS',
    activa: true,
    transiciones: [
      { id: 1, situacionActual: 20, situacionAnterior: 99, situacionSiguiente: 32, solicitarPassword: false },
      { id: 2, situacionActual: 32, situacionAnterior: 20, situacionSiguiente: 33, solicitarPassword: true },
      { id: 3, situacionActual: 35, situacionAnterior: 20, situacionSiguiente: null, solicitarPassword: false }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRutasComponent],
      providers: [provideHttpClient(), MessageService, ConfirmationService]
    }).compileComponents();

    api = TestBed.inject(AprobacionesApiService);
    vi.spyOn(api, 'getRutasAdmin').mockReturnValue(of([rutaBase]));
    vi.spyOn(api, 'getSituaciones').mockImplementation((tipo) => {
      const situaciones = tipo === 'COMPROBACIONES'
        ? [
            { codigo: 20, descripcionCorta: 'a Registrados', descripcionLarga: 'REGISTRADOS', tipoFlujo: 'COMPROBACIONES' },
            { codigo: 32, descripcionCorta: 'a Jefe Inmediato', descripcionLarga: 'EN AUTORIZACION JEFE INMEDIATO', tipoFlujo: 'COMPROBACIONES' }
          ]
        : [{ codigo: 60, descripcionCorta: 'a Registradas', descripcionLarga: 'SOLICITUDES REGISTRADAS', tipoFlujo: 'FOLIOS' }];
      return of(situaciones as any);
    });

    const fixture = TestBed.createComponent(AdminRutasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga el listado de rutas al iniciar', () => {
    expect(component.filas.length).toBe(1);
    expect(component.filas[0].claveRuta).toBe('2328');
    expect(component.filas[0].activaTexto).toBe('Sí');
    expect(component.filas[0].procesoBpmTexto).toBe('No desplegado');
    expect(component.situacionOptions.length).toBe(3);
  });

  it('crea una ruta nueva convirtiendo FIN (0) en siguiente nulo', () => {
    const crear = vi.spyOn(api, 'crearRutaAdmin').mockReturnValue(of(rutaBase));

    component.abrirNueva();
    component.form = { claveRuta: '9150', descripcion: 'PRUEBA NUEVA', activa: true };
    component.transiciones = [
      { situacionActualCodigo: 20, situacionAnteriorCodigo: 99, situacionSiguienteCodigo: 32, solicitarPassword: false },
      { situacionActualCodigo: 32, situacionAnteriorCodigo: 20, situacionSiguienteCodigo: 0, solicitarPassword: true }
    ];

    component.guardar();

    expect(crear).toHaveBeenCalledTimes(1);
    const payload = crear.mock.calls[0][0];
    expect(payload.claveRuta).toBe('9150');
    expect(payload.descripcion).toBe('PRUEBA NUEVA');
    expect(payload.activa).toBe(true);
    expect(payload.transiciones[0].situacionAnteriorCodigo).toBe(99);
    expect(payload.transiciones[0].situacionSiguienteCodigo).toBe(32);
    expect(payload.transiciones[1].situacionSiguienteCodigo).toBeNull();
    expect(payload.transiciones[1].solicitarPassword).toBe(true);
    expect(component.dialogVisible).toBe(false);
  });

  it('edita una ruta existente: carga detalle y envía actualización', () => {
    vi.spyOn(api, 'getRutaAdminById').mockReturnValue(of(rutaBase));
    const actualizar = vi.spyOn(api, 'actualizarRutaAdmin').mockReturnValue(of(rutaBase));

    component.abrirEditar({ id: 1, claveRuta: '2328', descripcion: 'DIR. FINANZAS', activa: true, activaTexto: 'Sí', procesoBpmTexto: 'v2 · Activa' });

    expect(component.form.claveRuta).toBe('2328');
    expect(component.dialogVisible).toBe(true);
    expect(component.transiciones.length).toBe(3);
    const filaFinal = component.transiciones[2];
    expect(filaFinal.situacionActualCodigo).toBe(35);
    expect(filaFinal.situacionSiguienteCodigo).toBe(0);

    component.form.descripcion = 'DIR. FINANZAS ACTUALIZADA';
    component.guardar();

    expect(actualizar).toHaveBeenCalledWith(1, expect.objectContaining({ descripcion: 'DIR. FINANZAS ACTUALIZADA', activa: true }));
    const payload = actualizar.mock.calls[0][1];
    const fin = payload.transiciones.find((t) => t.situacionActualCodigo === 35);
    expect(fin?.situacionSiguienteCodigo).toBeNull();
  });

  it('rechaza una ruta activa sin transición desde la situación inicial', () => {
    const crear = vi.spyOn(api, 'crearRutaAdmin').mockReturnValue(of(rutaBase));

    component.abrirNueva();
    component.form = { claveRuta: '9150', descripcion: 'PRUEBA', activa: true };
    component.transiciones = [
      { situacionActualCodigo: 31, situacionAnteriorCodigo: null, situacionSiguienteCodigo: 33, solicitarPassword: false }
    ];

    component.guardar();

    expect(crear).not.toHaveBeenCalled();
    expect(component.dialogVisible).toBe(true);
  });

  it('ignora filas completamente vacías al guardar', () => {
    const crear = vi.spyOn(api, 'crearRutaAdmin').mockReturnValue(of(rutaBase));

    component.abrirNueva();
    component.form = { claveRuta: '9150', descripcion: 'PRUEBA', activa: true };
    component.transiciones = [
      { situacionActualCodigo: 20, situacionAnteriorCodigo: null, situacionSiguienteCodigo: 0, solicitarPassword: false },
      { situacionActualCodigo: null, situacionAnteriorCodigo: null, situacionSiguienteCodigo: null, solicitarPassword: false }
    ];

    component.guardar();

    expect(crear).toHaveBeenCalledTimes(1);
    const payload = crear.mock.calls[0][0];
    expect(payload.transiciones.length).toBe(1);
  });
});
