import { useAppSelector } from '@/store/hooks';
import { TicketListView } from '@/components/tickets/TicketListView';

export function TicketsPage() {
  const tickets = useAppSelector((s) => s.tickets.tickets);

  return (
    <TicketListView
      tickets={tickets}
      title="All Tickets"
      subtitle="Manage and track all support tickets."
      showAgent
      showRequester
      showAssignFilter
    />
  );
}
