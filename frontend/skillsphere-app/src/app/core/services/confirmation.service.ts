import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'primary' | 'danger' | 'warning' | 'info';
  showInput?: boolean;
  inputPlaceholder?: string;
  inputValue?: string;
}

export interface ConfirmState {
  options: ConfirmOptions;
  resolve: (value: any) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private stateSignal = signal<ConfirmState | null>(null);
  public state = this.stateSignal.asReadonly();

  confirm(options: ConfirmOptions): Promise<any> {
    return new Promise((resolve) => {
      this.stateSignal.set({
        options: {
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          type: 'primary',
          showInput: false,
          inputValue: '',
          ...options
        },
        resolve
      });
    });
  }

  resolve(value: any) {
    const current = this.stateSignal();
    if (current) {
      current.resolve(value);
      this.stateSignal.set(null);
    }
  }

  dismiss() {
    const current = this.stateSignal();
    if (current) {
      // If it was an input prompt, cancel resolves to null. Otherwise, it resolves to false.
      current.resolve(current.options.showInput ? null : false);
      this.stateSignal.set(null);
    }
  }
}
