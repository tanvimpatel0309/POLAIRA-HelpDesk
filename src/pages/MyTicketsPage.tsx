import { useAppSelector } from '@/store/hooks';
import { TicketListView } from '@/components/tickets/TicketListView';

export function MyTicketsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const allTickets = useAppSelector((s) => s.tickets.tickets);
  const myTickets = allTickets.filter((t) => t.requesterId === user?.id);

  return (
    <TicketListView
      tickets={myTickets}
      title="My Tickets"
      subtitle="View and track your submitted support requests."
      showAgent
      showRequester={false}
    />
  );
}
