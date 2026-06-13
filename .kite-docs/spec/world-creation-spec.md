# Tera-Story World Creation Wizard & AI Generator Spec

> **Status**: Phase 6 / Step 1
> **Branch**: `feat/ui-ux-upgrade`
> **Last updated**: 2026-06-13

---

## 1. Purpose

World creation is the entry point for new playthroughs. It currently
mixes 5 steps, AI generation, template editing, and validation in a
single 330-LOC page. This spec defines:

- How `WorldCreatePage.tsx` splits into a slim wizard shell + 5
  focused step components
- Wizard step flow, validation, and save state semantics
- AI generator UX (AI world generator + AI character generator)
- Error states, loading states, and empty states
- Mobile behavior at 320/768/1280px

## 2. Current State (problem)

`pages/WorldCreatePage.tsx` is **330 LOC** and mixes 5 concerns:
- Page-level state (active step, draft world, AI draft, errors)
- All 5 wizard steps inline
- AI world generator overlay
- AI character generator overlay
- 3 separate template editors (resource, special-item, organization)

Inline `terrainColors` literal map with 10 hardcoded hex values.

## 3. Target Structure

### 3.1 Component decomposition

```
pages/WorldCreatePage.tsx (≤100 LOC: routing + draft state)
└── world-create/
    ├── WorldCreateWizard.tsx       (wizard shell + step navigation)
    ├── BasicInfoStep.tsx           (name, description, genre)
    ├── MapSelectionStep.tsx        (existing — refactored)
    ├── ResourceTemplateEditor.tsx  (existing — refactored)
    ├── SpecialItemTemplateEditor.tsx (existing — refactored)
    ├── OrganizationTemplateEditor.tsx (existing — refactored)
    ├── WizardProgress.tsx          (step indicator)
    ├── WizardNav.tsx                (back/next/save buttons)
    ├── AiWorldGenerator.tsx        (existing — improved)
    ├── AiCharacterGenerator.tsx     (existing — improved)
    └── WizardSummary.tsx            (review + create button)
```

### 3.2 Step flow

The wizard has 5 steps. Users can move forward via "Next" and
backward via "Back". Each step is independently validated; the
"Next" button is disabled until the step is valid.

| Step | Required fields | Validation |
|---|---|---|
| 1. Basic Info | name, genre | name 1-80 chars, genre required |
| 2. Map | map data (3 continents, 9 regions, 27 locations) | counts must be 3/9/27 OR "AI generate" |
| 3. Resource Templates | ≥1 template | name + type required |
| 4. Special Item Templates | ≥0 templates | optional |
| 5. Organization Templates | ≥0 templates | optional |

`Save Draft` button is available on every step. Drafts persist in
`localStorage` keyed by `worldDraft:${userId}`.

## 4. Save State

The wizard state lives in the `useWorldDraft` hook:

```ts
const {
  draft,         // WorldDraft | null
  isLoading,     // boolean
  isSaving,      // boolean
  error,         // string | null
  save,          // () => Promise<void>
  load,          // () => void
  clear,         // () => void
  update,        // (patch: Partial<WorldDraft>) => void
} = useWorldDraft();
```

`WorldDraft` is a partial `World` with optional `resourceTemplates`,
`locationResourceTemplates`, `organizationTemplates`, and `mapData`.

`save` writes to localStorage and to the server-side draft endpoint
(stub for now). `clear` removes localStorage and unsets state.

On mount, the hook attempts to `load` from localStorage. If a draft
exists, the user sees a "Resume draft?" prompt at the top of the
wizard with "Resume" / "Discard" actions.

## 5. Validation

Per-step validation runs on every field change. Errors appear below
the field with `aria-invalid` + `aria-describedby`. The "Next" button
is disabled when `stepErrors[activeStep]` is non-empty.

When the user clicks "Create world", the full draft is validated.
If any step is invalid, the wizard scrolls to the first invalid step
and surfaces a summary at the top.

## 6. AI Generator UX

### 6.1 AI World Generator

The AI World Generator is a full-page modal overlay that lets the
user describe a world and have the AI generate the entire draft.

