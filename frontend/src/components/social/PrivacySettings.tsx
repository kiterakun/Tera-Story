import { useState } from 'react';
import type { FC } from 'react';
import { api } from '../../services/api';
import { showSuccess, showError } from '../../lib/toast';
import { Lock, Globe, Users, Eye, BookOpen, Award, UserPlus, Trophy, Shield } from 'lucide-react';

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

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: FC<{ size?: number }> }[] = [
  { value: 'private', label: 'Riêng tư', icon: Lock },
  { value: 'friends', label: 'Bạn bè', icon: Users },
  { value: 'public', label: 'Công khai', icon: Globe },
];

function VisibilitySelect({
  value,
  onChange,
}: {
  value: Visibility;
  onChange: (v: Visibility) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-ink-950 p-1">
      {VISIBILITY_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-gold text-ink-950'
                : 'text-ink-400 hover:text-ink-200'
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
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-gold' : 'bg-ink-600'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
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
    <div className="flex items-start justify-between gap-4 py-4 border-b border-ink-700 last:border-b-0">
      <div className="flex gap-3 min-w-0">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-ink-400">
          <Icon size={16} />
        </span>
        <div>
          <p className="text-sm font-medium text-ink-100">{label}</p>
          <p className="text-xs text-ink-400 mt-0.5">{description}</p>
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
      showSuccess('Đã lưu thay đổi');
    } catch {
      showError('Không thể lưu cài đặt');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900 p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-800 text-gold">
          <Shield size={20} />
        </span>
        <h3 className="text-lg font-bold text-ink-100">Cài đặt quyền riêng tư</h3>
      </div>

      <div className="divide-y divide-ink-700">
        <SettingRow
          icon={Eye}
          label="Hiển thị trang cá nhân"
          description="Ai có thể xem trang cá nhân của bạn"
        >
          <VisibilitySelect
            value={local.profileVisibility}
            onChange={(v) => updateField('profileVisibility', v)}
          />
        </SettingRow>

        <SettingRow
          icon={BookOpen}
          label="Hiển thị story"
          description="Ai có thể xem story của bạn"
        >
          <VisibilitySelect
            value={local.storyVisibility}
            onChange={(v) => updateField('storyVisibility', v)}
          />
        </SettingRow>

        <SettingRow
          icon={Award}
          label="Hiển thị thành tựu"
          description="Ai có thể xem thành tựu của bạn"
        >
          <VisibilitySelect
            value={local.achievementVisibility}
            onChange={(v) => updateField('achievementVisibility', v)}
          />
        </SettingRow>

        <SettingRow
          icon={UserPlus}
          label="Cho phép lời mời kết bạn"
          description="Người khác có thể gửi lời mời kết bạn cho bạn"
        >
          <ToggleSwitch
            checked={local.allowFriendRequests}
            onChange={(v) => updateField('allowFriendRequests', v)}
          />
        </SettingRow>

        <SettingRow
          icon={Trophy}
          label="Hiện trên bảng xếp hạng"
          description="Tên bạn xuất hiện trên bảng xếp hạng công khai"
        >
          <ToggleSwitch
            checked={local.showOnLeaderboard}
            onChange={(v) => updateField('showOnLeaderboard', v)}
          />
        </SettingRow>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || loading}
          className="rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-ink-950 hover:bg-gold/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  );
};
