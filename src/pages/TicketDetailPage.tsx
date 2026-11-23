import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Button,
  Textarea,
  Select,
  Divider,
  Avatar,
  Box,
  ActionIcon,
  Tooltip,
  FileInput,
  Modal,
  Anchor,
  ThemeIcon,
  Grid,
  Breadcrumbs,
  Alert,
  Menu,
  Progress,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  IconArrowLeft,
  IconPaperclip,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconAlertCircle,
  IconUser,
  IconHeadset,
  IconShield,
  IconDownload,
  IconChevronRight,
  IconClock,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  changeStatus,
  changePriority,
  assignTicket,
  addComment,
  editComment,
  deleteComment,
} from '@/store/slices/ticketsSlice';
import { addLog } from '@/store/slices/auditSlice';
import { addNotification } from '@/store/slices/notificationsSlice';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { formatDateTime, formatRelative, formatBytes } from '@/utils/format';
import { getSlaInfo, formatSlaTimeRemaining } from '@/utils/sla';
import type { TicketStatus, TicketPriority, Attachment, UserRole } from '@/types';

function isAllowedType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some((pattern) => {
    if (pattern.endsWith('/*')) return file.type.startsWith(pattern.replace('/*', '/'));
    if (pattern.startsWith('.')) return file.name.toLowerCase().endsWith(pattern.toLowerCase());
    return file.type === pattern;
  });
}

const roleIcon: Record<UserRole, React.ReactNode> = {
  admin: <IconShield size={12} />,
  agent: <IconHeadset size={12} />,
  requester: <IconUser size={12} />,
};

const roleColor: Record<UserRole, string> = {
  admin: 'red',
  agent: 'blue',
  requester: 'green',
};

