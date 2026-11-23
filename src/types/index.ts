export type UserRole = 'admin' | 'agent' | 'requester';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  notificationPreferences?: NotificationPreferences;
}

export type TicketStatus = 'new' | 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Attachment {
  id: string;
  name: string;
  size: number;
  fileType: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
  updatedAt?: string;
  attachments: Attachment[];
}

export interface HistoryEntry {
  id: string;
  ticketId: string;
  action: string;
  field?: string;
  previousValue?: string;
  newValue?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  requesterId: string;
  requesterName: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  comments: Comment[];
  history: HistoryEntry[];
  attachments: Attachment[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface PriorityConfig {
  id: string;
  name: string;
  level: TicketPriority;
  description: string;
  color: string;
  createdAt: string;
}

export interface StatusConfig {
  id: string;
  name: string;
  key: TicketStatus;
  description: string;
  allowedTransitions: TicketStatus[];
  color: string;
  isSystem: boolean;
  createdAt: string;
}

export interface SystemSettings {
  attachmentsEnabled: boolean;
  notificationsEnabled: boolean;
  maxAttachmentSizeMB: number;
  allowedFileTypes: string[];
  defaultPriority: TicketPriority;
  defaultCategory: string;
  autoAssignEnabled: boolean;
}

export interface SlaConfig {
  id: string;
  priority: TicketPriority;
  resolutionHours: number;
  updatedAt: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  channels: ('in_app' | 'email' | 'sms')[];
  events: {
    ticketCreated: boolean;
    ticketAssigned: boolean;
    statusChanged: boolean;
    commentAdded: boolean;
    ticketResolved: boolean;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  userName: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  ticketId: string;
  ticketTitle: string;
  read: boolean;
  createdAt: string;
}
