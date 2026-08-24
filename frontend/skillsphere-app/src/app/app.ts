import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationContainerComponent } from './shared/notification-container/notification-container';
import { ConfirmationModalComponent } from './shared/confirmation-modal/confirmation-modal';
import { AssistantChatComponent } from './features/assistant/assistant-chat/assistant-chat';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NotificationContainerComponent,
    ConfirmationModalComponent,
    AssistantChatComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  protected readonly title = signal('skillsphere-app');
  protected readonly authService = inject(AuthService);
}
