import type { Dispatch, SetStateAction } from 'react';
import type { World } from '../../services/worldApi';
import { useTranslation } from '../../i18n';
import { AiWorldGenerator } from './AiWorldGenerator';
import { WorldBasicInfoForm } from './WorldBasicInfoForm';

interface BasicInfoStepProps {
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  genre: World['genre'];
  setGenre: Dispatch<SetStateAction<World['genre']>>;
  aiPrompt: string;
  setAiPrompt: Dispatch<SetStateAction<string>>;
  onAiGenerate: () => void;
  isGenerating: boolean;
}

export function BasicInfoStep({
  name,
  setName,
  description,
  setDescription,
  genre,
  setGenre,
  aiPrompt,
  setAiPrompt,
  onAiGenerate,
  isGenerating,
}: BasicInfoStepProps) {
  const t = useTranslation();
  return (
    <section aria-label={t.worldCreate.basicInfoStep} className="space-y-6">
      <AiWorldGenerator
        prompt={aiPrompt}
        onChange={setAiPrompt}
        onGenerate={onAiGenerate}
        isGenerating={isGenerating}
      />
      <WorldBasicInfoForm
        name={name}
        onNameChange={setName}
        genre={genre}
        onGenreChange={setGenre}
        description={description}
        onDescriptionChange={setDescription}
      />
    </section>
  );
}
