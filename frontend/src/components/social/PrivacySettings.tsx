import { useState } from 'react';
import type { FC } from 'react';
import { api } from '../../services/api';
import { showSuccess, showError } from '../../lib/toast';
import { Lock, Globe, Users, Eye, BookOpen, Award, UserPlus, Trophy } from 'lucide-react';
import { useTranslation } from '../../i18n';

export type Visibility = 'private' | 'friends' | 'public';

export interface PrivacySettingsData {
  profileVisibility: Visibility;
  storyVisibility: Visibility;
  achievementVisibility: Visibility;
  allowFriendRequests: boolean;
  showOnLeaderboard: boolean;
}

interface PrivacySettingsProps {
  settings: PrivacySettingsData;
  onUpdate: (settings: PrivacySettingsData) => void;
  loading?: boolean;
}

function VisibilitySelect({
  value,
  onChange,
}: {
  value: Visibility;
  onChange: (v: Visibility) => void;
}) {
  const t = useTranslation();
  const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: FC<{ size?: number }> }[] = [
    { value: 'private', label: t.privacySettings.visibilityPrivate, icon: Lock },
    { value: 'friends', label: t.privacySettings.visibilityFriends, icon: Users },
    { value: 'public', label: t.privacySettings.visibilityPublic, icon: Globe },
  ];

  return (
    <div className="flex gap-1 rounded-xl bg-ink-950 ring-1 ring-inset ring-ink-700/50 p-1">
      {VISIBILITY_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              isActive
                ? 'bg-accent-600 text-white shadow-sm'
                : 'text-ink-200/70 hover:text-ink-100 hover:bg-ink-800'
            }`}
          >
            <Icon size={14} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-accent-500' : 'bg-ink-600/50'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

interface SettingRowProps {
  icon: FC<{ size?: number; className?: string }>;
  label: string;
  description: string;
  children: React.ReactNode;
}

function SettingRow({ icon: Icon, label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-ink-700/50 last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-600/10 text-accent-400">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-sm font-medium text-ink-100">{label}</p>
          <p className="text-xs text-ink-200/70 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export const PrivacySettings: FC<PrivacySettingsProps> = ({
  settings,
  onUpdate,
  loading = false,
}) => {
  const t = useTranslation();
  const [local, setLocal] = useState<PrivacySettingsData>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const updateField = <K extends keyof PrivacySettingsData>(
    key: K,
    value: PrivacySettingsData[K]
  ) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/user/privacy', local);
      onUpdate(local);
      showSuccess(t.privacySettings.saveSuccess);
    } catch {
      showError(t.privacySettings.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6">
      <div className="divide-y divide-ink-700/50">
        <SettingRow
          icon={Eye}
          label={t.privacySettings.profileVisibility}
          description={t.privacySettings.profileVisibilityDesc}
        >
          <VisibilitySelect
            value={local.profileVisibility}
            onChange={(v) => updateField('profileVisibility', v)}
          />
        </SettingRow>

        <SettingRow
          icon={BookOpen}
          label={t.privacySettings.storyVisibility}
          description={t.privacySettings.storyVisibilityDesc}
        >
          <VisibilitySelect
            value={local.storyVisibility}
            onChange={(v) => updateField('storyVisibility', v)}
          />
        </SettingRow>

        <SettingRow
          icon={Award}
          label={t.privacySettings.achievementVisibility}
          description={t.privacySettings.achievementVisibilityDesc}
        >
          <VisibilitySelect
            value={local.achievementVisibility}
            onChange={(v) => updateField('achievementVisibility', v)}
          />
        </SettingRow>

        <SettingRow
          icon={UserPlus}
          label={t.privacySettings.allowFriendRequests}
          description={t.privacySettings.allowFriendRequestsDesc}
        >
          <ToggleSwitch
            checked={local.allowFriendRequests}
            onChange={(v) => updateField('allowFriendRequests', v)}
          />
        </SettingRow>

        <SettingRow
          icon={Trophy}
          label={t.privacySettings.showOnLeaderboard}
          description={t.privacySettings.showOnLeaderboardDesc}
        >
          <ToggleSwitch
            checked={local.showOnLeaderboard}
            onChange={(v) => updateField('showOnLeaderboard', v)}
          />
        </SettingRow>
      </div>

      <div className="pt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || loading}
          className="px-5 py-2.5 bg-accent-600 hover:bg-accent-500 text-white text-sm rounded-xl transition-all duration-200 disabled:opacity-50 font-medium shadow-sm hover:shadow-md"
        >
          {isSaving ? t.privacySettings.saving : t.privacySettings.saveChanges}
        </button>
      </div>
    </div>
  );
};
