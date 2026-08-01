import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { Building2, Monitor, Moon, Palette, RotateCcw, Save, Sun, Tags } from 'lucide-react';
import { cn } from '@/utils/cn';
import { isValidHex } from '@/utils/color';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { fadeInUp, staggerContainer } from '@/components/common/motion';
import { ColorPicker } from '@/features/settings/color-picker';
import { LogoUploader } from '@/features/settings/logo-uploader';
import { TagListEditor } from '@/features/settings/tag-list-editor';
import {
  FALLBACK_SETTINGS,
  useSettings,
  useUpdateSettings,
} from '@/features/settings/hooks/use-settings';
import { useTheme } from '@/providers/theme-provider';
import { DEFAULT_PRIMARY_COLOR } from '@/constants/theme';
import type { AppSettings, SettingsFormValues, ThemeMode } from '@/types';

const settingsSchema = z.object({
  companyName: z.string().trim().min(2, 'Enter the company name'),
  appSubtitle: z.string().trim().min(2, 'Enter a subtitle'),
  logoUri: z.string(),
  customStationCategories: z.array(z.string()),
  customPurchaseCategories: z.array(z.string()),
  customSuppliers: z.array(z.string()),
});

function toFormValues(settings: AppSettings): SettingsFormValues {
  return {
    companyName: settings.companyName,
    appSubtitle: settings.appSubtitle,
    logoUri: settings.logoUri ?? '',
    customStationCategories: settings.customStationCategories ?? [],
    customPurchaseCategories: settings.customPurchaseCategories ?? [],
    customSuppliers: settings.customSuppliers ?? [],
  };
}

function toSettings(base: AppSettings, values: SettingsFormValues): AppSettings {
  // Spread `base` first so keys this console does not surface (e.g. `themeId`,
  // `defaultItems`) survive the round trip back to the shared document.
  return { ...base, ...values };
}

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }, (_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-2/3 rounded-xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { data: settings, isPending } = useSettings();
  const updateSettings = useUpdateSettings();
  const { theme, setTheme, primaryColor, setPrimaryColor } = useTheme();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    // Always fully populated: the query resolves after mount, so `undefined`
    // defaults would render one frame of empty controls before `reset()` lands.
    defaultValues: toFormValues(settings ?? FALLBACK_SETTINGS),
  });

  useEffect(() => {
    if (settings) reset(toFormValues(settings));
  }, [settings, reset]);

  const companyName = watch('companyName');

  const onSubmit = handleSubmit(async (values) => {
    const next = await updateSettings.mutateAsync(toSettings(settings ?? FALLBACK_SETTINGS, values));
    reset(toFormValues(next));
  });

  if (isPending || !settings) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Company details and workspace lists." />
        <SettingsSkeleton />
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-6">
      <PageHeader
        title="Settings"
        description="Company details and shared lists. Changes here reach the crew app immediately."
        breadcrumbs={[{ label: 'Settings' }]}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              leftIcon={<RotateCcw />}
              disabled={!isDirty}
              onClick={() => reset(toFormValues(settings))}
            >
              Discard
            </Button>
            <Button type="submit" leftIcon={<Save />} loading={updateSettings.isPending}>
              Save changes
            </Button>
          </>
        }
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid items-start gap-6 xl:grid-cols-3"
      >
        {/* Company information — written to settings/app */}
        <motion.div variants={fadeInUp} className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                Company information
              </CardTitle>
              <CardDescription>
                Shown in the crew app header and on this console's sidebar.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <Controller
                control={control}
                name="logoUri"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Company logo</Label>
                    <LogoUploader
                      value={field.value}
                      onChange={(next) => setValue('logoUri', next, { shouldDirty: true })}
                      companyName={companyName || 'PartyAllo'}
                    />
                  </div>
                )}
              />

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Company name" required error={errors.companyName?.message}>
                  <Input invalid={Boolean(errors.companyName)} {...register('companyName')} />
                </Field>
                <Field
                  label="Subtitle"
                  required
                  hint="Appears under the company name."
                  error={errors.appSubtitle?.message}
                >
                  <Input invalid={Boolean(errors.appSubtitle)} {...register('appSubtitle')} />
                </Field>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appearance — this browser only */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="size-4 text-muted-foreground" />
                Console appearance
              </CardTitle>
              <CardDescription>
                Saved to this browser only — it does not affect the crew app or other admins.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2.5">
                <Label>Primary colour</Label>
                <ColorPicker value={primaryColor} onChange={setPrimaryColor} />
                {primaryColor.toLowerCase() !== DEFAULT_PRIMARY_COLOR ? (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => setPrimaryColor(DEFAULT_PRIMARY_COLOR)}
                  >
                    Reset to PartyAllo blue
                  </Button>
                ) : null}
                {!isValidHex(primaryColor) ? (
                  <p className="text-xs font-medium text-danger">
                    Enter a valid hex colour, e.g. #2563EB
                  </p>
                ) : null}
              </div>

              <Separator />

              <div className="space-y-2.5">
                <Label>Theme</Label>
                <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
                  {THEME_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = theme === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setTheme(option.value)}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all duration-200',
                          selected
                            ? 'border-primary bg-primary-soft text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-accent',
                        )}
                      >
                        <Icon className="size-4" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Shared lists — written to settings/app */}
        <motion.div variants={fadeInUp} className="xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="size-4 text-muted-foreground" />
                Crew app lists
              </CardTitle>
              <CardDescription>
                The custom options the crew choose from when creating stations and purchases.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid items-start gap-8 lg:grid-cols-3">
              <Controller
                control={control}
                name="customStationCategories"
                render={({ field }) => (
                  <div className="space-y-2.5">
                    <Label>Station categories</Label>
                    <TagListEditor
                      value={field.value}
                      onChange={(next) =>
                        setValue('customStationCategories', next, { shouldDirty: true })
                      }
                      placeholder="BBQ Station"
                      ariaLabel="station category"
                      emptyLabel="No custom categories — the crew app's built-ins are used."
                    />
                  </div>
                )}
              />

              <Controller
                control={control}
                name="customPurchaseCategories"
                render={({ field }) => (
                  <div className="space-y-2.5">
                    <Label>Purchase categories</Label>
                    <TagListEditor
                      value={field.value}
                      onChange={(next) =>
                        setValue('customPurchaseCategories', next, { shouldDirty: true })
                      }
                      placeholder="Dry Goods"
                      ariaLabel="purchase category"
                      emptyLabel="No custom categories yet."
                    />
                  </div>
                )}
              />

              <Controller
                control={control}
                name="customSuppliers"
                render={({ field }) => (
                  <div className="space-y-2.5">
                    <Label>Suppliers</Label>
                    <TagListEditor
                      value={field.value}
                      onChange={(next) => setValue('customSuppliers', next, { shouldDirty: true })}
                      placeholder="Sheng Siong"
                      ariaLabel="supplier"
                      emptyLabel="No suppliers recorded yet."
                    />
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {isDirty ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 z-20"
        >
          <div className="glass flex items-center justify-between gap-4 rounded-2xl border border-border px-5 py-3.5 shadow-lifted">
            <p className="text-sm text-muted-foreground">You have unsaved changes.</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => reset(toFormValues(settings))}
              >
                Discard
              </Button>
              <Button type="submit" size="sm" loading={updateSettings.isPending}>
                Save changes
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </form>
  );
}
