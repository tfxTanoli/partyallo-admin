import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/services';
import { queryKeys } from '@/constants/query-keys';
import type { AppSettings } from '@/types';

/** Shape used before `settings/app` resolves, so chrome never renders blank. */
export const FALLBACK_SETTINGS: AppSettings = {
  companyName: 'PartyAllo',
  appSubtitle: 'Event Packing Tracker',
  logoUri: '',
  customStationCategories: [],
  customPurchaseCategories: [],
  customSuppliers: [],
};

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.detail(),
    queryFn: () => api.settings.get(),
    staleTime: 5 * 60_000,
  });
}

/** Branding is needed on every screen — fall back rather than block the shell. */
export function useSettingsValue(): AppSettings {
  const { data } = useSettings();
  return data ?? FALLBACK_SETTINGS;
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: AppSettings) => api.settings.update(settings),
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.settings.detail(), settings);
      toast.success('Settings saved', {
        description: 'Company details are now live in the crew app too.',
      });
    },
    onError: () =>
      toast.error('Could not save settings', { description: 'Please try again in a moment.' }),
  });
}
