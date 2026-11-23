import { Badge } from '@mantine/core';
import type { TicketStatus } from '@/types';

const config: Record<TicketStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'blue' },
  open: { label: 'Open', color: 'cyan' },
  in_progress: { label: 'In Progress', color: 'yellow' },
  resolved: { label: 'Resolved', color: 'green' },
  closed: { label: 'Closed', color: 'gray' },
  reopened: { label: 'Reopened', color: 'grape' },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const { label, color } = config[status] ?? { label: status, color: 'gray' };
  return (
    <Badge color={color} variant="light" size="sm">
      {label}
    </Badge>
  );
}
