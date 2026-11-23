import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  FileInput,
  Alert,
} from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPaperclip, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createTicket, assignTicket } from '@/store/slices/ticketsSlice';
import { addLog } from '@/store/slices/auditSlice';
import { addNotification } from '@/store/slices/notificationsSlice';
import type { TicketPriority, Attachment } from '@/types';

function isAllowedType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some((pattern) => {
    if (pattern.endsWith('/*')) {
      return file.type.startsWith(pattern.replace('/*', '/'));
    }
    if (pattern.startsWith('.')) {
      return file.name.toLowerCase().endsWith(pattern.toLowerCase());
    }
    return file.type === pattern;
  });
}

export function CreateTicketPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const categories = useAppSelector((s) => s.categories.categories);
  const settings = useAppSelector((s) => s.settings);
  const users = useAppSelector((s) => s.users.users);
  const allTickets = useAppSelector((s) => s.tickets.tickets);
  const nextId = useAppSelector((s) => s.tickets.nextId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<TicketPriority>(settings.defaultPriority);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const allowedTypes = settings.allowedFileTypes ?? [];
  const maxBytes = (settings.maxAttachmentSizeMB ?? 10) * 1024 * 1024;

  function validateFiles(fs: File[]): string {
    for (const f of fs) {
      if (f.size > maxBytes) return `"${f.name}" exceeds the ${settings.maxAttachmentSizeMB} MB size limit.`;
      if (allowedTypes.length > 0 && !isAllowedType(f, allowedTypes)) {
        return `"${f.name}" has an unsupported file type.`;
      }
    }
    return '';
  }

  function handleFilesChange(fs: File[]) {
    const err = validateFiles(fs);
    setFileError(err);
    if (!err) setFiles(fs);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!description.trim()) e.description = 'Description is required';
    if (!category) e.category = 'Category is required';
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (fileError) return;
    if (!user) return;

    setLoading(true);

    const newTicketId = `HD-${String(nextId).padStart(6, '0')}`;

    const attachments: Attachment[] = files.map((f, i) => ({
      id: `att-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      fileType: f.type,
    }));

    dispatch(
      createTicket({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        requesterId: user.id,
        requesterName: user.name,
        attachments,
      })
    );

    dispatch(
      addLog({
        action: 'Ticket Created',
        entity: 'Ticket',
        entityId: newTicketId,
        userId: user.id,
        userName: user.name,
        details: `Created ticket "${title.trim()}" with priority ${priority}`,
      })
    );

    // Auto-assign to least-busy active agent if enabled
    if (settings.autoAssignEnabled) {
      const activeAgents = users.filter((u) => u.role === 'agent' && u.isActive);
      if (activeAgents.length > 0) {
        const agentLoad = activeAgents.map((agent) => ({
          agent,
          load: allTickets.filter(
            (t) => t.assignedAgentId === agent.id && t.status !== 'closed' && t.status !== 'resolved'
          ).length,
        }));
        agentLoad.sort((a, b) => a.load - b.load);
        const target = agentLoad[0].agent;
        dispatch(assignTicket({
          ticketId: newTicketId,
          agentId: target.id,
          agentName: target.name,
          adminId: 'system',
          adminName: 'Auto-assign',
        }));
        dispatch(addNotification({
          userId: target.id,
          message: `You were auto-assigned ticket ${newTicketId}`,
          ticketId: newTicketId,
          ticketTitle: title.trim(),
        }));
        dispatch(addLog({
          action: 'Auto-Assigned',
          entity: 'Ticket',
          entityId: newTicketId,
          userId: 'system',
          userName: 'Auto-assign',
          details: `Auto-assigned to ${target.name} (${agentLoad[0].load} open tickets)`,
          newValue: target.name,
        }));
      }
    }

    notifications.show({
      title: 'Ticket created',
      message: `${newTicketId} has been submitted.`,
      color: 'green',
    });

    setLoading(false);
    navigate(`/tickets/${newTicketId}`, { replace: true });
  }

  const categoryOptions = categories.map((c) => ({ value: c.name, label: c.name }));
  const priorityOptions = [
    { value: 'low', label: 'Low — Minor issue with little impact' },
    { value: 'medium', label: 'Medium — Normal support request' },
    { value: 'high', label: 'High — Affects productivity' },
    { value: 'critical', label: 'Critical — Severe impact' },
  ];

  return (
    <Container size="md" p="lg">
      <Stack gap="lg">
        <div>
          <Title order={2} fw={600}>Create Ticket</Title>
          <Text c="dimmed" size="sm">Submit a new support request.</Text>
        </div>

        <form onSubmit={handleSubmit}>
          <Card withBorder radius="md" padding="lg">
            <Stack gap="md">
              <TextInput
                label="Title"
                description="Brief summary of the issue"
                placeholder="e.g. Cannot access email after update"
                required
                value={title}
                onChange={(e) => { setTitle(e.currentTarget.value); setErrors((x) => ({ ...x, title: '' })); }}
                error={errors.title}
              />

              <Textarea
                label="Description"
                description="Detailed description, steps to reproduce, and impact"
                placeholder="Describe the problem in detail…"
                required
                minRows={5}
                autosize
                value={description}
                onChange={(e) => { setDescription(e.currentTarget.value); setErrors((x) => ({ ...x, description: '' })); }}
                error={errors.description}
              />

              <Group grow>
                <Select
                  label="Category"
                  placeholder="Select category"
                  required
                  data={categoryOptions}
                  value={category}
                  onChange={(v) => { setCategory(v ?? ''); setErrors((x) => ({ ...x, category: '' })); }}
                  error={errors.category}
                />
                <Select
                  label="Priority"
                  data={priorityOptions}
                  value={priority}
                  onChange={(v) => v && setPriority(v as TicketPriority)}
                  required
                />
              </Group>

              {settings.attachmentsEnabled && (
                <>
                  <FileInput
                    label="Attachments"
                    description={`Optional. Max ${settings.maxAttachmentSizeMB} MB per file. Allowed: images, PDF, Office docs, text, CSV, ZIP.`}
                    placeholder="Click to attach files"
                    leftSection={<IconPaperclip size={16} />}
                    multiple
                    value={files}
                    onChange={handleFilesChange}
                    error={fileError || undefined}
                  />
                  {fileError && (
                    <Alert icon={<IconAlertCircle size={14} />} color="red" variant="light">
                      {fileError}
                    </Alert>
                  )}
                </>
              )}

              <Group justify="flex-end" mt="sm">
                <Button variant="default" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  Submit Ticket
                </Button>
              </Group>
            </Stack>
          </Card>
        </form>
      </Stack>
    </Container>
  );
}
