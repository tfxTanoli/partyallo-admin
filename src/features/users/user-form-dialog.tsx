import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldAlert } from 'lucide-react';
import { USER_ROLES, USER_STATUSES, type User, type UserFormValues } from '@/types';
import { USER_ROLE_META, USER_STATUS_META } from '@/constants/status';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const userSchema = z.object({
  displayName: z.string().trim().min(2, 'Enter at least 2 characters').max(80, 'Name is too long'),
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUSES),
});

export interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSubmit: (values: UserFormValues) => Promise<unknown>;
  loading?: boolean;
  /** True when editing your own account — role and status are then locked. */
  isSelf?: boolean;
}

/**
 * Editing only. New accounts are created by signing up in the crew app (or from
 * the Firebase console) — this console never handles passwords, so it cannot
 * mint an Auth account.
 */
export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  loading = false,
  isSelf = false,
}: UserFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { displayName: '', role: 'crew', status: 'active' },
  });

  useEffect(() => {
    if (!open || !user) return;
    reset({ displayName: user.displayName, role: user.role, status: user.status });
  }, [open, user, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>
            {user?.email} · signs in with{' '}
            {user?.providers.includes('google.com') ? 'Google' : 'email and password'}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-5 pb-6">
            <Field label="Display name" required error={errors.displayName?.message}>
              <Input
                placeholder="Ava Thompson"
                invalid={Boolean(errors.displayName)}
                {...register('displayName')}
              />
            </Field>

            {isSelf ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning-soft p-3.5">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                <p className="text-xs leading-relaxed text-warning">
                  This is your own account. Role and status are locked so you cannot accidentally
                  remove your own access.
                </p>
              </div>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Field
                    label="Role"
                    required
                    error={errors.role?.message}
                    hint="Only admins can sign in to this console."
                  >
                    <Select value={field.value} onValueChange={field.onChange} disabled={isSelf}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {USER_ROLE_META[role].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Field
                    label="Status"
                    required
                    error={errors.status?.message}
                    hint="Disabling blocks console access only."
                  >
                    <Select value={field.value} onValueChange={field.onChange} disabled={isSelf}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {USER_STATUS_META[status].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </div>

            <p className="rounded-xl border border-border bg-muted/40 p-3.5 text-xs leading-relaxed text-muted-foreground">
              Email address and sign-in method are owned by Firebase Authentication and cannot be
              changed here.
            </p>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
