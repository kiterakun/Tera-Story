import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorldStore } from "../stores/worldStore";
import { useTranslation } from "../i18n";
import { showSuccess, showError } from "../lib/toast";
import type {
  ResourceTemplate,
  SpecialItemTemplate,
  SpecialItemFieldDefinition,
  World,
  MapData,
} from "../services/worldApi";
import * as supportApi from "../services/supportApi";
import { api } from "../services/api";
import { Sparkles, Loader2, Hash, Type, Gauge, Tags, Eye, MapPin, Check } from "lucide-react";

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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState<World["genre"]>("fantasy");

  const [resources, setResources] = useState<ResourceTemplate[]>([
    { key: "HP", type: "progress", min: 0, max: 100, defaultValue: 100 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [specialItemTemplates, setSpecialItemTemplates] = useState<
    SpecialItemTemplate[]
  >([]);
  const [isEnrichingWorld, setIsEnrichingWorld] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const handleAddResource = () => {
    setResources([
      ...resources,
      { key: `Res${resources.length + 1}`, type: "number", defaultValue: 0 },
    ]);
  };

  const handleRemoveResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleResourceChange = (
    index: number,
    field: keyof ResourceTemplate,
    value: unknown,
  ) => {
    const updated = [...resources];
    const item = updated[index];

    if (field === "type") {
      item.type = value as ResourceTemplate["type"];
    } else if (field === "key") {
      item.key = value as string;
    } else if (field === "displayFormat") {
      item.displayFormat = value as string;
    } else if (field === "options") {
      item.options = value as string[];
    } else if (field === "min" || field === "max" || field === "defaultValue") {
      if (field === "defaultValue") {
        item.defaultValue = item.type !== "text" && item.type !== "enum" && value !== "" ? Number(value) : value;
      } else {
        item[field] = value !== "" ? Number(value) : undefined;
      }
    }

    setResources(updated);
  };

  // Special Item Template handlers
  const handleAddSpecialItemTemplate = () => {
    setSpecialItemTemplates([
      ...specialItemTemplates,
      { category: "", description: "", fields: [] },
    ]);
  };

  const handleRemoveSpecialItemTemplate = (index: number) => {
    setSpecialItemTemplates(specialItemTemplates.filter((_, i) => i !== index));
  };

  const handleSpecialItemChange = (
    index: number,
    field: "category" | "description",
    value: string,
  ) => {
    const updated = [...specialItemTemplates];
    updated[index] = { ...updated[index], [field]: value };
    setSpecialItemTemplates(updated);
  };

  const handleAddField = (templateIndex: number) => {
    const updated = [...specialItemTemplates];
    updated[templateIndex] = {
      ...updated[templateIndex],
      fields: [...updated[templateIndex].fields, { name: "", type: "text" }],
    };
    setSpecialItemTemplates(updated);
  };

  const handleRemoveField = (templateIndex: number, fieldIndex: number) => {
    const updated = [...specialItemTemplates];
    updated[templateIndex] = {
      ...updated[templateIndex],
      fields: updated[templateIndex].fields.filter((_, i) => i !== fieldIndex),
    };
    setSpecialItemTemplates(updated);
  };

  const handleFieldChange = (
    templateIndex: number,
    fieldIndex: number,
    key: keyof SpecialItemFieldDefinition,
    value: unknown,
  ) => {
    const updated = [...specialItemTemplates];
    const fields = [...updated[templateIndex].fields];
    fields[fieldIndex] = {
      ...fields[fieldIndex],
      [key]:
        key === "type"
          ? (value as SpecialItemFieldDefinition["type"])
          : key === "options"
          ? (Array.isArray(value) ? value : (value as string).split(",").map((s) => s.trim()).filter(Boolean))
          : value,
    };
    updated[templateIndex] = { ...updated[templateIndex], fields };
    setSpecialItemTemplates(updated);
  };

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
        specialItemTemplates: specialItemTemplates.filter((t) =>
          t.category.trim(),
        ),
      });
      showSuccess(t.toast.worldCreated);
      
      // Check if map was generated with regions
      if (returnedMapData && returnedMapData.regions.length > 0) {
        setCreatedWorld(newWorld);
        setMapData(returnedMapData);
        setStep("map");
        setIsSubmitting(false);
      } else {
        // No map data, navigate directly
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
      });

      showSuccess(t.toast.playthroughCreated);
      navigate(`/playthroughs/${data.playthrough._id}`);
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
        const validGenres: World["genre"][] = [
          "fantasy",
          "sci-fi",
          "wuxia",
          "modern",
          "custom",
        ];
        setGenre(
          validGenres.includes(result.genre as World["genre"])
            ? (result.genre as World["genre"])
            : "custom",
        );
      }
      if (result.resourceTemplates?.length) {
        setResources(
          result.resourceTemplates.map((rt) => ({
            key: rt.key,
            type: rt.type as ResourceTemplate["type"],
            min: rt.min,
            max: rt.max,
            defaultValue: rt.defaultValue,
            ...(rt.options?.length ? { options: rt.options } : {}),
          })),
        );
      }
      if (result.specialItemTemplates?.length) {
        setSpecialItemTemplates(
          result.specialItemTemplates.map((sit) => ({
            category: sit.category || "",
            description: sit.description || "",
            fields: (sit.fields || []).map((f) => ({
              name: f.name || "",
              type: f.type || "text",
              ...(f.options?.length ? { options: f.options } : {}),
            })),
          })),
        );
      }
    } catch (err) {
      console.error("AI world generation failed:", err);
      showError(t.toast.aiWorldGenFailed);
    } finally {
      setIsEnrichingWorld(false);
    }
  };

  const typeColors: Record<ResourceTemplate['type'], string> = {
    number: 'border-l-blue-400',
    text: 'border-l-green-400',
    progress: 'border-l-amber-400',
    enum: 'border-l-purple-400',
  };

  const typeIcons: Record<ResourceTemplate['type'], (size?: number) => JSX.Element> = {
    number: (s = 14) => <Hash size={s} className="text-blue-400" />,
    text: (s = 14) => <Type size={s} className="text-green-400" />,
    progress: (s = 14) => <Gauge size={s} className="text-amber-400" />,
    enum: (s = 14) => <Tags size={s} className="text-purple-400" />,
  };

  const typeLabelColors: Record<ResourceTemplate['type'], string> = {
    number: 'text-blue-400',
    text: 'text-green-400',
    progress: 'text-amber-400',
    enum: 'text-purple-400',
  };

  // Get selected region details
  const selectedRegion = mapData?.regions.find(r => r._id === selectedRegionId);
  const selectedContinent = selectedRegion 
    ? mapData?.continents.find(c => c._id === selectedRegion.continentId)
    : null;

  // Map step rendering
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

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Map SVG */}
          <div className="flex-1 min-w-0">
            <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6 min-h-[500px] relative">
              {step === "creating" && (
                <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                  <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-accent-400 mx-auto mb-3" />
                    <p className="text-ink-100 font-medium">{t.worldCreate.creatingPlaythrough}</p>
                  </div>
                </div>
              )}
              
              {/* Region Selection List */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {mapData?.regions.map(region => {
                  const continent = mapData.continents.find(c => c._id === region.continentId);
                  const isSelected = region._id === selectedRegionId;

                  return (
                    <button
                      key={region._id}
                      type="button"
                      onClick={() => setSelectedRegionId(region._id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                        isSelected
                          ? 'border-accent-400 bg-accent-600/10 shadow-lg shadow-accent-600/10'
                          : 'border-ink-700 bg-ink-900 hover:border-ink-600 hover:bg-ink-800/80'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-display text-ink-100">{region.name}</h3>
                          {continent && (
                            <p className="text-xs text-ink-200/60 mt-0.5">
                              {continent.name} — {continent.climate}
                            </p>
                          )}
                        </div>
                        <span
                          className="px-2 py-1 rounded-md text-xs text-white shrink-0"
                          style={{ backgroundColor: terrainColors[region.terrainType] || terrainColors.default }}
                        >
                          {region.terrainType}
                        </span>
                      </div>
                      <p className="text-sm text-ink-200/80 mt-2">{region.description}</p>
                    </button>
                  );
                })}
                {(!mapData?.regions || mapData.regions.length === 0) && (
                  <div className="text-center py-8 text-ink-400">
                    <MapPin size={32} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">{t.worldCreate.noRegions || 'No regions available'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selection Panel */}
          <aside className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-8 space-y-4">
              {/* Selected Region Info */}
              {selectedRegion ? (
                <div className="bg-ink-800 border border-accent-400/30 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={18} className="text-accent-400" />
                    <h2 className="text-lg font-display text-ink-100">
                      {selectedRegion.name}
                    </h2>
                  </div>
                  
                  {selectedContinent && (
                    <p className="text-xs text-ink-200/60 mb-2">
                      {selectedContinent.name} • {selectedContinent.climate}
                    </p>
                  )}
                  
                  <p className="text-sm text-ink-200/80 mb-3">
                    {selectedRegion.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="px-2 py-1 rounded-md text-white"
                      style={{ backgroundColor: terrainColors[selectedRegion.terrainType] || terrainColors.default }}
                    >
                      {selectedRegion.terrainType}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-ink-800/50 border border-ink-700 rounded-2xl p-5 text-center">
                  <MapPin size={24} className="text-ink-500 mx-auto mb-3" />
                  <p className="text-ink-200/40 text-sm italic">
                    {t.worldCreate.spawnHint}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleConfirmSpawn}
                  disabled={!selectedRegionId || step === "creating"}
                  className="w-full px-6 py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm hover:shadow-lg hover:shadow-accent-600/20 flex items-center justify-center gap-2"
                >
                  {step === "creating" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t.worldCreate.creatingPlaythrough}
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {t.worldCreate.confirmSpawn}
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate(`/worlds/${createdWorld?._id}`)}
                  disabled={step === "creating"}
                  className="w-full px-5 py-2.5 font-medium text-ink-200 hover:text-ink-100 transition-colors text-sm rounded-xl hover:bg-ink-800 disabled:opacity-50"
                >
                  {t.worldCreate.skipMap || 'Skip & View World'}
                </button>
              </div>

              {/* World Info */}
              {createdWorld && (
                <div className="bg-ink-800/30 border border-ink-700/50 rounded-xl p-4">
                  <p className="text-xs text-ink-200/60 mb-1">{t.worldCreate.worldCreated || 'World Created'}</p>
                  <p className="text-sm font-medium text-ink-100">{createdWorld.name}</p>
                  <p className="text-xs text-ink-200/40 mt-1">{mapData?.regions.length || 0} regions</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-display text-ink-100">
          {t.worldCreate.title}
        </h1>
        <p className="text-ink-200/60 mt-2 text-sm">{t.worldCreate.subtitle}</p>
        <div className="mt-3 h-px bg-gradient-to-r from-accent-400/60 via-accent-600/30 to-transparent" />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <form onSubmit={handleSubmit} className="space-y-6 flex-1 min-w-0">
          {/* AI World Generation */}
        <div className="bg-gradient-to-br from-accent-600/10 to-purple-600/10 border border-accent-400/20 rounded-2xl p-6">
          <h2 className="text-lg font-display text-ink-100 mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-accent-400" />
            {t.worldCreate.aiGenerateTitle}
          </h2>
          <p className="text-xs text-ink-200/60 mb-4">
            {t.worldCreate.aiGenerateHint}
          </p>
          <textarea
            rows={3}
            className="w-full bg-ink-950 border border-ink-700 rounded-xl px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all resize-none text-sm mb-3"
            placeholder={t.worldCreate.aiPromptPlaceholder}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            disabled={isEnrichingWorld}
          />
          <button
            type="button"
            onClick={handleAiGenerateWorld}
            disabled={isEnrichingWorld || !aiPrompt.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm disabled:opacity-50"
          >
            {isEnrichingWorld ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t.worldCreate.aiGenerating}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {t.worldCreate.aiGenerateWorld}
              </>
            )}
          </button>
        </div>

        {/* Basic Info Card */}
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
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
                {t.worldCreate.genre}
              </label>
              <select
                className="w-full bg-ink-950 border border-ink-700 rounded-xl px-4 py-3 text-ink-100 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all text-sm"
                value={genre}
                onChange={(e) => setGenre(e.target.value as World["genre"])}
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
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Resources Card */}
        <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-lg font-display text-ink-100 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-accent-400 rounded-full" />
                {t.worldCreate.resourceTemplates}
              </h2>
              <p className="text-xs text-ink-200/60 mt-1 ml-4">
                {t.worldCreate.resourceHint}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddResource}
              className="inline-flex items-center gap-1.5 text-accent-400 hover:text-accent-500 font-medium px-3 py-2 bg-ink-950/50 border border-ink-700 rounded-xl transition-all duration-200 text-sm hover:border-accent-400/30"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 4v16m8-8H4" />
              </svg>
              {t.worldCreate.add}
            </button>
          </div>

          <div className="space-y-3">
            {resources.map((res, index) => (
              <div
                key={index}
                className={`bg-ink-950/50 p-4 border border-ink-700/50 rounded-xl border-l-2 ${typeColors[res.type]}`}
              >
                {/* Header with key + type + remove button */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {typeIcons[res.type](16)}
                    <span className="text-sm font-medium text-ink-100">{res.key || 'Unnamed'}</span>
                    <span className={`text-[10px] font-medium uppercase ${typeLabelColors[res.type]}`}>{res.type}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveResource(index)}
                    className="text-ink-200/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-all shrink-0"
                    title={t.worldCreate.removeResource}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Key */}
                  <div>
                    <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
                      {t.worldCreate.nameKey}
                    </label>
                    <input
                      required
                      className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 placeholder:text-ink-500 focus:border-accent-400 outline-none transition-all"
                      placeholder={t.worldCreate.nameKeyPlaceholder}
                      value={res.key}
                      onChange={(e) =>
                        handleResourceChange(index, "key", e.target.value)
                      }
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
                      {t.worldCreate.type}
                    </label>
                    <select
                      className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 focus:border-accent-400 outline-none transition-all"
                      value={res.type}
                      onChange={(e) =>
                        handleResourceChange(index, "type", e.target.value)
                      }
                    >
                      <option value="number">{t.worldCreate.typeNumber}</option>
                      <option value="progress">
                        {t.worldCreate.typeProgress}
                      </option>
                      <option value="text">{t.worldCreate.typeText}</option>
                      <option value="enum">{t.worldCreate.typeEnum}</option>
                    </select>
                  </div>

                  {res.type === "number" || res.type === "progress" ? (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
                          {t.worldCreate.defaultVal}
                        </label>
                        <input
                          type="number"
                          className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 focus:border-accent-400 outline-none transition-all"
                          value={res.defaultValue ?? ""}
                          onChange={(e) =>
                            handleResourceChange(
                              index,
                              "defaultValue",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
                            {t.worldCreate.min}
                          </label>
                          <input
                            type="number"
                            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 focus:border-accent-400 outline-none transition-all"
                            value={res.min ?? ""}
                            onChange={(e) =>
                              handleResourceChange(index, "min", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
                            {t.worldCreate.max}
                          </label>
                          <input
                            type="number"
                            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 focus:border-accent-400 outline-none transition-all"
                            value={res.max ?? ""}
                            onChange={(e) =>
                              handleResourceChange(index, "max", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </>
                  ) : res.type === "enum" ? (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
                          {t.worldCreate.defaultVal}
                        </label>
                        <input
                          type="text"
                          className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 focus:border-accent-400 outline-none transition-all"
                          value={res.defaultValue ?? ""}
                          onChange={(e) =>
                            handleResourceChange(
                              index,
                              "defaultValue",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
                          {t.worldCreate.options}
                        </label>
                        <div className="space-y-2">
                          {(res.options ?? []).map((opt, optIdx) => (
                            <div key={optIdx} className="flex gap-2 items-center">
                              <input
                                className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 placeholder:text-ink-500 focus:border-accent-400 outline-none transition-all"
                                placeholder={t.worldCreate.optionsPlaceholder}
                                value={opt}
                                onChange={(e) => {
                                  const newOptions = [...(res.options ?? [])];
                                  newOptions[optIdx] = e.target.value;
                                  handleResourceChange(index, "options", newOptions);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = (res.options ?? []).filter((_, i) => i !== optIdx);
                                  handleResourceChange(index, "options", newOptions);
                                }}
                                className="text-ink-200/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-all shrink-0"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = [...(res.options ?? []), ""];
                              handleResourceChange(index, "options", newOptions);
                            }}
                            className="text-sm text-accent-400 hover:text-accent-300 transition-colors"
                          >
                            + {t.worldCreate.addOption}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
                        {t.worldCreate.defaultText}
                      </label>
                      <input
                        type="text"
                        className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 focus:border-accent-400 outline-none transition-all"
                        value={res.defaultValue ?? ""}
                        onChange={(e) =>
                          handleResourceChange(
                            index,
                            "defaultValue",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {resources.length === 0 && (
              <div className="text-center py-8 border border-dashed border-ink-700 rounded-xl text-ink-200/40 text-sm">
                {t.worldCreate.noResources}
              </div>
            )}
          </div>
        </div>

        {/* Special Item Templates Card */}
        <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-lg font-display text-ink-100 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-purple-400 rounded-full" />
                {t.worldCreate.specialItemTemplates}
              </h2>
              <p className="text-xs text-ink-200/60 mt-1 ml-4">
                {t.worldCreate.specialItemHint}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSpecialItemTemplate}
              className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-medium px-3 py-2 bg-ink-950/50 border border-ink-700 rounded-xl transition-all duration-200 text-sm hover:border-purple-400/30"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 4v16m8-8H4" />
              </svg>
              {t.worldCreate.add}
            </button>
          </div>

          <div className="space-y-4">
            {specialItemTemplates.map((sit, tIdx) => (
              <div
                key={tIdx}
                className="bg-ink-950/50 p-4 border border-ink-700/50 rounded-xl space-y-3"
              >
                <div className="flex gap-3 items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-ink-200/60 mb-1">
                        {t.worldCreate.categoryName}
                      </label>
                      <input
                        required
                        className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-purple-400 outline-none transition-all"
                        placeholder={t.worldCreate.categoryNamePlaceholder}
                        value={sit.category}
                        onChange={(e) =>
                          handleSpecialItemChange(
                            tIdx,
                            "category",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-200/60 mb-1">
                        {t.worldCreate.categoryDescription}
                      </label>
                      <input
                        className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-purple-400 outline-none transition-all"
                        placeholder={
                          t.worldCreate.categoryDescriptionPlaceholder
                        }
                        value={sit.description}
                        onChange={(e) =>
                          handleSpecialItemChange(
                            tIdx,
                            "description",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecialItemTemplate(tIdx)}
                    className="mt-5 text-ink-200/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-all"
                    title={t.worldCreate.removeCategory}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Custom Fields */}
                <div className="ml-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-ink-200/50 font-medium">
                      {t.worldCreate.customFields}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddField(tIdx)}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      + {t.worldCreate.addField}
                    </button>
                  </div>
                  {sit.fields.map((field, fIdx) => (
                    <div key={fIdx} className="mb-2">
                      <div className="flex gap-2 items-center">
                        <input
                          className="flex-1 bg-ink-800 border border-ink-700 rounded-lg px-3 py-1.5 text-xs text-ink-100 focus:border-purple-400 outline-none transition-all"
                          placeholder={t.worldCreate.fieldName}
                          value={field.name}
                          onChange={(e) =>
                            handleFieldChange(tIdx, fIdx, "name", e.target.value)
                          }
                        />
                        <select
                          className="bg-ink-800 border border-ink-700 rounded-lg px-2 py-1.5 text-xs text-ink-100 focus:border-purple-400 outline-none transition-all"
                          value={field.type}
                          onChange={(e) =>
                            handleFieldChange(tIdx, fIdx, "type", e.target.value)
                          }
                        >
                          <option value="text">{t.worldCreate.typeText}</option>
                          <option value="number">
                            {t.worldCreate.typeNumber}
                          </option>
                          <option value="enum">{t.worldCreate.typeEnum}</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(tIdx, fIdx)}
                          className="text-ink-200/40 hover:text-red-400 p-1 rounded transition-all shrink-0"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {field.type === "enum" && (
                        <div className="mt-2 ml-2 space-y-1.5">
                          {(field.options ?? []).map((opt, optIdx) => (
                            <div key={optIdx} className="flex gap-1.5 items-center">
                              <input
                                className="flex-1 bg-ink-800 border border-ink-700 rounded-lg px-3 py-1.5 text-xs text-ink-100 placeholder:text-ink-500 focus:border-purple-400 outline-none transition-all"
                                placeholder={t.worldCreate.optionsPlaceholder}
                                value={opt}
                                onChange={(e) => {
                                  const newOptions = [...(field.options ?? [])];
                                  newOptions[optIdx] = e.target.value;
                                  handleFieldChange(tIdx, fIdx, "options", newOptions);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = (field.options ?? []).filter((_, i) => i !== optIdx);
                                  handleFieldChange(tIdx, fIdx, "options", newOptions);
                                }}
                                className="text-ink-200/40 hover:text-red-400 p-1 rounded transition-all shrink-0"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = [...(field.options ?? []), ""];
                              handleFieldChange(tIdx, fIdx, "options", newOptions);
                            }}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            + {t.worldCreate.addOption}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {specialItemTemplates.length === 0 && (
              <div className="text-center py-8 border border-dashed border-ink-700 rounded-xl text-ink-200/40 text-sm">
                {t.worldCreate.noSpecialItems}
              </div>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate("/worlds")}
            className="px-5 py-2.5 font-medium text-ink-200 hover:text-ink-100 transition-colors text-sm rounded-xl hover:bg-ink-800"
            disabled={isSubmitting}
          >
            {t.worldCreate.cancel}
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50 text-sm shadow-sm hover:shadow-lg hover:shadow-accent-600/20"
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {t.worldCreate.forging}
              </span>
            ) : (
              t.worldCreate.createWorld
            )}
          </button>
        </div>
      </form>
        <aside className="lg:w-80 shrink-0">
          <div className="lg:sticky lg:top-8">
            {resources.length > 0 ? (
              <div className="bg-ink-800/50 border border-ink-700 rounded-2xl p-5">
                <h2 className="text-lg font-display text-ink-100 mb-4 flex items-center gap-2">
                  <Eye size={18} className="text-accent-400" />
                  Preview
                </h2>
                <div className="space-y-3">
                  {resources.map((res) => (
                    <div key={res.key} className={`flex flex-col gap-1.5 p-3 bg-ink-950/50 border rounded-xl border-l-2 ${typeColors[res.type]}`}>
                      <div className="flex items-center gap-2">
                        {typeIcons[res.type](14)}
                        <span className="text-xs text-ink-200/70">{res.key}</span>
                        <span className={`text-[10px] font-medium uppercase ${typeLabelColors[res.type]}`}>{res.type}</span>
                      </div>
                      {res.type === 'number' && (
                        <div className="text-sm text-ink-100 font-mono pl-6">
                          {res.defaultValue ?? 0}
                        </div>
                      )}
                      {res.type === 'text' && (
                        <div className="text-sm text-ink-100 pl-6">
                          {String(res.defaultValue ?? 'Sample text')}
                        </div>
                      )}
                      {res.type === 'progress' && (
                        <div className="pl-6">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-ink-200/70">{res.key}</span>
                            <span className="text-ink-100 font-mono">{res.defaultValue ?? 0} / {res.max ?? 100}</span>
                          </div>
                          <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, ((Number(res.defaultValue) || 0) / (res.max || 100)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {res.type === 'enum' && (
                        <div className="pl-6">
                          {(res.options?.length ?? 0) > 0 ? (
                            <div className="space-y-1">
                              <span className="text-sm text-ink-100 font-mono">{String(res.defaultValue ?? res.options?.[0] ?? '')}</span>
                              <div className="flex flex-wrap gap-1">
                                {res.options?.map((opt, i) => (
                                  <span key={i} className="inline-block text-[10px] text-purple-300 bg-purple-400/10 border border-purple-400/20 rounded-md px-1.5 py-0.5">
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-ink-200/50 italic">No options defined</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-ink-800/50 border border-ink-700 rounded-2xl p-5 text-center">
                <Eye size={24} className="text-ink-500 mx-auto mb-3" />
                <p className="text-ink-200/40 text-sm italic">Add a resource to preview</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
