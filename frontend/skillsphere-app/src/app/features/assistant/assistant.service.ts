import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatResponse {
  messageId: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface ConversationDto {
  id: string;
  employeeId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssistantService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.assistantServiceUrl}/assistant`;

  chat(message: string, conversationId?: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, { message, conversationId });
  }

  getConversations(): Observable<ConversationDto[]> {
    return this.http.get<ConversationDto[]>(`${this.apiUrl}/conversations`);
  }

  getConversationMessages(id: string): Observable<ChatResponse[]> {
    return this.http.get<ChatResponse[]>(`${this.apiUrl}/conversations/${id}`);
  }

  deleteConversation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/conversations/${id}`);
  }
}
