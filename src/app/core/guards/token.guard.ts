import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { AuthTokenService } from '../services/auth-token.service';

export const tokenGuard: CanActivateFn = () => {
  const authTokenService = inject(AuthTokenService);
  const router = inject(Router);

  authTokenService.initializeFromRuntime();

  if (authTokenService.hasValidToken()) {
    return true;
  }

  authTokenService.clearSession();
  return router.parseUrl('/acceso');
};
