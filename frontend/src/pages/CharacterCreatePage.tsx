import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useStoryStore } from "../stores/storyStore";
import { useTranslation } from "../i18n";
import { showSuccess, showError } from "../lib/toast";
import {
  ChevronLeft,
  XCircle,
  UserRound,
  Users,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react";
import * as supportApi from "../services/supportApi";
export default function CharacterCreatePage() {
  const t = useTranslation();
  const { worldId, playthroughId } = useParams<{
    worldId: string;
    playthroughId: string;
  }>();
  const navigate = useNavigate();
  const createCharacter = useStoryStore((state) => state.createCharacter);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState<"protagonist" | "npc">("protagonist");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t.characterCreate.nameRequired);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createCharacter(playthroughId!, { name, description, role });
      showSuccess(t.toast.characterCreated);
      navigate(`/worlds/${worldId}/playthroughs/${playthroughId}`);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || t.characterCreate.failedToCreate
        : err instanceof Error ? err.message : t.characterCreate.failedToCreate;
      setError(message);
      setIsSubmitting(false);
    }
  };
  const handleAiQuickCreate = async () => {
    if (!description.trim() && !name.trim()) {
      setError(t.characterCreate.aiNeedHint);
      return;
    }

    setIsEnriching(true);
    setError(null);

    try {
      const result = await supportApi.enrichCharacter(
        description.trim() || name.trim(),
        worldId,
      );
      if (result.characterName) setName(result.characterName);
      if (result.characterDescription)
        setDescription(result.characterDescription);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || t.characterCreate.aiEnrichFailed
        : err instanceof Error ? err.message : t.characterCreate.aiEnrichFailed;
      setError(message);
      showError(t.toast.aiEnrichFailed);
    } finally {
      setIsEnriching(false);
    }
  };
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      <div className="mb-8">
        <Link
          to={`/worlds/${worldId}/playthroughs/${playthroughId}`}
          className="inline-flex items-center gap-1.5 text-ink-200/50 hover:text-accent-400 transition-colors text-sm font-medium mb-3"
        >
          <ChevronLeft size={16} />
          {t.characterCreate.backToPlaythrough}
        </Link>
        <h1 className="text-3xl font-display text-ink-100">
          {t.characterCreate.title}
        </h1>
        <p className="text-ink-200/60 font-serif mt-2 text-sm">
          {t.characterCreate.subtitle}
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-accent-400/60 via-accent-600/30 to-transparent" />
      </div>

      <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6 sm:p-8">
        <div className="flex justify-end mb-6">
          <button
            onClick={handleAiQuickCreate}
            disabled={isEnriching}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600/10 text-accent-400 border border-accent-600/20 rounded-xl text-sm font-medium hover:bg-accent-600/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEnriching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {isEnriching
              ? t.characterCreate.aiEnriching
              : t.characterCreate.aiQuickCreate}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-6 text-sm flex items-center gap-2 animate-fade-in">
            <XCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
              {t.characterCreate.name} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-ink-950 border border-ink-700 rounded-xl p-3 text-ink-100 placeholder:text-ink-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all text-sm"
              placeholder={t.characterCreate.namePlaceholder}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
              {t.characterCreate.role}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200 ${
                  role === "protagonist"
                    ? "bg-accent-600/10 border-accent-400 text-accent-400 shadow-sm shadow-accent-400/10"
                    : "bg-ink-950 border-ink-700 text-ink-200/60 hover:bg-ink-900 hover:border-ink-600"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="protagonist"
                  checked={role === "protagonist"}
                  onChange={() => setRole("protagonist")}
                  className="sr-only"
                />
                <UserRound size={24} className="text-accent-400" />
                <span className="font-display text-base">
                  {t.characterCreate.protagonist}
                </span>
                <span className="text-xs text-center leading-relaxed opacity-70">
                  {t.characterCreate.protagonistDesc}
                </span>
              </label>
              <label
                className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200 ${
                  role === "npc"
                    ? "bg-ink-700/30 border-ink-500 text-ink-100 shadow-sm"
                    : "bg-ink-950 border-ink-700 text-ink-200/60 hover:bg-ink-900 hover:border-ink-600"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="npc"
                  checked={role === "npc"}
                  onChange={() => setRole("npc")}
                  className="sr-only"
                />
                <Users size={24} className="text-ink-200/60" />
                <span className="font-display text-base">
                  {t.characterCreate.npc}
                </span>
                <span className="text-xs text-center leading-relaxed opacity-70">
                  {t.characterCreate.npcDesc}
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
              {t.characterCreate.description}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-ink-950 border border-ink-700 rounded-xl p-3 text-ink-100 placeholder:text-ink-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all font-serif min-h-[120px] resize-y text-sm"
              placeholder={t.characterCreate.descriptionPlaceholder}
            />
          </div>

          <div className="bg-ink-950/50 rounded-xl p-4 border border-ink-700/50">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-accent-400 mt-0.5 shrink-0" />
              <p className="text-xs text-ink-200/60 leading-relaxed">
                {t.characterCreate.statsNote}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-ink-700">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-ink-950/50 border border-ink-700 hover:bg-ink-900 text-ink-200 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm"
            >
              {t.characterCreate.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-accent-600 hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm shadow-sm hover:shadow-lg hover:shadow-accent-600/20"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {t.characterCreate.forging}
                </span>
              ) : (
                t.characterCreate.forgeCharacter
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
