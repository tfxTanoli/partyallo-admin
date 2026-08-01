import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { SettingsService } from '../contracts';
import { COLLECTIONS, SETTINGS_DOC_ID, getDb } from './config';
import { mapSettings } from './mappers';
import { stripUndefined } from './converters';

/**
 * `settings/app` is shared with the PWA, which reads the same document. Writes
 * are merged rather than replaced so any key the PWA owns but this console does
 * not surface (e.g. `themeId`, `defaultItems`) survives a save from here.
 */
export const firebaseSettingsService: SettingsService = {
  async get() {
    const snapshot = await getDoc(doc(getDb(), COLLECTIONS.settings, SETTINGS_DOC_ID));
    return mapSettings(snapshot.exists() ? snapshot.data() : undefined);
  },

  async update(settings) {
    await setDoc(
      doc(getDb(), COLLECTIONS.settings, SETTINGS_DOC_ID),
      stripUndefined({
        companyName: settings.companyName,
        appSubtitle: settings.appSubtitle,
        logoUri: settings.logoUri ?? '',
        customStationCategories: settings.customStationCategories ?? [],
        customPurchaseCategories: settings.customPurchaseCategories ?? [],
        customSuppliers: settings.customSuppliers ?? [],
      }),
      { merge: true },
    );
    return this.get();
  },
};
