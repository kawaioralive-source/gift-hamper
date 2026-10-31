import { Metadata } from 'next';
import { UserSettingsClient } from '@/components/settings/UserSettingsClient';

export const metadata: Metadata = {
  title: 'Settings & Regional Preferences',
  description: 'Manage your currency, regional preferences, delivery slots, and account notifications',
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950/60">
      <UserSettingsClient />
    </div>
  );
}
