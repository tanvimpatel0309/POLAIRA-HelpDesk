import type { Ticket, SlaConfig } from '@/types';

export type SlaStatus = 'on_track' | 'near_breach' | 'breached' | 'resolved';

export interface SlaInfo {
  status: SlaStatus;
  deadline: Date;
  hoursRemaining: number;
  percentElapsed: number;
}

export function getSlaInfo(ticket: Ticket, configs: SlaConfig[]): SlaInfo | null {
  if (ticket.status === 'closed') return null;

  const cfg = configs.find((c) => c.priority === ticket.priority);
  if (!cfg) return null;

  const start = new Date(ticket.createdAt).getTime();
  const deadline = new Date(start + cfg.resolutionHours * 3_600_000);
  const now = Date.now();
  const totalMs = cfg.resolutionHours * 3_600_000;
  const elapsedMs = now - start;
  const remainingMs = deadline.getTime() - now;
  const hoursRemaining = remainingMs / 3_600_000;
  const percentElapsed = Math.min(100, (elapsedMs / totalMs) * 100);

  let status: SlaStatus;
  if (ticket.status === 'resolved') {
    status = 'resolved';
  } else if (remainingMs <= 0) {
    status = 'breached';
  } else if (percentElapsed >= 75) {
    status = 'near_breach';
  } else {
    status = 'on_track';
  }

  return { status, deadline, hoursRemaining, percentElapsed };
}

export function formatSlaTimeRemaining(hoursRemaining: number): string {
  if (hoursRemaining <= 0) {
    const overHours = Math.abs(hoursRemaining);
    if (overHours < 1) return `${Math.round(overHours * 60)}m overdue`;
    if (overHours < 24) return `${overHours.toFixed(1)}h overdue`;
    return `${Math.floor(overHours / 24)}d overdue`;
  }
  if (hoursRemaining < 1) return `${Math.round(hoursRemaining * 60)}m left`;
  if (hoursRemaining < 24) return `${hoursRemaining.toFixed(1)}h left`;
  return `${Math.floor(hoursRemaining / 24)}d ${Math.round(hoursRemaining % 24)}h left`;
}