const roleLabel: Record<UserRole, string> = {
  admin: 'Admin',
  agent: 'Agent',
  requester: 'Requester',
};

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const tickets = useAppSelector((s) => s.tickets.tickets);
  const users = useAppSelector((s) => s.users.users);
  const statuses = useAppSelector((s) => s.statuses.statuses);
  const settings = useAppSelector((s) => s.settings);
  const slaConfigs = useAppSelector((s) => s.sla.configs);

  const ticket = tickets.find((t) => t.id === id);

  const [commentText, setCommentText] = useState('');
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [commentFileError, setCommentFileError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  const allowedTypes = settings.allowedFileTypes ?? [];
  const maxBytes = (settings.maxAttachmentSizeMB ?? 10) * 1024 * 1024;

  function validateCommentFiles(fs: File[]): string {
    for (const f of fs) {
      if (f.size > maxBytes) return `"${f.name}" exceeds the ${settings.maxAttachmentSizeMB} MB size limit.`;
      if (allowedTypes.length > 0 && !isAllowedType(f, allowedTypes)) return `"${f.name}" has an unsupported file type.`;
    }
    return '';
  }

  if (!ticket) {
    return (
      <Container p="lg">
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Ticket not found">
          Ticket {id} does not exist.{' '}
          <Anchor component={Link} to="/tickets">Go back</Anchor>
        </Alert>
      </Container>
    );
  }

  const canManage = user?.role === 'admin' || user?.role === 'agent';
  const isAssignedAgent = user?.role === 'agent' && ticket.assignedAgentId === user.id;
  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent';
  const isRequester = user?.role === 'requester' && ticket.requesterId === user.id;
  const canComment = isAdmin || isAssignedAgent || isRequester;
  const canAssign = isAdmin || isAgent;

  const slaInfo = getSlaInfo(ticket, slaConfigs);
  const slaColor = slaInfo?.status === 'breached' ? 'red' : slaInfo?.status === 'near_breach' ? 'orange' : 'green';

  const currentStatus = statuses.find((s) => s.key === ticket.status);
  const allowedNextStatuses = currentStatus?.allowedTransitions ?? [];

  const agentOptions = [
    { value: '', label: 'Unassigned' },
    ...users.filter((u) => u.role === 'agent' && u.isActive).map((u) => ({ value: u.id, label: u.name })),
  ];

  function handleStatusChange(newStatus: TicketStatus) {
    if (!user || !ticket) return;
    dispatch(changeStatus({ ticketId: ticket.id, status: newStatus, userId: user.id, userName: user.name }));
    dispatch(addLog({
      action: 'Status Changed',
      entity: 'Ticket',
      entityId: ticket.id,
      userId: user.id,
      userName: user.name,
      details: `Changed status from ${ticket.status} to ${newStatus}`,
      previousValue: ticket.status,
      newValue: newStatus,
    }));
    const recipient = newStatus === 'resolved' || newStatus === 'closed'
      ? ticket.requesterId
      : ticket.assignedAgentId;
    if (recipient && recipient !== user.id) {
      dispatch(addNotification({
        userId: recipient,
        message: `${user.name} changed ticket status to ${newStatus}`,
        ticketId: ticket.id,
        ticketTitle: ticket.title,
      }));
    }
    notifications.show({ title: 'Status updated', message: `Status changed to ${newStatus}`, color: 'green' });
  }

  function handlePriorityChange(newPriority: TicketPriority) {
    if (!user || !ticket) return;
    dispatch(changePriority({ ticketId: ticket.id, priority: newPriority, userId: user.id, userName: user.name }));
    dispatch(addLog({
      action: 'Priority Changed',
      entity: 'Ticket',
      entityId: ticket.id,
      userId: user.id,
      userName: user.name,
      details: `Changed priority from ${ticket.priority} to ${newPriority}`,
      previousValue: ticket.priority,
      newValue: newPriority,
    }));
    notifications.show({ title: 'Priority updated', message: `Priority changed to ${newPriority}`, color: 'green' });
  }

  function handleAssign(agentId: string) {
    if (!user || !ticket || !canAssign) return;
    const agent = users.find((u) => u.id === agentId);
    dispatch(assignTicket({
      ticketId: ticket.id,
      agentId: agentId || undefined,
      agentName: agent?.name,
      adminId: user.id,
      adminName: user.name,
    }));
    dispatch(addLog({
      action: 'Ticket Assigned',
      entity: 'Ticket',
      entityId: ticket.id,
      userId: user.id,
      userName: user.name,
      details: `Assigned ticket to ${agent?.name ?? 'Unassigned'}`,
      previousValue: ticket.assignedAgentName ?? 'Unassigned',
      newValue: agent?.name ?? 'Unassigned',
    }));
    if (agentId) {
      dispatch(addNotification({
        userId: agentId,
        message: `You have been assigned ticket ${ticket.id}`,
        ticketId: ticket.id,
        ticketTitle: ticket.title,
      }));
    }
    notifications.show({ title: 'Assignment updated', message: agent ? `Assigned to ${agent.name}` : 'Ticket unassigned', color: 'green' });
  }

  function handleSelfAssign() {
    if (!user || !isAgent) return;
    handleAssign(user.id);
  }

  function handleAddComment(ev: React.FormEvent) {
    ev.preventDefault();
    if (!commentText.trim()) { setCommentError('Comment text is required'); return; }
    if (commentFileError) return;
    if (!user || !ticket || !canComment) return;

    const attachments: Attachment[] = commentFiles.map((f, i) => ({
      id: `att-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      fileType: f.type,
    }));

    dispatch(addComment({
      ticketId: ticket.id,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      text: commentText.trim(),
      attachments,
    }));

    const notifyUserId = user.role === 'requester' ? ticket.assignedAgentId : ticket.requesterId;
    if (notifyUserId && notifyUserId !== user.id) {
      dispatch(addNotification({
        userId: notifyUserId,
        message: `${user.name} added a comment to ticket ${ticket.id}`,
        ticketId: ticket.id,
        ticketTitle: ticket.title,
      }));
    }

    setCommentText('');
    setCommentFiles([]);
    setCommentError('');
    notifications.show({ title: 'Comment added', message: 'Your comment has been posted.', color: 'green' });
  }

  function startEditComment(commentId: string, text: string) {
    setEditingCommentId(commentId);
    setEditText(text);
  }

  function saveEditComment() {
    if (!editingCommentId || !editText.trim() || !ticket) return;
    dispatch(editComment({ ticketId: ticket.id, commentId: editingCommentId, text: editText.trim() }));
    setEditingCommentId(null);
    setEditText('');
    notifications.show({ title: 'Comment updated', message: 'Comment has been edited.', color: 'blue' });
  }

  function confirmDeleteComment(commentId: string) {
    setDeleteCommentId(commentId);
    openDeleteModal();
  }

  function handleDeleteComment() {
    if (!deleteCommentId || !ticket) return;
    dispatch(deleteComment({ ticketId: ticket.id, commentId: deleteCommentId }));
    closeDeleteModal();
    setDeleteCommentId(null);
    notifications.show({ title: 'Comment deleted', message: 'Comment has been removed.', color: 'red' });
  }

  function canEditComment(authorId: string) {
    if (!user) return false;
    if (user.id === authorId) return true;
    if (user.role === 'admin') return true;
    if (user.role === 'agent' && isAssignedAgent) return true;
    return false;
  }

  function canDeleteComment(authorId: string) {
    if (!user) return false;
    if (user.id === authorId) return true;
    if (user.role === 'admin') return true;
    return false;
  }

  const baseListRoute = user?.role === 'requester' ? '/my-tickets' : '/tickets';

  return (
    <Container fluid p="lg">
      <Stack gap="lg">
        <div>
          <Breadcrumbs separator={<IconChevronRight size={14} />} mb="xs">
            <Anchor component={Link} to={baseListRoute} size="sm">Tickets</Anchor>
            <Text size="sm" c="dimmed">{ticket.id}</Text>
          </Breadcrumbs>
          <Group>
            <ActionIcon variant="subtle" color="gray" onClick={() => navigate(-1)}>
              <IconArrowLeft size={18} />
            </ActionIcon>
            <div>
              <Group gap="xs" align="center">
                <Badge variant="outline" style={{ fontFamily: 'monospace' }}>{ticket.id}</Badge>
                <Title order={2} fw={600}>{ticket.title}</Title>
              </Group>
              <Text size="sm" c="dimmed">
                Opened by {ticket.requesterName} · {formatRelative(ticket.createdAt)}
              </Text>
            </div>
          </Group>
        </div>

        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="lg">
              <Card withBorder radius="md" padding="lg">
                <Stack gap="md">
                  <div>
                    <Text fw={600} mb="xs">Description</Text>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</Text>
                  </div>

                  {ticket.attachments.length > 0 && (
                    <>
                      <Divider />
                      <div>
                        <Text fw={600} mb="xs" size="sm">Attachments ({ticket.attachments.length})</Text>
                        <Stack gap="xs">
                          {ticket.attachments.map((att) => (
                            <Group key={att.id} gap="xs">
                              <IconPaperclip size={14} color="var(--mantine-color-blue-5)" />
                              <Text size="sm">{att.name}</Text>
                              <Text size="xs" c="dimmed">({formatBytes(att.size)})</Text>
                              <ActionIcon variant="subtle" size="xs" color="blue">
                                <IconDownload size={12} />
                              </ActionIcon>
                            </Group>
                          ))}
                        </Stack>
                      </div>
                    </>
                  )}
                </Stack>
              </Card>

              <Card withBorder radius="md" padding="lg">
                <Stack gap="md">
                  <Text fw={600}>Comments ({ticket.comments.length})</Text>

                  {ticket.comments.length === 0 && (
                    <Text size="sm" c="dimmed" ta="center" py="md">No comments yet.</Text>
                  )}

                  {ticket.comments.map((comment) => (
                    <Box key={comment.id}>
                      <Group justify="space-between" align="flex-start">
                        <Group gap="sm" align="flex-start">
                          <Avatar
                            size={32}
                            radius="xl"
                            color={roleColor[comment.authorRole]}
                            name={comment.authorName}
                          />
                          <div>
                            <Group gap="xs">
                              <Text size="sm" fw={600}>{comment.authorName}</Text>
                              <Badge
                                size="xs"
                                color={roleColor[comment.authorRole]}
                                variant="light"
                                leftSection={roleIcon[comment.authorRole]}
                              >
                                {roleLabel[comment.authorRole]}
                              </Badge>
                              <Text size="xs" c="dimmed">{formatRelative(comment.createdAt)}</Text>
                              {comment.updatedAt && (
                                <Text size="xs" c="dimmed">(edited)</Text>
                              )}
                            </Group>

                            {editingCommentId === comment.id ? (
                              <Stack gap="xs" mt="xs">
                                <Textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.currentTarget.value)}
                                  minRows={2}
                                  autosize
                                />
                                <Group gap="xs">
                                  <Button size="xs" onClick={saveEditComment}>Save</Button>
                                  <Button size="xs" variant="subtle" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                                </Group>
                              </Stack>
                            ) : (
                              <Text size="sm" mt={4} style={{ whiteSpace: 'pre-wrap' }}>{comment.text}</Text>
                            )}

                            {comment.attachments.length > 0 && (
                              <Stack gap={4} mt="xs">
                                {comment.attachments.map((att) => (
                                  <Group key={att.id} gap="xs">
                                    <IconPaperclip size={12} />
                                    <Text size="xs">{att.name}</Text>
                                    <Text size="xs" c="dimmed">({formatBytes(att.size)})</Text>
                                  </Group>
                                ))}
                              </Stack>
                            )}
                          </div>
                        </Group>

                        {(canEditComment(comment.authorId) || canDeleteComment(comment.authorId)) && editingCommentId !== comment.id && (
                          <Menu shadow="sm" position="bottom-end">
                            <Menu.Target>
                              <ActionIcon variant="subtle" color="gray" size="sm">
                                <IconDotsVertical size={14} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              {canEditComment(comment.authorId) && (
                                <Menu.Item
                                  leftSection={<IconEdit size={14} />}
                                  onClick={() => startEditComment(comment.id, comment.text)}
                                >
                                  Edit
                                </Menu.Item>
                              )}
                              {canDeleteComment(comment.authorId) && (
                                <Menu.Item
                                  leftSection={<IconTrash size={14} />}
                                  color="red"
                                  onClick={() => confirmDeleteComment(comment.id)}
                                >
                                  Delete
                                </Menu.Item>
                              )}
                            </Menu.Dropdown>
                          </Menu>
                        )}
                      </Group>
                      <Divider mt="md" />
                    </Box>
                  ))}

                  {canComment && (
                    <form onSubmit={handleAddComment}>
                      <Stack gap="sm">
                        <Textarea
                          label="Add a comment"
                          placeholder="Write your comment here…"
                          minRows={3}
                          autosize
                          value={commentText}
                          onChange={(e) => { setCommentText(e.currentTarget.value); setCommentError(''); }}
                          error={commentError}
                        />
                        {settings.attachmentsEnabled && (
                          <>
                            <FileInput
                              label="Attachments"
                              placeholder="Attach files (optional)"
                              leftSection={<IconPaperclip size={14} />}
                              multiple
                              value={commentFiles}
                              onChange={(fs) => {
                                const err = validateCommentFiles(fs);
                                setCommentFileError(err);
                                if (!err) setCommentFiles(fs);
                              }}
                              error={commentFileError || undefined}
                            />
                            {commentFileError && (
                              <Alert icon={<IconAlertCircle size={14} />} color="red" variant="light">
                                {commentFileError}
                              </Alert>
                            )}
                          </>
                        )}
                        <Group justify="flex-end">
                          <Button type="submit" size="sm">Post Comment</Button>
                        </Group>
                      </Stack>
                    </form>
                  )}

                  {!canComment && user?.role === 'agent' && !isAssignedAgent && (
                    <Alert icon={<IconAlertCircle size={14} />} color="yellow" variant="light">
                      You can only comment on tickets assigned to you.
                    </Alert>
                  )}
                </Stack>
              </Card>

              <Card withBorder radius="md" padding="lg">
                <Stack gap="md">
                  <Text fw={600}>Ticket History</Text>
                  {ticket.history.length === 0 ? (
                    <Text size="sm" c="dimmed">No history available.</Text>
                  ) : (
                    <Stack gap="xs">
                      {[...ticket.history].reverse().map((entry) => (
                        <Group key={entry.id} gap="sm" align="flex-start">
                          <ThemeIcon size={24} radius="xl" variant="light" color="gray">
                            <IconUser size={12} />
                          </ThemeIcon>
                          <div style={{ flex: 1 }}>
                            <Group gap="xs">
                              <Text size="sm" fw={500}>{entry.userName}</Text>
                              <Text size="sm" c="dimmed">{entry.action}</Text>
                              {entry.previousValue && entry.newValue && (
                                <Group gap={4}>
                                  <Badge size="xs" variant="outline" color="gray">{entry.previousValue}</Badge>
                                  <Text size="xs" c="dimmed">→</Text>
                                  <Badge size="xs" variant="filled" color="blue">{entry.newValue}</Badge>
                                </Group>
                              )}
                            </Group>
                            <Text size="xs" c="dimmed">{formatDateTime(entry.createdAt)}</Text>
                          </div>
                        </Group>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              <Card withBorder radius="md" padding="md">
                <Stack gap="sm">
                  <Text fw={600} size="sm">Ticket Details</Text>
                  <Divider />
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Status</Text>
                    <StatusBadge status={ticket.status} />
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Priority</Text>
                    <PriorityBadge priority={ticket.priority} />
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Category</Text>
                    <Text size="sm">{ticket.category}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Requester</Text>
                    <Text size="sm">{ticket.requesterName}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Assigned To</Text>
                    <Text size="sm" c={ticket.assignedAgentName ? undefined : 'dimmed'}>
                      {ticket.assignedAgentName ?? 'Unassigned'}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Created</Text>
                    <Text size="xs">{formatDateTime(ticket.createdAt)}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Updated</Text>
                    <Text size="xs">{formatDateTime(ticket.updatedAt)}</Text>
                  </Group>
                  {ticket.resolvedAt && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Resolved</Text>
                      <Text size="xs">{formatDateTime(ticket.resolvedAt)}</Text>
                    </Group>
                  )}
                  {ticket.closedAt && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Closed</Text>
                      <Text size="xs">{formatDateTime(ticket.closedAt)}</Text>
                    </Group>
                  )}
                </Stack>
              </Card>

              {canManage && allowedNextStatuses.length > 0 && (
                <Card withBorder radius="md" padding="md">
                  <Stack gap="sm">
                    <Text fw={600} size="sm">Change Status</Text>
                    <Stack gap="xs">
                      {allowedNextStatuses.map((s) => {
                        const sc = statuses.find((x) => x.key === s);
                        return (
                          <Button
                            key={s}
                            variant="light"
                            color={sc?.color ?? 'gray'}
                            size="xs"
                            fullWidth
                            onClick={() => handleStatusChange(s)}
                          >
                            → {sc?.name ?? s}
                          </Button>
                        );
                      })}
                    </Stack>
                  </Stack>
                </Card>
              )}

              {canManage && (
                <Card withBorder radius="md" padding="md">
                  <Stack gap="sm">
                    <Text fw={600} size="sm">Change Priority</Text>
                    <Select
                      size="sm"
                      value={ticket.priority}
                      data={[
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' },
                        { value: 'critical', label: 'Critical' },
                      ]}
                      onChange={(v) => v && handlePriorityChange(v as TicketPriority)}
                    />
                  </Stack>
                </Card>
              )}

              {canAssign && (
                <Card withBorder radius="md" padding="md">
                  <Stack gap="sm">
                    <Text fw={600} size="sm">Assign Agent</Text>
                    {isAgent && !isAssignedAgent && (
                      <Button size="xs" variant="light" onClick={handleSelfAssign}>
                        Assign to me
                      </Button>
                    )}
                    {isAdmin && (
                      <Select
                        size="sm"
                        value={ticket.assignedAgentId ?? ''}
                        data={agentOptions}
                        onChange={(v) => v !== null && handleAssign(v)}
                        placeholder="Select agent"
                      />
                    )}
                    {isAgent && isAssignedAgent && (
                      <Text size="xs" c="dimmed">You are assigned to this ticket.</Text>
                    )}
                  </Stack>
                </Card>
              )}

              {slaInfo && (
                <Card withBorder radius="md" padding="md">
                  <Stack gap="sm">
                    <Group gap="xs">
                      <IconClock size={14} />
                      <Text fw={600} size="sm">SLA Status</Text>
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Status</Text>
                      <Badge
                        color={slaColor}
                        variant="light"
                        size="sm"
                      >
                        {slaInfo.status === 'breached' ? 'Breached' :
                         slaInfo.status === 'near_breach' ? 'Near Breach' :
                         slaInfo.status === 'resolved' ? 'Resolved' : 'On Track'}
                      </Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Deadline</Text>
                      <Text size="xs">{slaInfo.deadline.toLocaleString()}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Time</Text>
                      <Text size="xs" c={slaColor}>{formatSlaTimeRemaining(slaInfo.hoursRemaining)}</Text>
                    </Group>
                    <Progress
                      value={slaInfo.percentElapsed}
                      color={slaColor}
                      size="sm"
                      radius="xl"
                    />
                  </Stack>
                </Card>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Comment"
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">Are you sure you want to delete this comment? This action cannot be undone.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeDeleteModal}>Cancel</Button>
            <Button color="red" onClick={handleDeleteComment}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
