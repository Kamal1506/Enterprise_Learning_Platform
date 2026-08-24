import { Component, OnInit, inject, signal, ViewChild, ElementRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantService, ChatResponse, ConversationDto } from '../assistant.service';
import { AuthService } from '../../../core/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DomSanitizer } from '@angular/platform-browser';
import { parseMarkdown } from '../../../core/markdown-parser';

@Component({
  selector: 'app-assistant-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assistant-chat.html',
  styleUrl: './assistant-chat.scss'
})
export class AssistantChatComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly assistantService = inject(AssistantService);
  private readonly notificationService = inject(NotificationService);
  private readonly sanitizer = inject(DomSanitizer);

  @ViewChild('messageScrollContainer') private messageScrollContainer?: ElementRef;

  // Signals
  readonly isOpen = signal<boolean>(false);
  readonly conversations = signal<ConversationDto[]>([]);
  readonly currentConversationId = signal<string | null>(null);
  readonly messages = signal<ChatResponse[]>([]);
  inputValue = '';
  readonly isLoading = signal<boolean>(false);
  readonly viewMode = signal<'list' | 'chat'>('list'); // 'list' or 'chat'

  ngOnInit() {
    // Load past threads on login initialization
    if (this.authService.isLoggedIn()) {
      this.loadConversations();
    }
  }

  getSanitizedContent(content: string) {
    return this.sanitizer.bypassSecurityTrustHtml(parseMarkdown(content));
  }

  toggleChat() {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen() && this.conversations().length === 0) {
      this.loadConversations();
    }
  }

  loadConversations() {
    this.assistantService.getConversations().subscribe({
      next: (res) => {
        this.conversations.set(res);
      },
      error: (err) => {
        console.error('Failed to load conversations', err);
      }
    });
  }

  selectConversation(id: string) {
    this.currentConversationId.set(id);
    this.isLoading.set(true);
    this.viewMode.set('chat');
    this.assistantService.getConversationMessages(id).subscribe({
      next: (res) => {
        this.messages.set(res);
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notificationService.error('Error', 'Failed to load messages.');
      }
    });
  }

  startNewConversation() {
    this.currentConversationId.set(null);
    this.messages.set([]);
    this.viewMode.set('chat');
  }

  backToList() {
    this.viewMode.set('list');
    this.loadConversations();
  }

  deleteConversation(id: string, event: MouseEvent) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation thread?')) {
      this.assistantService.deleteConversation(id).subscribe({
        next: () => {
          this.conversations.update(list => list.filter(c => c.id !== id));
          if (this.currentConversationId() === id) {
            this.currentConversationId.set(null);
            this.messages.set([]);
            this.viewMode.set('list');
          }
          this.notificationService.success('Success', 'Conversation deleted.');
        },
        error: (err) => {
          this.notificationService.error('Error', 'Failed to delete conversation.');
        }
      });
    }
  }

  sendMessage() {
    const text = this.inputValue.trim();
    if (!text || this.isLoading()) return;

    // Append temporary user message locally for immediate UI feedback
    const tempUserMsg: ChatResponse = {
      messageId: 'temp-user',
      conversationId: this.currentConversationId() || '',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };
    this.messages.update(msgs => [...msgs, tempUserMsg]);
    this.inputValue = '';
    this.isLoading.set(true);
    this.scrollToBottom();

    // Call backend API
    this.assistantService.chat(text, this.currentConversationId() || undefined).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (!this.currentConversationId()) {
          this.currentConversationId.set(res.conversationId);
        }
        
        // Remove temp and add finalized list or append response
        this.messages.update(msgs => {
          const filtered = msgs.filter(m => m.messageId !== 'temp-user');
          // Fetch final list or append
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
      error: (err) => {
        this.isLoading.set(false);
        // Remove temp user message
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

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messageScrollContainer) {
        const el = this.messageScrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 100);
  }
}
