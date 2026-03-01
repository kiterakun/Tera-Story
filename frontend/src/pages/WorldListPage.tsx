import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorldStore } from '../stores/worldStore';
import { useTranslation } from '../i18n';
import { Castle, Rocket, Swords, Building2, Wand2, Globe, Plus, Calendar } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const genreIcons: Record<string, LucideIcon> = {
  fantasy: Castle,
  'sci-fi': Rocket,
  wuxia: Swords,
  modern: Building2,
  custom: Wand2,
};

export default function WorldListPage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const { worlds, isLoading, fetchWorlds, createFromTemplate } = useWorldStore();

  useEffect(() => {
    fetchWorlds().catch(console.error);
  }, [fetchWorlds]);

  const handleTemplateCreate = async (templateId: string, name: string) => {
    try {
      const newWorld = await createFromTemplate(templateId, name);
      navigate(`/worlds/${newWorld._id}`);
    } catch (error) {
      console.error('Failed to create world from template:', error);
      alert(t.worldList.failedToCreate);
    }
  };

  const GenreIcon = ({ genre }: { genre: string }) => {
    const Icon = genreIcons[genre] || Wand2;
    return <Icon size={22} className="text-accent-400" />;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display text-ink-100">{t.worldList.title}</h1>
          <p className="text-ink-200/60 text-sm mt-1">{t.worldList.subtitle}</p>
        </div>
        <Link
          to="/worlds/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-lg hover:shadow-accent-600/20"
        >
          <Plus size={16} />
          {t.worldList.createWorld}
        </Link>
      </div>

      {isLoading && worlds.length === 0 ? (
        <div className="text-center py-20">
          <svg className="animate-spin w-8 h-8 mx-auto text-accent-400 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          <p className="text-ink-200/60">{t.worldList.loading}</p>
        </div>
      ) : worlds.length === 0 ? (
        <div className="bg-ink-800 border border-ink-700 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-ink-700/50 flex items-center justify-center mx-auto mb-5">
            <Globe size={28} className="text-ink-200/60" />
          </div>
          <h2 className="text-2xl font-display text-ink-100 mb-3">{t.worldList.noWorldsTitle}</h2>
          <p className="text-ink-200/60 mb-8 max-w-md mx-auto">{t.worldList.noWorldsDesc}</p>
          <Link
            to="/worlds/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-lg hover:shadow-accent-600/20"
          >
            {t.worldList.startFromScratch}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {worlds.map((world) => (
            <Link
              key={world._id}
              to={`/worlds/${world._id}`}
              className="group block bg-ink-800 border border-ink-700 rounded-2xl p-6 hover:border-accent-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent-400/5"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-accent-600/10 flex items-center justify-center">
                    <GenreIcon genre={world.genre} />
                  </span>
                  <h2 className="text-xl font-display text-ink-100 group-hover:text-accent-400 transition-colors">
                    {world.name}
                  </h2>
                </div>
                <span className="px-2.5 py-1 bg-ink-700/50 text-xs uppercase tracking-wider text-ink-200/70 rounded-lg font-medium">
                  {world.genre}
                </span>
              </div>
              
              <p className="text-ink-200/60 mb-6 line-clamp-3 text-sm leading-relaxed">
                {world.description || t.worldDetail.noDescription}
              </p>

              <div className="flex justify-between items-center text-xs text-ink-200/40 pt-4 border-t border-ink-700/50">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(world.createdAt).toLocaleDateString()}
                </span>
                <span>{world.resourceTemplates?.length || 0} {t.worldList.resources}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Start Templates */}
      <div className="mt-16">
        <h3 className="text-xl font-display text-ink-100 mb-2">{t.worldList.quickStartTitle}</h3>
        <p className="text-ink-200/50 text-sm mb-6">{t.worldList.quickStartDesc}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            { id: 'fantasy', name: t.worldList.templateFantasy, Icon: Castle, desc: t.worldList.templateFantasyDesc },
            { id: 'wuxia', name: t.worldList.templateWuxia, Icon: Swords, desc: t.worldList.templateWuxiaDesc },
            { id: 'sci-fi', name: t.worldList.templateSciFi, Icon: Rocket, desc: t.worldList.templateSciFiDesc },
          ] as const).map(tpl => (
            <button
              key={tpl.id}
              onClick={() => handleTemplateCreate(tpl.id, `${t.worldList.new} ${tpl.name}`)}
              className="group p-6 bg-ink-800 border border-ink-700 rounded-2xl hover:border-accent-400/50 transition-all duration-300 text-left hover:shadow-lg hover:shadow-accent-400/5"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 rounded-lg bg-accent-600/10 flex items-center justify-center">
                  <tpl.Icon size={20} className="text-accent-400" />
                </span>
                <h4 className="text-base font-display text-ink-100 group-hover:text-accent-400 transition-colors">{tpl.name}</h4>
              </div>
              <p className="text-sm text-ink-200/60 leading-relaxed">{tpl.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
