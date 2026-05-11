import { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import type { AppTheme } from '../stores/uiStore';
import { useTranslation, persistLanguage } from '../i18n';
import { showSuccess, showError } from '../lib/toast';
import type { AgentConfig, AISettings } from '../stores/settingsStore';
import { Brain, PenTool, Sparkles, Image, Globe } from 'lucide-react';
const agentIcons: Record<keyof AISettings, React.FC<React.SVGProps<SVGSVGElement> & { size?: number }>> = {
  contextAgent: Brain,
  writerAgent: PenTool,
  supportAgent: Sparkles,
  imageAgent: Image,
};

const providers = ['openai', 'anthropic', 'google', 'custom'];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
];


const providerDefaultUrls: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
  google: 'https://generativelanguage.googleapis.com',
  custom: 'https://your-api.example.com/v1',
};

function AgentConfigCard({ agentKey }: { agentKey: keyof AISettings }) {
  const { settings, updateAIConfig } = useSettingsStore();
  const config = settings?.aiSettings?.[agentKey] || { provider: 'openai', model: '' };
  const t = useTranslation();

  const [localConfig, setLocalConfig] = useState<Partial<AgentConfig>>({
    provider: config.provider,
    model: config.model,
    baseUrl: config.baseUrl || '',
    apiKey: config.apiKey || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setLocalConfig({
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl || '',
      apiKey: config.apiKey || ''
    });
  }, [config.provider, config.model, config.baseUrl, config.apiKey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const payload = { ...localConfig };
      if (payload.apiKey && payload.apiKey.startsWith('sk-****')) {
        delete payload.apiKey;
      }
      if (!payload.apiKey && !config.apiKey) {
        delete payload.apiKey;
      }
      
      await updateAIConfig(agentKey, payload);
      setSaveSuccess(true);
      showSuccess(t.toast.aiConfigSaved);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      showError(t.toast.aiConfigSaveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const IconComponent = agentIcons[agentKey];
  const agentTitleKey = `${agentKey}` as keyof typeof t.settings;
  const agentDescKey = `${agentKey}Desc` as keyof typeof t.settings;
  const title = t.settings[agentTitleKey] || agentKey;
  const desc = t.settings[agentDescKey] || '';

  return (
    <div className="group bg-ink-800 border border-ink-700 rounded-2xl p-6 hover:border-accent-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent-400/5">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-10 h-10 flex items-center justify-center bg-accent-600/10 text-accent-400 rounded-xl">
          <IconComponent size={20} />
        </span>
        <div>
          <h3 className="font-display text-lg text-ink-100">{title}</h3>
          <p className="text-ink-200/70 text-xs">{desc}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{t.settings.provider}</label>
          <select
            name="provider"
            value={localConfig.provider}
            onChange={handleChange}
            className="w-full bg-ink-950 border border-ink-700 text-ink-100 p-2.5 rounded-xl text-sm focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30 outline-none transition-all"
          >
            {providers.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{t.settings.modelName}</label>
          <input
            type="text"
            name="model"
            value={localConfig.model}
            onChange={handleChange}
            placeholder="e.g. gpt-4o"
            className="w-full bg-ink-950 border border-ink-700 text-ink-100 p-2.5 rounded-xl text-sm focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30 outline-none transition-all placeholder:text-ink-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-200/80 mb-1.5 flex items-center gap-1.5">
            <Globe size={12} className="text-ink-200/50" />
            {t.settings.apiUrl}
          </label>
          <input
            type="text"
            name="baseUrl"
            value={localConfig.baseUrl}
            onChange={handleChange}
            placeholder={providerDefaultUrls[localConfig.provider || 'openai']}
            className="w-full bg-ink-950 border border-ink-700 text-ink-100 p-2.5 rounded-xl text-sm focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30 outline-none transition-all placeholder:text-ink-500"
          />
          <p className="text-[10px] text-ink-200/40 mt-1">{t.settings.apiUrlHint}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{t.settings.apiKey}</label>
          <input
            type="password"
            name="apiKey"
            value={localConfig.apiKey}
            onChange={handleChange}
            placeholder="••••••••••••••••"
            className="w-full bg-ink-950 border border-ink-700 text-ink-100 p-2.5 rounded-xl text-sm focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30 outline-none transition-all placeholder:text-ink-500"
          />
        </div>

        <div className="pt-3 flex justify-end items-center gap-3">
          {saveSuccess && <span className="text-green-500 text-xs font-medium animate-fade-in">{t.settings.saved}</span>}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white text-sm rounded-xl transition-all duration-200 disabled:opacity-50 font-medium shadow-sm hover:shadow-md"
          >
            {isSaving ? t.settings.saving : t.settings.applyDetails}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslation();
  const { settings, isLoading, fetchSettings, updateSettings } = useSettingsStore();
  const { theme } = useUIStore();
  const [generalSettings, setGeneralSettings] = useState<{ language: string; theme: AppTheme }>({ language: 'en', theme: 'dark' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setGeneralSettings({ language: settings.language || 'en', theme: settings.theme || 'dark' });
    }
  }, [settings]);

  // Sync theme changes to uiStore immediately
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value as AppTheme;
    setGeneralSettings(prev => ({ ...prev, theme: newTheme }));
    if (newTheme !== theme) {
      // Direct call to avoid just toggling between two
      useUIStore.getState().setTheme(newTheme);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setGeneralSettings(prev => ({ ...prev, language: newLang }));
    persistLanguage(newLang);
  };

  const saveGeneral = async () => {
    setIsSaving(true);
    try {
      await updateSettings(generalSettings);
      showSuccess(t.toast.settingsSaved);
    } catch {
      showError(t.toast.settingsSaveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !settings) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl text-ink-100 mb-8">{t.settings.title}</h1>
        <div className="text-center py-16 text-ink-200/60">{t.settings.loading}</div>
      </div>
    );
  }

  const agentKeys: (keyof AISettings)[] = ['contextAgent', 'writerAgent', 'supportAgent', 'imageAgent'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      <div className="mb-10">
        <h1 className="font-display text-3xl sm:text-4xl text-ink-100">{t.settings.title}</h1>
        <div className="mt-3 h-px bg-gradient-to-r from-accent-400/60 via-accent-600/30 to-transparent" />
      </div>
      
      {/* General Section */}
      <section className="mb-12">
        <h2 className="font-display text-xl text-ink-100 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-accent-400 rounded-full" />
          {t.settings.general}
        </h2>
        <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{t.settings.language}</label>
              <select
                name="language"
                value={generalSettings.language}
                onChange={handleLanguageChange}
                className="w-full bg-ink-950 border border-ink-700 text-ink-100 p-2.5 rounded-xl text-sm focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30 outline-none transition-all"
              >
                {languageOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{t.settings.theme}</label>
              <select
                name="theme"
                value={generalSettings.theme}
                onChange={handleThemeChange}
                className="w-full bg-ink-950 border border-ink-700 text-ink-100 p-2.5 rounded-xl text-sm focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30 outline-none transition-all"
              >
                <option value="dark">{t.settings.themeDark}</option>
                <option value="light">{t.settings.themeLight}</option>
                <option value="cyberpunk">{t.settings.themeCyberpunk || 'Cyberpunk (Neon)'}</option>
                <option value="sepia">{t.settings.themeSepia || 'Classic Sepia'}</option>
                <option value="abyssal">{t.settings.themeAbyssal || 'Abyssal (Teal)'}</option>
              </select>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              onClick={saveGeneral}
              disabled={isSaving}
              className="px-5 py-2.5 bg-accent-600 hover:bg-accent-500 text-white text-sm rounded-xl transition-all duration-200 disabled:opacity-50 font-medium shadow-sm hover:shadow-md"
            >
              {isSaving ? t.settings.saving : t.settings.saveGeneral}
            </button>
          </div>
        </div>
      </section>

      {/* AI Configuration Section */}
      <section>
        <h2 className="font-display text-xl text-ink-100 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-accent-400 rounded-full" />
          {t.settings.aiConfig}
        </h2>
        <p className="text-ink-200/60 text-sm mb-6 ml-4">
          {t.settings.aiConfigDesc}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {agentKeys.map((agent) => (
            <AgentConfigCard key={agent} agentKey={agent} />
          ))}
        </div>
      </section>
    </div>
  );
}
