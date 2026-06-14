export default {
  nav: {
    features: 'Features',
    showcase: 'Showcase',
    mediaGuide: 'Media Guide',
    login: 'Login',
    getStarted: 'Start your saga',
    enterWorlds: 'Enter your worlds',
  },
  hero: {
    badge: 'Premium AI interactive storytelling platform',
    title: 'Build worlds that',
    titleAccent: 'remember every choice',
    subtitle: 'Tera-Story turns your lore, protagonist, map, factions, stats, and consequences into cinematic branching adventures powered by specialized AI agents.',
    ctaPrimary: 'Start your saga',
    ctaSecondary: 'Watch the experience',
    videoLabel: 'Tera-Story cinematic hero preview',
  },
  mediaPanel: {
    badge: 'Hero preview',
    chapterLabel: 'Live chapter',
    chapterTitle: 'The Starless Gate Opens',
    arcBadge: 'Arc II\nEcho active',
    description: 'Your protagonist raises the lantern. Gold threads ignite across the ruined observatory, mapping every promise, betrayal, and path not taken.',
    choices: [
      'Negotiate with the Archivist',
      'Enter the mirror continent',
      'Invoke the ember oath',
      'Send a whisper ahead',
    ],
  },
  stats: {
    geography: 'world geography',
    tools: 'story tools',
    achievements: 'achievements',
    paths: 'branching paths',
  },
  features: {
    eyebrow: 'Why it feels alive',
    title: 'A story platform with game-state memory.',
    subtitle: 'Instead of one-off chat, Tera-Story coordinates writer, context, image, support, and map agents around persistent entities.',
    items: [
      {
        title: 'AI writer agents',
        description: 'Two-pass story generation blends cinematic prose with persistent game-state updates.',
      },
      {
        title: 'Living worlds',
        description: 'Create continents, regions, locations, factions, resources, lore, and evolving conflicts.',
      },
      {
        title: 'RPG progression',
        description: 'Track stats, relationships, items, abilities, combat encounters, echoes, and achievements.',
      },
      {
        title: 'Interactive maps',
        description: 'Explore AI-generated geography with discovered locations and story-aware travel routes.',
      },
    ],
  },
  showcase: {
    eyebrow: 'Showcase',
    title: 'From blank premise to playable saga.',
    description: 'Design a world, create a protagonist, then let the system generate chapters, choices, maps, collectibles, and consequences that keep evolving.',
    highlights: [
      'Branching choices with delayed consequences',
      'AI-generated cards, whispers, and chronicle recaps',
      'Character-first adventures with custom progression',
      'Vietnamese and English storytelling support',
    ],
    cards: [
      { label: 'Protagonist', value: 'Oathbound cartographer' },
      { label: 'Current location', value: 'The Glass Meridian' },
      { label: 'Faction pressure', value: 'Archivists +14' },
      { label: 'Relic discovered', value: 'Solar Ink Prism' },
    ],
  },
  cinematic: {
    eyebrow: 'Cinematic previews',
    title: 'Every screen feels like a story moment.',
    description: 'World maps, prose, character sheets, and collectible cards — all rendered with the same cinematic dark + gold premium language.',
    worldMap: {
      label: 'World intelligence',
      title: 'Living geography',
      description: 'Explore continents, regions, and discovered locations with story-aware travel routes.',
    },
    reader: {
      label: 'Story studio',
      title: 'Cinematic chapters',
      description: 'Generated prose, choices, and consequences delivered in a premium reader flow.',
    },
    character: {
      label: 'Protagonist',
      title: 'RPG character sheet',
      description: 'Stats, inventory, abilities, and relationship threads that remember every choice.',
    },
    gallery: {
      label: 'Collectibles',
      title: 'Story card gallery',
      description: 'Unlock pivotal scenes as rare, epic, and legendary cards to share and revisit.',
    },
  },
  mediaGuide: {
    eyebrow: 'Media-ready',
    title: 'Drop in your own cinematic assets.',
    description: 'The current page uses polished CSS/SVG-style placeholders. Replace them later with local WebM/MP4/WebP assets using the exact guide in',
    readmePath: 'frontend/public/landing/README.md',
    slotLabel: 'Recommended asset slots',
    webm: '8–15s muted looping hero video.',
    mp4: 'Safari/mobile fallback video.',
    poster: '2560×1440 poster frame.',
    showcase: 'cinematic feature stills and UI mockups.',
  },
  faq: {
    eyebrow: 'Questions',
    title: 'Built for ambitious story worlds.',
    questions: [
      {
        question: 'Is Tera-Story a writing app or a game?',
        answer: 'Both. It reads like premium interactive fiction while preserving RPG-style entities, stats, choices, maps, and progression.',
      },
      {
        question: 'Can I replace the placeholder media?',
        answer: 'Yes. The landing page is built with local media slots and a media guide that lists exact file paths, formats, dimensions, and AI prompts.',
      },
      {
        question: 'Do I need to log in to view the landing page?',
        answer: 'No. The homepage is public. Logged-in players get a direct path back to their worlds.',
      },
    ],
  },
  cta: {
    title: 'Ready to open the next gate?',
    description: 'Start with one protagonist and one world. Tera-Story will help the saga grow into maps, factions, echoes, chapters, and legends.',
    primary: 'Start your saga',
    login: 'Login',
  },
  footer: {
    copyright: '© 2026 Tera-Story. AI-powered interactive storytelling.',
    links: {
      login: 'Login',
      register: 'Register',
      worlds: 'Worlds',
    },
  },
} as const;
