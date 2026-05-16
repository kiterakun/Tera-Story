import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from 'lucide-react';
import { useWorldStore } from "../stores/worldStore";
import { useTranslation } from "../i18n";
import { showSuccess, showError } from "../lib/toast";
import type {
  ResourceTemplate,
  World,
  MapData,
} from "../services/worldApi";
import type { OrganizationTemplate, SpecialItemTemplate } from "../types/entities";
import * as supportApi from "../services/supportApi";
import { api } from "../services/api";
import { 
  AiWorldGenerator, 
  WorldBasicInfoForm, 
  ResourceTemplateEditor, 
  SpecialItemTemplateEditor, 
  OrganizationTemplateEditor,
  MapSelectionStep,
  CreationOverlay
} from "../components/world-create";

type Step = "form" | "map" | "creating";

const terrainColors: Record<string, string> = {
  forest: '#22c55e',
  mountain: '#78716c',
  desert: '#fbbf24',
  ocean: '#3b82f6',
  plains: '#84cc16',
  swamp: '#059669',
  tundra: '#94a3b8',
  volcanic: '#dc2626',
  urban: '#6b7280',
  default: '#64748b',
};

export default function WorldCreatePage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const { createWorld } = useWorldStore();

  const [step, setStep] = useState<Step>("form");
  const [createdWorld, setCreatedWorld] = useState<World | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [premise, setPremise] = useState('');

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState<World["genre"]>("fantasy");

  const [resources, setResources] = useState<ResourceTemplate[]>([
    { key: "HP", type: "progress", min: 0, max: 100, defaultValue: 100 },
  ]);

  const [locationResources, setLocationResources] = useState<ResourceTemplate[]>([
    { key: "danger_level", type: "number", min: 0, max: 10, defaultValue: 1 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specialItemTemplates, setSpecialItemTemplates] = useState<SpecialItemTemplate[]>([]);
  const [organizationTemplates, setOrganizationTemplates] = useState<OrganizationTemplate[]>([]);
  const [isEnrichingWorld, setIsEnrichingWorld] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    try {
      const { world: newWorld, mapData: returnedMapData } = await createWorld({
        name,
        description,
        genre,
        resourceTemplates: resources,
        locationResourceTemplates: locationResources.filter((r) => r.key.trim()),
        specialItemTemplates: specialItemTemplates.filter((t) => t.category.trim()),
        organizationTemplates: organizationTemplates.filter((t) => t.type.trim()),
      });
      showSuccess(t.toast.worldCreated);
      
      if (returnedMapData && returnedMapData.regions && returnedMapData.regions.length > 0) {
        setCreatedWorld(newWorld);
        setMapData(returnedMapData);
        setStep("map");
        setIsSubmitting(false);
      } else {
        navigate(`/worlds/${newWorld._id}`);
      }
    } catch (error) {
      console.error("Failed to create world:", error);
      showError(t.toast.worldCreateFailed);
      setIsSubmitting(false);
    }
  };

  const handleConfirmSpawn = async () => {
    if (!createdWorld || !selectedRegionId) return;
    setIsSubmitting(true);
    setStep("creating");

    try {
      const { data } = await api.post(`/worlds/${createdWorld._id}/playthroughs`, {
        name: `${createdWorld.name} - Journey`,
        spawnRegionId: selectedRegionId,
        premise: premise.trim() || undefined,
      });

      showSuccess(t.toast.playthroughCreated);
      navigate(`/worlds/${createdWorld._id}/playthroughs/${data.playthrough._id}`);
    } catch (error) {
      console.error("Failed to create playthrough:", error);
      showError(t.toast.playthroughCreateFailed);
      setStep("map");
      setIsSubmitting(false);
    }
  };

  const handleAiGenerateWorld = async () => {
    if (!aiPrompt.trim()) return;
    setIsEnrichingWorld(true);
    try {
      const result = await supportApi.enrichWorld(aiPrompt.trim());
      if (result.name) setName(result.name);
      if (result.description) setDescription(result.description);
      if (result.genre) {
        const validGenres: World["genre"][] = ["fantasy", "sci-fi", "wuxia", "modern", "custom"];
        setGenre(validGenres.includes(result.genre as World["genre"]) ? (result.genre as World["genre"]) : "custom");
      }
      if (result.resourceTemplates?.length) {
        setResources(result.resourceTemplates.map((rt) => ({
          key: rt.key,
          type: rt.type as ResourceTemplate["type"],
          min: rt.min,
          max: rt.max,
          defaultValue: rt.defaultValue,
          displayFormat: rt.displayFormat,
          ...(rt.options?.length ? { options: rt.options } : {}),
        })));
      }
      if (result.locationResourceTemplates?.length) {
        setLocationResources(result.locationResourceTemplates.map((rt) => ({
          key: rt.key,
          type: rt.type as ResourceTemplate["type"],
          min: rt.min,
          max: rt.max,
          defaultValue: rt.defaultValue,
          displayFormat: rt.displayFormat,
          ...(rt.options?.length ? { options: rt.options } : {}),
        })));
      }
      if (result.specialItemTemplates?.length) {
        setSpecialItemTemplates(result.specialItemTemplates.map((sit) => ({
          category: sit.category || "",
          description: sit.description || "",
          fields: (sit.fields || []).map((f) => ({
            name: f.name || "",
            type: f.type || "text",
            ...(f.options?.length ? { options: f.options } : {}),
          })),
        })));
      }
      if (result.organizationTemplates?.length) {
        setOrganizationTemplates(result.organizationTemplates.map((ot) => ({
          type: ot.type || "",
          description: ot.description || "",
          defaultStats: (ot.defaultStats || []).map((rt) => ({
            key: rt.key,
            type: rt.type as ResourceTemplate["type"],
            min: rt.min,
            max: rt.max,
            defaultValue: rt.defaultValue,
            displayFormat: rt.displayFormat,
            ...(rt.options?.length ? { options: rt.options } : {}),
          })),
        })));
      }
    } catch (err) {
      console.error("AI world generation failed:", err);
      showError(t.toast.aiWorldGenFailed);
    } finally {
      setIsEnrichingWorld(false);
    }
  };

  if (step === "map" || step === "creating") {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-display text-ink-100">
            {t.worldCreate.selectSpawn}
          </h1>
          <p className="text-ink-200/60 mt-2 text-sm">{t.worldCreate.spawnHint}</p>
          <div className="mt-3 h-px bg-gradient-to-r from-accent-400/60 via-accent-600/30 to-transparent" />
        </div>

        <MapSelectionStep
          mapData={mapData}
          selectedRegionId={selectedRegionId}
          onSelectRegion={setSelectedRegionId}
          premise={premise}
          onPremiseChange={setPremise}
          onConfirm={handleConfirmSpawn}
          onSkip={() => navigate(`/worlds/${createdWorld?._id}`)}
          isCreating={step === "creating"}
          createdWorld={createdWorld}
          terrainColors={terrainColors}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      {isSubmitting && <CreationOverlay label={t.worldCreate.forging} />}

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-display text-ink-100">
          {t.worldCreate.title}
        </h1>
        <p className="text-ink-200/60 mt-2 text-sm">{t.worldCreate.subtitle}</p>
        <div className="mt-3 h-px bg-gradient-to-r from-accent-400/60 via-accent-600/30 to-transparent" />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <form onSubmit={handleSubmit} className="space-y-6 flex-1 min-w-0">
          <AiWorldGenerator
            prompt={aiPrompt}
            onChange={setAiPrompt}
            onGenerate={handleAiGenerateWorld}
            isGenerating={isEnrichingWorld}
          />

          <WorldBasicInfoForm
            name={name}
            onNameChange={setName}
            genre={genre}
            onGenreChange={setGenre}
            description={description}
            onDescriptionChange={setDescription}
          />

          <ResourceTemplateEditor
            resources={resources}
            onChange={setResources}
            title={t.worldCreate.resourceTemplates}
            hint={t.worldCreate.resourceHint}
            addLabel={t.worldCreate.add}
            nameLabel={t.worldCreate.nameKey}
            namePlaceholder={t.worldCreate.nameKeyPlaceholder}
          />

          <ResourceTemplateEditor
            resources={locationResources}
            onChange={setLocationResources}
            title={t.worldCreate.locationResources}
            hint={t.worldCreate.locationResourcesHint}
            addLabel={t.worldCreate.add}
            nameLabel={t.worldCreate.statKey}
            namePlaceholder={t.worldCreate.nameKeyPlaceholder}
            accentColor="bg-emerald-400"
          />

          <SpecialItemTemplateEditor
            templates={specialItemTemplates}
            onChange={setSpecialItemTemplates}
          />

          <OrganizationTemplateEditor
            templates={organizationTemplates}
            onChange={setOrganizationTemplates}
          />

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/worlds")}
              className="px-6 py-3 font-medium text-ink-200 hover:text-ink-100 transition-colors"
            >
              {t.worldCreate.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-8 py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-lg hover:shadow-accent-600/20"
            >
              {t.worldCreate.createWorld}
            </button>
          </div>
        </form>

        <aside className="lg:w-80 shrink-0">
          <div className="lg:sticky lg:top-8 space-y-6">
            <div className="bg-ink-800 border border-ink-700 rounded-2xl p-5">
              <h3 className="text-sm font-display text-ink-100 mb-4 flex items-center gap-2">
                <Check size={16} className="text-accent-400" />
                World Preview
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-ink-950/50 rounded-xl border border-ink-700/50">
                  <p className="text-[10px] uppercase tracking-wider text-ink-200/40 mb-1">Name</p>
                  <p className="text-sm text-ink-100 font-medium truncate">{name || 'Unnamed World'}</p>
                </div>
                <div className="p-3 bg-ink-950/50 rounded-xl border border-ink-700/50">
                  <p className="text-[10px] uppercase tracking-wider text-ink-200/40 mb-1">Genre</p>
                  <p className="text-sm text-ink-100 font-medium capitalize">{genre}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-ink-950/50 rounded-xl border border-ink-700/50 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-ink-200/40 mb-1">Stats</p>
                    <p className="text-lg font-display text-accent-400">{resources.length}</p>
                  </div>
                  <div className="p-3 bg-ink-950/50 rounded-xl border border-ink-700/50 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-ink-200/40 mb-1">Items</p>
                    <p className="text-lg font-display text-purple-400">{specialItemTemplates.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
