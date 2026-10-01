import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AUTH_CONFIG, provideRassiniTheme } from '@rassini/rassini-ui';

import { routes } from './app.routes';
import { authTokenInterceptor } from './core/interceptors/auth.interceptor';
import { AuthTokenService } from './core/services/auth-token.service';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      withEnabledBlockingInitialNavigation()
    ),
    provideHttpClient(withFetch(), withInterceptors([authTokenInterceptor])),
    provideRassiniTheme(),
    MessageService,
    ConfirmationService,
    {
      provide: AUTH_CONFIG,
      useValue: {
        loginUrl: `${environment.iamApiBaseUrl}/auth/login`,
        refreshUrl: `${environment.iamApiBaseUrl}/auth/refresh`,
        meUrl: `${environment.iamApiBaseUrl}/auth/me`
      }
    },
    provideAppInitializer(() => {
      inject(AuthTokenService).initializeFromRuntime();
    })
    // Futuro (cuando se habilite refresh automático con IAM):
    // sustituir el provider AUTH_CONFIG anterior por provideRassiniAuth({ ... }) + authInterceptor del lib
  ]
};
