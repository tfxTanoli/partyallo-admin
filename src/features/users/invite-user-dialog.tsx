import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MailCheck, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/utils/cn';
import { USER_ROLES, type InviteUserFormValues } from '@/types';
import { USER_ROLE_META } from '@/constants/status';
import { describeInviteError } from '@/services/firebase/invite.service';
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

const inviteSchema = z.object({
  displayName: z.string().trim().min(2, 'Enter at least 2 characters').max(80, 'Name is too long'),
  email: z.email('Enter a valid email address'),
  role: z.enum(USER_ROLES),
});

const EMPTY: InviteUserFormValues = { displayName: '', email: '', role: 'crew' };

export interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InviteUserFormValues) => Promise<unknown>;
  loading?: boolean;
}

export function InviteUserDialog({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}: InviteUserDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(EMPTY);
    setFormError(null);
  }, [open, reset]);

  const role = watch('role');

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      // Kept inline rather than a toast: the message usually tells the admin to
      // change something in this very form.
      setFormError(describeInviteError(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Add a user</DialogTitle>
          <DialogDescription>
            Creates their PartyAllo account and emails them a link to set their own password.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-5 pb-6">
            {formError ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft p-3.5"
              >
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" />
                <p className="text-sm leading-relaxed text-danger">{formError}</p>
              </div>
            ) : null}

            <Field label="Full name" required error={errors.displayName?.message}>
              <Input
                placeholder="Ava Thompson"
                autoComplete="off"
                invalid={Boolean(errors.displayName)}
                {...register('displayName')}
              />
            </Field>

            <Field
              label="Email"
              required
              hint="They'll receive an invite here. It becomes their sign-in address."
              error={errors.email?.message}
            >
              <Input
                type="email"
                placeholder="ava@partyallo.com"
                autoComplete="off"
                invalid={Boolean(errors.email)}
                {...register('email')}
              />
            </Field>

            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-none text-foreground">
                    Role<span className="ml-0.5 text-danger">*</span>
                  </p>
                  <div role="radiogroup" aria-label="Role" className="grid gap-2 sm:grid-cols-2">
                    {USER_ROLES.map((option) => {
                      const selected = field.value === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => field.onChange(option)}
                          className={cn(
                            'rounded-xl border p-3.5 text-left transition-all duration-200',
                            selected
                              ? 'border-primary bg-primary-soft'
                              : 'border-border hover:border-primary/30 hover:bg-accent',
                          )}
                        >
                          <span
                            className={cn(
                              'flex items-center gap-2 text-sm font-medium',
                              selected ? 'text-primary' : 'text-foreground',
                            )}
                          >
                            <ShieldCheck className="size-4" />
                            {USER_ROLE_META[option].label}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                            {option === 'admin'
                              ? 'Full access to this console, including user roles.'
                              : 'Uses the PartyAllo crew app only.'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            />

            {role === 'admin' ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning-soft p-3.5">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                <p className="text-xs leading-relaxed text-warning">
                  Admins can manage every event, station and user — including changing other
                  people's roles and removing admin access from others.
                </p>
              </div>
            ) : null}

            <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-3.5">
              <MailCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                You never handle a password. They receive an email, choose their own, and can then
                sign in{role === 'admin' ? ' here and to the crew app' : ' to the crew app'}.
              </p>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