**Prompt affordances**:
- Genre dropdown (fantasy / sci-fi / wuxia / modern / custom)
- Freeform description (1-500 chars)
- Tone chips: dark, hopeful, epic, gritty, mysterious
- "Inspire me" button: fills the description with a random seed
  (cycled through 12 pre-written prompts)

**State machine**:
- Idle: prompt form visible
- Generating: <Spinner size=lg /> + "Generating world…"
- Error: error message + retry button (no auto-retry)
- Success: preview of generated world with "Accept" / "Regenerate" / "Edit manually"

### 6.2 AI Character Generator

Lives in the basic info step, lets the user generate a protagonist
seed. The output is a partial character (name, description, role)
that can be edited before continuing.

Same state machine as the world generator.

## 7. Template Editors

### 7.1 ResourceTemplateEditor

Existing component, will be polished:
- Add/remove rows (buttons with aria-label)
- Per-row: key, type, min/max (for number/progress/pool), default
  value, options (for enum), display format
- Live preview of the resource's effect on a stat card
- Use the design-system `Input` primitive for all text fields
- Use the design-system `Badge` for type indicators

### 7.2 SpecialItemTemplateEditor

Existing component, will be polished:
- Add/remove templates (each with category + description + fields)
- Per-template: category, description, field list
- Per-field: name, type, options, required
- Use design-system `Input` and `Select` (or `Input` with `as` for select)

### 7.3 OrganizationTemplateEditor

Existing component, will be polished:
- Add/remove templates (each with type + description + default stats)
- Per-template: type, description, default stats (reuse
  ResourceTemplateEditor for the stats sub-list)
- Use design-system `Input` for all text fields

## 8. Mobile Behavior

- 320px: each step stacks vertically; template editor rows collapse
  to a card per row; AI generator prompt uses a full-screen modal.
- 768px: steps use a 2-column layout where possible (e.g., name +
  description side by side).
- 1280px: 3-column layout; templates preview side-by-side with
  editor.

The step indicator is always visible at the top (sticky). Back/Next
buttons live in a sticky footer on mobile and inline on desktop.

## 9. Error States

- Field-level: red border + inline error text below the field.
- Step-level: alert banner at the top of the step listing all errors.
- Wizard-level: full-page error boundary (Phase 3 ErrorBoundary wraps
  the wizard).
- Network errors: toast notification via the existing `notifyError`
  helper + retry button.

## 10. Loading States

- Page load: <Spinner size=lg /> centered.
- Step transition: no spinner (instant local state change).
- Save: button shows <Spinner size=sm /> inline + disabled state.
- AI generation: full-overlay spinner (see 6.1).
- Template load: inline <Spinner size=sm /> next to the field.

## 11. Accessibility Contract

- Wizard step indicator: `role=list` of steps, each `role=listitem`
  with `aria-current="step"` on the active step.
- "Next" / "Back" buttons have aria-labels including the step name.
- Form fields have associated `<label>` elements with `htmlFor`.
- Error messages use `aria-describedby` to point to the error.
- AI generator modal uses the Modal primitive (Phase 3 a11y).
- Template editor rows have an "Remove" button with `aria-label`
  including the row key.

## 12. State Management

The wizard state is local to the `useWorldDraft` hook. No global
state. The hook is a thin wrapper around:

- localStorage (`worldDraft:${userId}`)
- Optional server draft endpoint (stubbed for now)

The `WorldCreatePage` component renders the wizard shell and passes
the hook's state + actions to the step components.

## 13. File Migration Plan

| Step | Files | Risk |
|---|---|---|
| 2 | Split WorldCreatePage into wizard shell + 5 step files | Medium (state migration) |
| 3 | Replace terrainColors with design-system tokens | Low (simple) |
| 4 | Improve AI generators (prompt affordances, error states) | Low |
| 5 | Polish template editors (labels, error states, add/remove) | Low |
| 12 | Verification | Low |

## 14. Out of Scope

- Multiplayer world creation (Phase 7+)
- World versioning / history (Phase 7+)
- World template marketplace (Phase 7+)
- Auto-save (deferred; manual Save Draft is sufficient for now)
