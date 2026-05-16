import React from 'react';
import { useTranslation } from '../../i18n';
import type { World } from '../../services/worldApi';

interface WorldBasicInfoFormProps {
  name: string;
  onNameChange: (value: string) => void;
  genre: World['genre'];
  onGenreChange: (value: World['genre']) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
}

export function WorldBasicInfoForm({
  name,
  onNameChange,
  genre,
  onGenreChange,
  description,
  onDescriptionChange
}: WorldBasicInfoFormProps) {
  const t = useTranslation();

  return (
    <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6">
      <h2 className="text-lg font-display text-ink-100 mb-5 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-accent-400 rounded-full" />
        {t.worldCreate.generalInfo}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
            {t.worldCreate.worldName}{" "}
            <span className="text-red-400">*</span>
          </label>
          <input
            required
            className="w-full bg-ink-950 border border-ink-700 rounded-xl px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all text-sm"
            placeholder={t.worldCreate.worldNamePlaceholder}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
            {t.worldCreate.genre}
          </label>
          <select
            className="w-full bg-ink-950 border border-ink-700 rounded-xl px-4 py-3 text-ink-100 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all text-sm"
            value={genre}
            onChange={(e) => onGenreChange(e.target.value as World["genre"])}
          >
            <option value="fantasy">{t.worldCreate.genreFantasy}</option>
            <option value="sci-fi">{t.worldCreate.genreSciFi}</option>
            <option value="wuxia">{t.worldCreate.genreWuxia}</option>
            <option value="modern">{t.worldCreate.genreModern}</option>
            <option value="custom">{t.worldCreate.genreCustom}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
            {t.worldCreate.description}
          </label>
          <textarea
            rows={4}
            className="w-full bg-ink-950 border border-ink-700 rounded-xl px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all resize-none text-sm"
            placeholder={t.worldCreate.descriptionPlaceholder}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
