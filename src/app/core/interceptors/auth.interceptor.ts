import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthTokenService } from '../services/auth-token.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authTokenService = inject(AuthTokenService);

  const isApiCall = req.url.startsWith(environment.apiBaseUrl);
  const token = authTokenService.getAccessToken();

  const request = isApiCall && token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => throwError(() => error))
  );
};
