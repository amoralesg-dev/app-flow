import { Routes } from '@angular/router';

import { tokenGuard } from './core/guards/token.guard';
import { AppLayoutComponent } from './layout/app-layout/app-layout';
import { AccessComponent } from './pages/acceso/access';
import { DashboardComponent } from './pages/inicio/dashboard';
import { SolicitudesListadoComponent } from './pages/solicitudes/listado/solicitudes-listado';
import { SolicitudNuevaComponent } from './pages/solicitudes/nueva/solicitud-nueva';
import { SolicitudDetalleComponent } from './pages/solicitudes/detalle/solicitud-detalle';
import { BandejaComponent } from './pages/bandeja/bandeja';
import { CatalogoSituacionesComponent } from './pages/catalogos/situaciones/catalogo-situaciones';
import { CatalogoRutasComponent } from './pages/catalogos/rutas/catalogo-rutas';
import { AdminRutasComponent } from './pages/admin/rutas/admin-rutas';
import { AdminBpmComponent } from './pages/admin/bpm/admin-bpm';

export const routes: Routes = [
  { path: 'acceso', component: AccessComponent },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [tokenGuard],
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: DashboardComponent },
      { path: 'solicitudes', component: SolicitudesListadoComponent },
      { path: 'solicitudes/nueva', component: SolicitudNuevaComponent },
      { path: 'solicitudes/:id', component: SolicitudDetalleComponent },
      { path: 'bandeja', component: BandejaComponent },
      { path: 'catalogos/situaciones', component: CatalogoSituacionesComponent },
      { path: 'catalogos/rutas', component: CatalogoRutasComponent },
      { path: 'admin/rutas', component: AdminRutasComponent },
      { path: 'admin/bpm', component: AdminBpmComponent }
    ]
  },
  { path: '**', redirectTo: 'inicio' }
];
