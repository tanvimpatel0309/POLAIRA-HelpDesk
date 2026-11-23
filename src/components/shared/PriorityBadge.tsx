import { Badge } from '@mantine/core';
import type { TicketPriority } from '@/types';

const config: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'blue' },
  medium: { label: 'Medium', color: 'yellow' },
  high: { label: 'High', color: 'orange' },
  critical: { label: 'Critical', color: 'red' },
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const { label, color } = config[priority] ?? { label: priority, color: 'gray' };
  return (
    <Badge color={color} variant="filled" size="sm">
      {label}
    </Badge>
  );
}
