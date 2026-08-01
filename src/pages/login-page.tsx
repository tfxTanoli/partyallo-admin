import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Lock, Mail, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { BrandMark } from '@/components/common/brand-mark';
import { GoogleIcon } from '@/components/common/google-icon';
import { EASE_OUT_EXPO } from '@/components/common/motion';
import { FullPageLoader } from '@/components/common/loader';
import { useAuth } from '@/providers/auth-provider';
import { describeAuthError, firebaseAuthService } from '@/services';
import { APP_NAME, APP_TAGLINE } from '@/constants/app';
import { ROUTES } from '@/routes/paths';

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

type LoginValues = z.infer<typeof loginSchema>;

const HIGHLIGHTS = [
  'Every event, station and packing list in one console',
  'Promote colleagues to admin without touching Firebase',
  'Live data — shared with the PartyAllo crew app',
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword, signInWithGoogle, isAuthenticated, isResolving } = useAuth();

  const [formError, setFormError] = useState<string | null>(null);
  const [googlePending, setGooglePending] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const from = (location.state as { from?: string } | null)?.from ?? ROUTES.dashboard;

  if (isResolving) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to={from} replace />;

  const finish = () => {
    toast.success('Welcome back', { description: 'You are signed in to the admin console.' });
    navigate(from, { replace: true });
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signInWithPassword(values.email, values.password);
      finish();
    } catch (error) {
      setFormError(describeAuthError(error));
    }
  });

  const onGoogle = async () => {
    setFormError(null);
    setGooglePending(true);
    try {
      await signInWithGoogle();
      finish();
    } catch (error) {
      setFormError(describeAuthError(error));
    } finally {
      setGooglePending(false);
    }
  };

  const onForgotPassword = async () => {
    const email = getValues('email').trim();
    if (!email) {
      setFormError('Enter your email address first, then choose “Forgot password”.');
      return;
    }
    try {
      await firebaseAuthService.sendPasswordReset(email);
      toast.success('Reset email sent', { description: `Check the inbox for ${email}.` });
    } catch (error) {
      setFormError(describeAuthError(error));
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(600px circle at 20% 20%, rgb(255 255 255 / 0.22), transparent 55%), radial-gradient(500px circle at 85% 75%, rgb(255 255 255 / 0.16), transparent 50%)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="relative flex items-center gap-3"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
            <span className="text-lg font-bold text-white">P</span>
          </span>
          <div>
            <p className="text-base font-semibold leading-tight text-white">{APP_NAME}</p>
            <p className="text-xs text-white/70">{APP_TAGLINE}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="relative max-w-md"
        >
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            Every crate accounted for, every event on time.
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((highlight) => (
              <li key={highlight} className="flex items-start gap-3 text-sm text-white/85">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-white" />
                {highlight}
              </li>
            ))}
          </ul>
        </motion.div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} PartyAllo Events. All rights reserved.
        </p>
      </aside>

      {/* Form panel */}
      <main className="surface-gradient flex items-center justify-center bg-background px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <BrandMark size="lg" />
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{APP_NAME}</p>
              <p className="text-xs text-muted-foreground">{APP_TAGLINE}</p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Admin sign in</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            This console is restricted to workspace administrators.
          </p>

          {formError ? (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft p-3.5"
            >
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" />
              <p className="text-sm leading-relaxed text-danger">{formError}</p>
            </motion.div>
          ) : null}

          <Button
            type="button"
            variant="outline"
            block
            size="lg"
            className="mt-6"
            loading={googlePending}
            leftIcon={<GoogleIcon />}
            onClick={() => void onGoogle()}
          >
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              or
            </span>
            <Separator className="flex-1" />
          </div>

          <form noValidate onSubmit={onSubmit} className="space-y-5">
            <Field label="Email" required error={errors.email?.message}>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@partyallo.com"
                leftIcon={<Mail />}
                invalid={Boolean(errors.email)}
                {...register('email')}
              />
            </Field>

            <Field label="Password" required error={errors.password?.message}>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                leftIcon={<Lock />}
                invalid={Boolean(errors.password)}
                {...register('password')}
              />
            </Field>

            <Button type="submit" block size="lg" loading={isSubmitting} rightIcon={<ArrowRight />}>
              Sign in
            </Button>
          </form>

          <button
            type="button"
            onClick={() => void onForgotPassword()}
            className="mt-4 w-full text-center text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Forgot your password?
          </button>

          <p className="mt-8 rounded-xl border border-border bg-muted/40 p-3.5 text-xs leading-relaxed text-muted-foreground">
            Crew accounts sign in to the <strong className="text-foreground">PartyAllo</strong> app,
            not here. If you need console access, ask an existing admin to promote your account from
            the Users screen.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
