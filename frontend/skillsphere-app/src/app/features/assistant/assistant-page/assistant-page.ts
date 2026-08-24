import { Component, OnInit, inject, signal, ViewChild, ElementRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantService, ChatResponse, ConversationDto } from '../assistant.service';
import { AuthService } from '../../../core/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DomSanitizer } from '@angular/platform-browser';
import { parseMarkdown } from '../../../core/markdown-parser';

import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar';
import { HeaderComponent } from '../../../shared/layout/header/header';

@Component({
  selector: 'app-assistant-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent],
  templateUrl: './assistant-page.html',
  styleUrl: './assistant-page.scss'
})
export class AssistantPageComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly assistantService = inject(AssistantService);
  private readonly notificationService = inject(NotificationService);
  private readonly sanitizer = inject(DomSanitizer);

  @ViewChild('messageScrollContainer') private messageScrollContainer?: ElementRef;

  // Signals & State
  readonly conversations = signal<ConversationDto[]>([]);
  readonly currentConversationId = signal<string | null>(null);
  readonly messages = signal<ChatResponse[]>([]);
  inputValue = '';
  readonly isLoading = signal<boolean>(false);
  readonly showSidebar = signal<boolean>(true); // For mobile responsiveness toggle

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.loadConversations();
    }
  }

  getSanitizedContent(content: string) {
    return this.sanitizer.bypassSecurityTrustHtml(parseMarkdown(content));
  }

  loadConversations() {
    this.assistantService.getConversations().subscribe({
      next: (data: ConversationDto[]) => {
        this.conversations.set(data);
      },
      error: (err: any) => {
        this.notificationService.error('Error', 'Failed to load conversations.');
      }
    });
  }

  selectConversation(convId: string) {
    this.currentConversationId.set(convId);
    this.isLoading.set(true);
    this.assistantService.getConversationMessages(convId).subscribe({
      next: (data: ChatResponse[]) => {
        // API returns newer messages first, reverse to display chronologically
        this.messages.set([...data].reverse());
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.notificationService.error('Error', 'Failed to retrieve chat messages.');
      }
    });
  }

  startNewConversation() {
    this.currentConversationId.set(null);
    this.messages.set([]);
  }

  sendMessage() {
    const text = this.inputValue.trim();
    if (!text) return;

    this.inputValue = '';

    // If there's no current conversation, create a temporary one locally
    // to give immediate user feedback
    const tempUserMsg: ChatResponse = {
      messageId: 'temp-user',
      conversationId: this.currentConversationId() || 'temp',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };

    // Append user message immediately
    this.messages.update(msgs => [...msgs, tempUserMsg]);
    this.scrollToBottom();
    this.isLoading.set(true);

    this.assistantService.chat(text, this.currentConversationId() || undefined).subscribe({
      next: (res: ChatResponse) => {
        this.isLoading.set(false);
        
        // If it was a new conversation, save the ID returned by the API
        if (!this.currentConversationId()) {
          this.currentConversationId.set(res.conversationId);
          this.loadConversations();
        }

        // Replace temp messages with official API-saved entries
        this.messages.update(msgs => {
          const filtered = msgs.filter(m => m.messageId !== 'temp-user');
          return [...filtered, {
            messageId: 'user-final',
            conversationId: res.conversationId,
            role: 'user',
            content: text,
            createdAt: new Date().toISOString()
          }, res];
        });
        
        this.scrollToBottom();
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.messages.update(msgs => msgs.filter(m => m.messageId !== 'temp-user'));
        
        let errorMsg = 'Failed to send message.';
        if (err.status === 429) {
          errorMsg = 'Rate limit exceeded. Please wait a minute before trying again.';
        } else if (err.error && err.error.message) {
          errorMsg = err.error.message;
        } else if (err.error && typeof err.error === 'string') {
          try {
            const parsed = JSON.parse(err.error);
            if (parsed.error) errorMsg = parsed.error;
          } catch(e) {}
        }
        this.notificationService.error('Error', errorMsg);
      }
    });
  }

  deleteConversation(id: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    if (confirm('Are you sure you want to delete this conversation thread?')) {
      this.assistantService.deleteConversation(id).subscribe({
        next: () => {
          this.conversations.update(list => list.filter(c => c.id !== id));
          if (this.currentConversationId() === id) {
            this.currentConversationId.set(null);
            this.messages.set([]);
          }
          this.notificationService.success('Success', 'Conversation deleted.');
          this.loadConversations();
        },
        error: (err: any) => {
          this.notificationService.error('Error', 'Failed to delete conversation.');
        }
      });
    }
  }

  toggleSidebar() {
    this.showSidebar.set(!this.showSidebar());
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messageScrollContainer) {
        const el = this.messageScrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 100);
  }
}
