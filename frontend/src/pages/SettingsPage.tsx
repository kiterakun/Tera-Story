import { useEffect, useState } from 'react';
import { useSettingsStore, AgentConfig, AISettings } from '../stores/settingsStore';

const agentLabels: Record<keyof AISettings, { title: string, icon: string, desc: string }> = {
  contextAgent: { title: 'Context Agent', icon: '🧠', desc: 'Maintains story world consistency.' },
  writerAgent: { title: 'Writer Agent', icon: '🖋️', desc: 'Generates narrative prose.' },
  supportAgent: { title: 'Support Agent', icon: '✨', desc: 'Generates suggestions and ideas.' },
  imageAgent: { title: 'Image Agent', icon: '🖼️', desc: 'Generates scene and character art.' }
};

const providers = ['openai', 'anthropic', 'google', 'custom'];

function AgentConfigCard({ agentKey }: { agentKey: keyof AISettings }) {
  const { settings, updateAIConfig } = useSettingsStore();
  const config = settings?.aiSettings?.[agentKey] || { provider: 'openai', model: '' };

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
      // Prevent sending masked API keys
      if (payload.apiKey && payload.apiKey.startsWith('sk-****')) {
        delete payload.apiKey;
      }
      if (!payload.apiKey && !config.apiKey) {
          delete payload.apiKey; // Do not send empty string if there wasn't a key before
      }
      
      await updateAIConfig(agentKey, payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const info = agentLabels[agentKey];

  return (
    <div className="bg-ink-800/50 border border-ink-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{info.icon}</span>
        <div>
          <h3 className="font-display text-xl text-parchment-50">{info.title}</h3>
          <p className="text-ink-200 text-sm">{info.desc}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-ink-200 mb-1">Provider</label>
          <select
            name="provider"
            value={localConfig.provider}
            onChange={handleChange}
            className="w-full bg-ink-900 border border-ink-700 text-parchment-50 p-2 rounded focus:border-accent-400 outline-none"
          >
            {providers.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-ink-200 mb-1">Model Name</label>
          <input
            type="text"
            name="model"
            value={localConfig.model}
            onChange={handleChange}
            placeholder="e.g. gpt-4o"
            className="w-full bg-ink-900 border border-ink-700 text-parchment-50 p-2 rounded focus:border-accent-400 outline-none"
          />
        </div>

        {localConfig.provider === 'custom' && (
          <div>
            <label className="block text-sm text-ink-200 mb-1">API URL (Custom Provider)</label>
            <input
              type="text"
              name="baseUrl"
              value={localConfig.baseUrl}
              onChange={handleChange}
              placeholder="https://api.custom.com/v1"
              className="w-full bg-ink-900 border border-ink-700 text-parchment-50 p-2 rounded focus:border-accent-400 outline-none"
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-ink-200 mb-1">API Key</label>
          <input
            type="password"
            name="apiKey"
            value={localConfig.apiKey}
            onChange={handleChange}
            placeholder="••••••••••••••••"
            className="w-full bg-ink-900 border border-ink-700 text-parchment-50 p-2 rounded focus:border-accent-400 outline-none"
          />
        </div>

        <div className="pt-2 flex justify-end items-center gap-4">
          {saveSuccess && <span className="text-green-400 text-sm">Saved!</span>}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-accent-600 hover:bg-accent-400 text-white rounded transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Apply Details'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, isLoading, fetchSettings, updateSettings } = useSettingsStore();
  const [generalSettings, setGeneralSettings] = useState({ language: 'en', theme: 'dark' as 'dark' | 'light' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setGeneralSettings({ language: settings.language || 'en', theme: settings.theme || 'dark' });
    }
  }, [settings]);

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setGeneralSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveGeneral = async () => {
    setIsSaving(true);
    try {
      await updateSettings(generalSettings);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !settings) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="font-display text-3xl text-parchment-50 mb-8">Settings</h1>
        <div className="text-center py-12 text-ink-200">Loading settings...</div>
      </div>
    );
  }

  const agentKeys: (keyof AISettings)[] = ['contextAgent', 'writerAgent', 'supportAgent', 'imageAgent'];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="font-display text-3xl text-parchment-50 mb-8 border-b border-ink-700 pb-4">Settings</h1>
      
      {/* General Section */}
      <section className="mb-12">
        <h2 className="font-display text-2xl text-parchment-50 mb-4">General</h2>
        <div className="bg-ink-800/50 border border-ink-700 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-ink-200 mb-1">Language</label>
            <input
              type="text"
              name="language"
              value={generalSettings.language}
              onChange={handleGeneralChange}
              className="w-full max-w-sm bg-ink-900 border border-ink-700 text-parchment-50 p-2 rounded focus:border-accent-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-ink-200 mb-1">Theme</label>
            <select
              name="theme"
              value={generalSettings.theme}
              onChange={handleGeneralChange}
              className="w-full max-w-sm bg-ink-900 border border-ink-700 text-parchment-50 p-2 rounded focus:border-accent-400 outline-none"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div className="pt-2">
            <button
              onClick={saveGeneral}
              disabled={isSaving}
              className="px-4 py-2 bg-accent-600 hover:bg-accent-400 text-white rounded transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save General Settings'}
            </button>
          </div>
        </div>
      </section>

      {/* AI Configuration Section */}
      <section>
        <h2 className="font-display text-2xl text-parchment-50 mb-2">AI Configuration</h2>
        <p className="text-ink-200 text-sm mb-6 pb-2 border-b border-ink-700/50">
          Configure AI models for each agent independently.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agentKeys.map((agent) => (
            <AgentConfigCard key={agent} agentKey={agent} />
          ))}
        </div>
      </section>
    </div>
  );
}
