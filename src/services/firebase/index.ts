import type { DataSource } from '../contracts';
import { firebaseCatalogueService, firebasePurchaseService } from './catalogues.service';
import { firebaseDashboardService } from './dashboard.service';
import { firebaseEventService } from './events.service';
import { firebaseSettingsService } from './settings.service';
import { firebaseUserService } from './users.service';

export const firebaseDataSource: DataSource = {
  users: firebaseUserService,
  events: firebaseEventService,
  catalogues: firebaseCatalogueService,
  dashboard: firebaseDashboardService,
  settings: firebaseSettingsService,
  purchases: firebasePurchaseService,
};

export { describeAuthError, firebaseAuthService, type AuthSession } from './auth.service';
export { COLLECTIONS, isFirebaseConfigured } from './config';
