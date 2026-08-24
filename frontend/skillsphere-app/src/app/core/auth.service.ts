import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginResponse {
  token: string;
  expiresAt: string;
  role: string;
  email: string;
  employeeId: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  
  private readonly apiUrl = 'http://localhost:8081/api/v1/auth';

  // Signals for state
  readonly token = signal<string | null>(sessionStorage.getItem('token'));
  readonly role = signal<string | null>(sessionStorage.getItem('role'));
  readonly email = signal<string | null>(sessionStorage.getItem('email'));
  readonly employeeId = signal<string | null>(sessionStorage.getItem('employeeId'));

  login(credentials: { email: string; password: String }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        sessionStorage.setItem('token', res.token);
        sessionStorage.setItem('role', res.role);
        sessionStorage.setItem('email', res.email);
        sessionStorage.setItem('employeeId', res.employeeId || '');

        this.token.set(res.token);
        this.role.set(res.role);
        this.email.set(res.email);
        this.employeeId.set(res.employeeId || '');
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  logout() {
    sessionStorage.clear();
    this.token.set(null);
    this.role.set(null);
    this.email.set(null);
    this.employeeId.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.token() !== null;
  }
}
