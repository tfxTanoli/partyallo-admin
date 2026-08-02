import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/services';
import { queryKeys } from '@/constants/query-keys';
import type {
  InviteUserFormValues,
  ListQuery,
  UserFilters,
  UserFormValues,
  UserRole,
  UserSortField,
} from '@/types';

/** Firestore rejects a role change from a non-admin — surface that plainly. */
function describeWriteError(error: unknown, fallback: string): string {
  const code = (error as { code?: string } | null)?.code ?? '';
  return code === 'permission-denied'
    ? 'Your account is not allowed to make that change.'
    : fallback;
}

export function useUsers(query: ListQuery<UserFilters, UserSortField>) {
  return useQuery({
    queryKey: queryKeys.users.list(query),
    queryFn: () => api.users.list(query),
    placeholderData: (previous) => previous,
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: InviteUserFormValues) => api.users.invite(values),
    onSuccess: ({ user, emailSent }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      if (emailSent) {
        toast.success(`${user.displayName} has been invited`, {
          description: `A set-a-password email is on its way to ${user.email}.`,
        });
      } else {
        // The account exists but the email failed — say so, don't imply success.
        toast.warning(`${user.displayName}'s account was created`, {
          description: 'The invite email could not be sent. Use “Resend invite” from their row.',
        });
      }
    },
    // The dialog renders the message inline, so no error toast here.
  });
}

export function useResendInvite() {
  return useMutation({
    mutationFn: (email: string) => api.users.resendInvite(email),
    onSuccess: (_data, email) =>
      toast.success('Invite resent', { description: `A new link is on its way to ${email}.` }),
    onError: () =>
      toast.error('Could not resend the invite', { description: 'Please try again shortly.' }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<UserFormValues> }) =>
      api.users.update(id, values),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('User updated', { description: `${user.displayName}'s profile has been saved.` });
    },
    onError: (error) =>
      toast.error('Could not update the user', {
        description: describeWriteError(error, 'Please try again.'),
      }),
  });
}

export function useSetUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => api.users.setRole(id, role),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success(
        user.role === 'admin' ? 'Promoted to admin' : 'Admin access removed',
        {
          description:
            user.role === 'admin'
              ? `${user.displayName} can now sign in to this console.`
              : `${user.displayName} can no longer sign in to this console.`,
        },
      );
    },
    onError: (error) =>
      toast.error('Could not change the role', {
        description: describeWriteError(error, 'Please try again.'),
      }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.users.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Profile removed', {
        description: 'The Firebase Auth account still exists — delete it from the console if needed.',
      });
    },
    onError: (error) =>
      toast.error('Could not remove the profile', {
        description: describeWriteError(error, 'Please try again.'),
      }),
  });
}
