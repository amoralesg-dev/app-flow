import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { PageContentComponent, PageHeaderComponent } from '@rassini/rassini-ui';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-access',
  standalone: true,
  imports: [PageHeaderComponent, PageContentComponent, ButtonModule],
  templateUrl: './access.html',
  styleUrl: './access.scss'
})
export class AccessComponent {
  goPortal(): void {
    window.location.assign(environment.portalUrl);
  }

  retry(): void {
    window.location.reload();
  }
}
