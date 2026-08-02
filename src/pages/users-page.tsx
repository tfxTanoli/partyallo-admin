import { useCallback, useMemo } from 'react';
import {
  Eye,
  Filter,
  MailCheck,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users as UsersIcon,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/common/page-header';
import { SearchInput } from '@/components/common/search-input';
import { FilterSelect } from '@/components/common/filter-select';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { Pagination } from '@/components/common/pagination';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { RowActions } from '@/components/common/row-actions';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { UserRoleBadge, UserStatusBadge } from '@/components/common/status-badge';
import { useDataTable } from '@/hooks/use-data-table';
import { useDisclosure, useEntityDisclosure } from '@/hooks/use-disclosure';
import {
  useDeleteUser,
  useInviteUser,
  useResendInvite,
  useSetUserRole,
  useUpdateUser,
  useUsers,
} from '@/features/users/hooks/use-users';
import { UserFormDialog } from '@/features/users/user-form-dialog';
import { InviteUserDialog } from '@/features/users/invite-user-dialog';
import { UserDetailsDrawer } from '@/features/users/user-details-drawer';
import { useAuth } from '@/providers/auth-provider';
import { USER_ROLE_META, USER_STATUS_META } from '@/constants/status';
import { formatDate, formatRelative } from '@/utils/format';
import { USER_ROLES, USER_STATUSES } from '@/types';
import type { SelectOption, User, UserFilters, UserSortField } from '@/types';

type RoleFilter = NonNullable<UserFilters['role']>;
type StatusFilter = NonNullable<UserFilters['status']>;

const ROLE_OPTIONS: SelectOption<RoleFilter>[] = [
  { label: 'All roles', value: 'all' },
  ...USER_ROLES.map((role) => ({ label: USER_ROLE_META[role].label, value: role })),
];

const STATUS_OPTIONS: SelectOption<StatusFilter>[] = [
  { label: 'All statuses', value: 'all' },
  ...USER_STATUSES.map((status) => ({ label: USER_STATUS_META[status].label, value: status })),
];

const INITIAL_FILTERS: Required<UserFilters> = { role: 'all', status: 'all' };

export default function UsersPage() {
  const { profile } = useAuth();

  const table = useDataTable<Required<UserFilters>, UserSortField>({
    initialSort: { field: 'createdAt', direction: 'desc' },
    initialFilters: INITIAL_FILTERS,
  });

  const { data, isPending, isError, refetch } = useUsers(table.query);

  const inviteDialog = useDisclosure();
  const editDialog = useEntityDisclosure<User>();
  const detailsDrawer = useEntityDisclosure<User>();
  const deleteDialog = useEntityDisclosure<User>();
  const roleDialog = useEntityDisclosure<User>();

  const inviteUser = useInviteUser();
  const resendInvite = useResendInvite();
  const updateUser = useUpdateUser();
  const setUserRole = useSetUserRole();
  const deleteUser = useDeleteUser();

  const isSelf = useCallback((user: User) => user.id === profile?.id, [profile?.id]);

  const openEdit = editDialog.open;
  const openDelete = deleteDialog.open;
  const openRole = roleDialog.open;
  const closeDetails = detailsDrawer.close;

  const handleEditFromDrawer = useCallback(
    (user: User) => {
      closeDetails();
      openEdit(user);
    },
    [closeDetails, openEdit],
  );

  const handleRoleFromDrawer = useCallback(
    (user: User) => {
      closeDetails();
      openRole(user);
    },
    [closeDetails, openRole],
  );

  const handleDeleteFromDrawer = useCallback(
    (user: User) => {
      closeDetails();
      openDelete(user);
    },
    [closeDetails, openDelete],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteDialog.entity) return;
    await deleteUser.mutateAsync(deleteDialog.entity.id);
    deleteDialog.close();
  }, [deleteDialog, deleteUser]);

  const confirmRole = useCallback(async () => {
    const user = roleDialog.entity;
    if (!user) return;
    await setUserRole.mutateAsync({ id: user.id, role: user.role === 'admin' ? 'crew' : 'admin' });
    roleDialog.close();
  }, [roleDialog, setUserRole]);

  const columns = useMemo<DataTableColumn<User, UserSortField>[]>(
    () => [
      {
        id: 'user',
        header: 'User',
        sortField: 'displayName',
        cell: (user) => (
          <div className="flex items-center gap-3">
            <Avatar name={user.displayName} src={user.photoUrl} size="sm" />
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate font-medium text-foreground">
                {user.displayName}
                {isSelf(user) ? (
                  <Badge tone="primary" size="sm">
                    You
                  </Badge>
                ) : null}
              </p>
              <p className="truncate text-xs text-muted-foreground md:hidden">{user.email}</p>
            </div>
          </div>
        ),
      },
      {
        id: 'email',
        header: 'Email',
        sortField: 'email',
        hideBelow: 'md',
        cell: (user) => <span className="text-muted-foreground">{user.email}</span>,
      },
      {
        id: 'provider',
        header: 'Sign-in',
        hideBelow: 'xl',
        cell: (user) => (
          <span className="text-muted-foreground">
            {user.providers.includes('google.com') ? 'Google' : 'Password'}
          </span>
        ),
      },
      {
        id: 'role',
        header: 'Role',
        sortField: 'role',
        cell: (user) => <UserRoleBadge role={user.role} />,
      },
      {
        id: 'status',
        header: 'Status',
        sortField: 'status',
        hideBelow: 'lg',
        cell: (user) => <UserStatusBadge status={user.status} />,
      },
      {
        id: 'created',
        header: 'Joined',
        sortField: 'createdAt',
        hideBelow: 'lg',
        cell: (user) => (
          <div className="whitespace-nowrap">
            <p className="text-foreground">{formatDate(user.createdAt)}</p>
            <p className="text-xs text-muted-foreground">
              {user.lastSignInAt ? `Seen ${formatRelative(user.lastSignInAt)}` : 'Never signed in'}
            </p>
          </div>
        ),
      },
      {
        id: 'actions',
        header: <span className="sr-only">Actions</span>,
        align: 'right',
        headerClassName: 'w-16',
        cell: (user) => (
          <RowActions label={`Actions for ${user.displayName}`}>
            <DropdownMenuItem onSelect={() => detailsDrawer.open(user)}>
              <Eye />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editDialog.open(user)}>
              <Pencil />
              Edit profile
            </DropdownMenuItem>
            {/* Only password accounts have a password to reset; Google users
                manage theirs with Google. */}
            {user.providers.includes('password') ? (
              <DropdownMenuItem onSelect={() => resendInvite.mutate(user.email)}>
                <MailCheck />
                Resend invite
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={isSelf(user)} onSelect={() => roleDialog.open(user)}>
              {user.role === 'admin' ? <ShieldOff /> : <ShieldCheck />}
              {user.role === 'admin' ? 'Remove admin' : 'Make admin'}
            </DropdownMenuItem>
            <DropdownMenuItem
              destructive
              disabled={isSelf(user)}
              onSelect={() => deleteDialog.open(user)}
            >
              <Trash2 />
              Remove profile
            </DropdownMenuItem>
          </RowActions>
        ),
      },
    ],
    [deleteDialog, detailsDrawer, editDialog, isSelf, resendInvite, roleDialog],
  );

  const hasActiveQuery = table.debouncedSearch.length > 0 || table.activeFilterCount > 0;
  const adminCount = data?.items.filter((user) => user.role === 'admin').length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Everyone with a PartyAllo account. Promote a colleague to give them console access."
        breadcrumbs={[{ label: 'Users' }]}
        meta={
          data ? (
            <span className="text-sm text-muted-foreground">
              {data.total} {data.total === 1 ? 'account' : 'accounts'} · {adminCount} admin
              {adminCount === 1 ? '' : 's'} on this page
            </span>
          ) : null
        }
        actions={
          <Button leftIcon={<Plus />} onClick={inviteDialog.open}>
            Add user
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:p-5">
          <SearchInput
            value={table.search}
            onChange={table.setSearch}
            placeholder="Search by name or email…"
            className="sm:max-w-sm"
          />

          <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
            <FilterSelect
              ariaLabel="Filter by role"
              icon={ShieldCheck}
              value={table.filters.role}
              onChange={(value) => table.setFilter('role', value)}
              options={ROLE_OPTIONS}
            />
            <FilterSelect
              ariaLabel="Filter by status"
              icon={Filter}
              value={table.filters.status}
              onChange={(value) => table.setFilter('status', value)}
              options={STATUS_OPTIONS}
            />
            {hasActiveQuery ? (
              <Button variant="ghost" size="sm" leftIcon={<RotateCcw />} onClick={table.resetFilters}>
                Reset
              </Button>
            ) : null}
          </div>
        </div>

        {isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data?.items ?? []}
              getRowId={(user) => user.id}
              isLoading={isPending}
              sort={table.sort}
              onSortChange={table.toggleSort}
              onRowClick={detailsDrawer.open}
              emptyState={
                hasActiveQuery ? (
                  <EmptyState
                    icon={UsersIcon}
                    title="No users match your filters"
                    description="Try a different search term, or clear the filters to see every account."
                    action={
                      <Button variant="outline" leftIcon={<RotateCcw />} onClick={table.resetFilters}>
                        Clear filters
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={UsersIcon}
                    title="No accounts yet"
                    description="Add your first team member, or wait for someone to sign up in the PartyAllo crew app."
                    action={
                      <Button leftIcon={<Plus />} onClick={inviteDialog.open}>
                        Add user
                      </Button>
                    }
                  />
                )
              }
            />

            {data && data.total > 0 ? (
              <Pagination
                page={data.page}
                pageCount={data.pageCount}
                pageSize={data.pageSize}
                total={data.total}
                onPageChange={table.setPage}
                onPageSizeChange={table.setPageSize}
                itemLabel="accounts"
              />
            ) : null}
          </>
        )}
      </Card>

      <InviteUserDialog
        open={inviteDialog.isOpen}
        onOpenChange={inviteDialog.setOpen}
        loading={inviteUser.isPending}
        onSubmit={(values) => inviteUser.mutateAsync(values)}
      />

      <UserFormDialog
        open={editDialog.isOpen}
        onOpenChange={editDialog.setOpen}
        user={editDialog.entity}
        isSelf={editDialog.entity ? isSelf(editDialog.entity) : false}
        loading={updateUser.isPending}
        onSubmit={(values) => updateUser.mutateAsync({ id: editDialog.entity!.id, values })}
      />

      <UserDetailsDrawer
        open={detailsDrawer.isOpen}
        onOpenChange={detailsDrawer.setOpen}
        user={detailsDrawer.entity}
        isSelf={detailsDrawer.entity ? isSelf(detailsDrawer.entity) : false}
        onEdit={handleEditFromDrawer}
        onToggleRole={handleRoleFromDrawer}
        onDelete={handleDeleteFromDrawer}
      />

      <ConfirmDialog
        open={roleDialog.isOpen}
        onOpenChange={roleDialog.setOpen}
        tone={roleDialog.entity?.role === 'admin' ? 'warning' : 'info'}
        title={
          roleDialog.entity?.role === 'admin' ? 'Remove admin access?' : 'Grant admin access?'
        }
        description={
          roleDialog.entity?.role === 'admin' ? (
            <>
              <strong className="text-foreground">{roleDialog.entity?.displayName}</strong> will no
              longer be able to sign in to this console. Their PartyAllo crew app access is
              unaffected.
            </>
          ) : (
            <>
              <strong className="text-foreground">{roleDialog.entity?.displayName}</strong> will be
              able to sign in here and manage every event, station and user — including changing
              other people's roles.
            </>
          )
        }
        confirmLabel={roleDialog.entity?.role === 'admin' ? 'Remove admin' : 'Make admin'}
        loading={setUserRole.isPending}
        onConfirm={() => void confirmRole()}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Remove this profile?"
        description={
          <>
            The profile and role for{' '}
            <strong className="text-foreground">{deleteDialog.entity?.displayName}</strong> will be
            deleted. Their Firebase Authentication account is <em>not</em> deleted — they can still
            sign in to the crew app, and a fresh crew profile will be created next time they do.
          </>
        }
        confirmLabel="Remove profile"
        loading={deleteUser.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
