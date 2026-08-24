import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'HR_MANAGER' | 'TRAINING_MANAGER' | 'EMPLOYEE';
  employeeId?: string;
  exp: number;
}

export interface AuthResponse {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly SKILL_API = 'http://localhost:8081/api/v1';
  private readonly TOKEN_KEY = 'ss_token';

  private _token = signal<string | null>(sessionStorage.getItem(this.TOKEN_KEY));

  readonly isAuthenticated = computed(() => {
    const token = this._token();
    if (!token) return false;
    const user = this.decodeToken(token);
    return !!user && user.exp * 1000 > Date.now();
  });

  readonly currentUser = computed<AuthUser | null>(() => {
    const token = this._token();
    if (!token) return null;
    return this.decodeToken(token);
  });

  readonly isAdmin = computed(() =>
    this.currentUser()?.role === 'ADMIN'
  );
  readonly isHrOrAdmin = computed(() =>
    ['ADMIN', 'HR_MANAGER'].includes(this.currentUser()?.role ?? '')
  );

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.SKILL_API}/auth/login`, { email, password }).pipe(
      tap(res => this.storeToken(res.token))
    );
  }

  register(payload: { email: string; password: string; role: string }): Observable<any> {
    return this.http.post(`${this.SKILL_API}/auth/register`, payload);
  }

  logout(): void {
    this._token.set(null);
    sessionStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  private storeToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    this._token.set(token);
  }

  private decodeToken(token: string): AuthUser | null {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        employeeId: decoded.employeeId,
        exp: decoded.exp,
      };
    } catch {
      return null;
    }
  }
}
