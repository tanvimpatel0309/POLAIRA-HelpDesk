import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Ticket, TicketStatus, TicketPriority, Comment, Attachment } from '@/types';
import { seedTickets, NEXT_TICKET_ID } from '@/data/seed';

interface TicketsState {
  tickets: Ticket[];
  nextId: number;
}

const initialState: TicketsState = {
  tickets: seedTickets,
  nextId: NEXT_TICKET_ID,
};

function formatId(n: number) {
  return `HD-${String(n).padStart(6, '0')}`;
}

const now = () => new Date().toISOString();

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    createTicket(
      state,
      action: PayloadAction<{
        title: string;
        description: string;
        category: string;
        priority: TicketPriority;
        requesterId: string;
        requesterName: string;
        attachments: Attachment[];
      }>
    ) {
      const { title, description, category, priority, requesterId, requesterName, attachments } = action.payload;
      const id = formatId(state.nextId);
      const ts = now();
      state.tickets.push({
        id,
        title,
        description,
        category,
        priority,
        status: 'new',
        requesterId,
        requesterName,
        createdAt: ts,
        updatedAt: ts,
        comments: [],
        attachments,
        history: [
          {
            id: `h-${Date.now()}`,
            ticketId: id,
            action: 'Ticket Created',
            userId: requesterId,
            userName: requesterName,
            createdAt: ts,
          },
        ],
      });
      state.nextId += 1;
    },

    assignTicket(
      state,
      action: PayloadAction<{
        ticketId: string;
        agentId: string | undefined;
        agentName: string | undefined;
        adminId: string;
        adminName: string;
      }>
    ) {
      const t = state.tickets.find((x) => x.id === action.payload.ticketId);
      if (!t) return;
      const ts = now();
      const prev = t.assignedAgentName ?? 'Unassigned';
      t.assignedAgentId = action.payload.agentId;
      t.assignedAgentName = action.payload.agentName;
      t.updatedAt = ts;
      t.history.push({
        id: `h-${Date.now()}`,
        ticketId: t.id,
        action: 'Assigned',
        field: 'assignedAgent',
        previousValue: prev,
        newValue: action.payload.agentName ?? 'Unassigned',
        userId: action.payload.adminId,
        userName: action.payload.adminName,
        createdAt: ts,
      });
    },

    changeStatus(
      state,
      action: PayloadAction<{
        ticketId: string;
        status: TicketStatus;
        userId: string;
        userName: string;
      }>
    ) {
      const t = state.tickets.find((x) => x.id === action.payload.ticketId);
      if (!t) return;
      const ts = now();
      const prev = t.status;
      t.status = action.payload.status;
      t.updatedAt = ts;
      if (action.payload.status === 'resolved') t.resolvedAt = ts;
      if (action.payload.status === 'closed') t.closedAt = ts;
      t.history.push({
        id: `h-${Date.now()}`,
        ticketId: t.id,
        action: 'Status Changed',
        field: 'status',
        previousValue: prev,
        newValue: action.payload.status,
        userId: action.payload.userId,
        userName: action.payload.userName,
        createdAt: ts,
      });
    },

    changePriority(
      state,
      action: PayloadAction<{
        ticketId: string;
        priority: TicketPriority;
        userId: string;
        userName: string;
      }>
    ) {
      const t = state.tickets.find((x) => x.id === action.payload.ticketId);
      if (!t) return;
      const ts = now();
      const prev = t.priority;
      t.priority = action.payload.priority;
      t.updatedAt = ts;
      t.history.push({
        id: `h-${Date.now()}`,
        ticketId: t.id,
        action: 'Priority Changed',
        field: 'priority',
        previousValue: prev,
        newValue: action.payload.priority,
        userId: action.payload.userId,
        userName: action.payload.userName,
        createdAt: ts,
      });
    },

    addComment(
      state,
      action: PayloadAction<{
        ticketId: string;
        authorId: string;
        authorName: string;
        authorRole: Comment['authorRole'];
        text: string;
        attachments: Attachment[];
      }>
    ) {
      const t = state.tickets.find((x) => x.id === action.payload.ticketId);
      if (!t) return;
      const ts = now();
      const comment: Comment = {
        id: `cmt-${Date.now()}`,
        ticketId: action.payload.ticketId,
        authorId: action.payload.authorId,
        authorName: action.payload.authorName,
        authorRole: action.payload.authorRole,
        text: action.payload.text,
        attachments: action.payload.attachments,
        createdAt: ts,
      };
      t.comments.push(comment);
      t.updatedAt = ts;
    },

    editComment(
      state,
      action: PayloadAction<{ ticketId: string; commentId: string; text: string }>
    ) {
      const t = state.tickets.find((x) => x.id === action.payload.ticketId);
      if (!t) return;
      const c = t.comments.find((x) => x.id === action.payload.commentId);
      if (!c) return;
      c.text = action.payload.text;
      c.updatedAt = now();
      t.updatedAt = now();
    },

    deleteComment(
      state,
      action: PayloadAction<{ ticketId: string; commentId: string }>
    ) {
      const t = state.tickets.find((x) => x.id === action.payload.ticketId);
      if (!t) return;
      t.comments = t.comments.filter((c) => c.id !== action.payload.commentId);
      t.updatedAt = now();
    },

    updateTicketCategory(
      state,
      action: PayloadAction<{ oldCategory: string; newCategory: string }>
    ) {
      for (const t of state.tickets) {
        if (t.category === action.payload.oldCategory) {
          t.category = action.payload.newCategory;
        }
      }
    },
  },
});

export const {
  createTicket,
  assignTicket,
  changeStatus,
  changePriority,
  addComment,
  editComment,
  deleteComment,
  updateTicketCategory,
} = ticketsSlice.actions;

export default ticketsSlice.reducer;
