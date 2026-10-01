import { Component, computed, inject } from '@angular/core';
import { ChipModule } from 'primeng/chip';
import { RouterOutlet } from '@angular/router';
import { RassiniShell, RassiniMenuItem } from '@rassini/rassini-ui';

import { AuthTokenService } from '../../core/services/auth-token.service';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterOutlet, RassiniShell, ChipModule],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss'
})
export class AppLayoutComponent {
  private readonly authTokenService = inject(AuthTokenService);

  readonly username = this.authTokenService.username;
  readonly roles = this.authTokenService.roles;
  readonly hasRoles = computed(() => this.roles().length > 0);

  logout(): void {
    this.authTokenService.logoutToPortal();
  }

  readonly menu = computed<RassiniMenuItem[]>(() => {
    const secciones: RassiniMenuItem[] = [
      {
        label: 'General',
        items: [
          { label: 'Inicio', icon: 'pi pi-home', routerLink: '/inicio' },
          { label: 'Bandeja', icon: 'pi pi-inbox', routerLink: '/bandeja' }
        ]
      },
      {
        label: 'Solicitudes',
        items: [
          { label: 'Nueva solicitud', icon: 'pi pi-plus', routerLink: '/solicitudes/nueva' },
          { label: 'Listado de solicitudes', icon: 'pi pi-list', routerLink: '/solicitudes' }
        ]
      },
      {
        label: 'Catálogos',
        items: [
          { label: 'Situaciones', icon: 'pi pi-tags', routerLink: '/catalogos/situaciones' },
          { label: 'Rutas de consulta', icon: 'pi pi-map', routerLink: '/catalogos/rutas' }
        ]
      }
    ];

    if (this.roles().includes('ADMIN')) {
      secciones.push({
        label: 'Administración',
        items: [
          { label: 'Rutas', icon: 'pi pi-map', routerLink: '/admin/rutas' },
          { label: 'Procesos BPM', icon: 'pi pi-sitemap', routerLink: '/admin/bpm' }
        ]
      });
    }

    return secciones;
  });
}
