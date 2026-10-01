import { Injectable, signal } from '@angular/core';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private readonly accessTokenKey = 'accessToken';
  private readonly refreshTokenKey = 'refreshToken';

  readonly token = signal<string | null>(null);
  readonly refreshToken = signal<string | null>(null);
  readonly username = signal<string>('');
  readonly roles = signal<string[]>([]);

  initializeFromRuntime(): void {
    const url = new URL(window.location.href);
    const queryToken = url.searchParams.get('token');
    const queryRefresh = url.searchParams.get('refreshToken');

    if (queryToken) {
      localStorage.setItem(this.accessTokenKey, queryToken);
      if (queryRefresh) {
        localStorage.setItem(this.refreshTokenKey, queryRefresh);
      }
      url.searchParams.delete('token');
      url.searchParams.delete('refreshToken');
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    }

    const storedToken = localStorage.getItem(this.accessTokenKey);
    const storedRefresh = localStorage.getItem(this.refreshTokenKey);

    if (storedToken) {
      this.setSession(storedToken, storedRefresh);
      return;
    }

    if (!environment.production && environment.devToken) {
      localStorage.setItem(this.accessTokenKey, environment.devToken);
      this.setSession(environment.devToken, storedRefresh);
      return;
    }

    this.clearSession();
  }

  getAccessToken(): string | null {
    return this.token();
  }

  hasValidToken(toleranceSeconds = 30): boolean {
    const token = this.token();
    if (!token) {
      return false;
    }

    const payload = this.decodePayload(token);
    if (!payload) {
      return false;
    }

    const exp = payload['exp'];
    if (!exp || Number.isNaN(Number(exp))) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return Number(exp) > now + toleranceSeconds;
  }

  setSession(accessToken: string, refreshToken?: string | null): void {
    this.token.set(accessToken);
    this.refreshToken.set(refreshToken ?? null);

    const payload = this.decodePayload(accessToken) || {};
    this.username.set(payload['sub'] || payload['username'] || payload['preferred_username'] || 'Usuario');

    const roleValues = payload['roles'] ?? payload['authorities'] ?? [];
    if (Array.isArray(roleValues)) {
      this.roles.set(roleValues.map((role: string) => String(role).replace(/^ROLE_/, '')));
    } else if (typeof roleValues === 'string' && roleValues.trim()) {
      this.roles.set(roleValues.split(/[\s,]+/).map((role: string) => role.replace(/^ROLE_/, '')).filter(Boolean));
    } else {
      this.roles.set([]);
    }
  }

  clearSession(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this.token.set(null);
    this.refreshToken.set(null);
    this.username.set('');
    this.roles.set([]);
  }

  logoutToPortal(): void {
    this.clearSession();
    window.location.assign(environment.portalUrl);
  }

  private decodePayload(token: string): Record<string, any> | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) {
        return null;
      }
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }
}
