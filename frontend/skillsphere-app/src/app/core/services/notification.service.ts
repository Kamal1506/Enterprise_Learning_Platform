import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  isDismissing?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSignal = signal<Notification[]>([]);
  public notifications = this.notificationsSignal.asReadonly();

  success(title: string, message: string, duration = 4000) {
    this.show('success', title, message, duration);
  }

  error(title: string, message: string, duration = 5000) {
    this.show('error', title, message, duration);
  }

  warning(title: string, message: string, duration = 4000) {
    this.show('warning', title, message, duration);
  }

  info(title: string, message: string, duration = 4000) {
    this.show('info', title, message, duration);
  }

  private show(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration: number) {
    const id = Math.random().toString(36).substring(2, 9);
    const notification: Notification = { id, type, title, message, duration };
    this.notificationsSignal.update(current => [...current, notification]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  dismiss(id: string) {
    // Set isDismissing to trigger exit animation in the UI
    this.notificationsSignal.update(current =>
      current.map(n => n.id === id ? { ...n, isDismissing: true } : n)
    );

    // Wait for exit animation (300ms) to complete before removing from array
    setTimeout(() => {
      this.notificationsSignal.update(current => current.filter(n => n.id !== id));
    }, 300);
  }
}
