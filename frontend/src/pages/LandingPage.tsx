import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  ChevronRight,
  Compass,
  Crown,
  Film,
  Gem,
  Globe2,
  Layers3,
  Map,
  Pause,
  Play,
  Sparkles,
  Swords,
  Users,
  WandSparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n';
import { Button, Card, CardBody, cn } from '../design-system';
import logo from '../assets/logo.png';

const FEATURE_ICONS = [BrainCircuit, Globe2, Swords, Map] as const;
const MEDIA_CARD_ICONS = [Layers3, Film, WandSparkles] as const;
const SHOWCASE_ICONS = [Crown, Compass, Users, Gem] as const;

function GlowOrb({ className }: { className: string }) {
  return <div aria-hidden="true" className={cn('absolute rounded-full blur-3xl', className)} />;
}

function DataThread({ className }: { className: string }) {
  return (
    <div aria-hidden="true" className={cn('absolute h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent opacity-70', className)} />
  );
}

export default function LandingPage() {
  const t = useTranslation() as unknown as Record<string, unknown>;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const l = t;
  const nav = (l.nav || {}) as Record<string, string>;
  const hero = (l.hero || {}) as Record<string, string>;
  const statsSec = (l.stats || {}) as Record<string, string>;
  const featuresSec = (l.features || {}) as Record<string, unknown>;
  const featureItems = (featuresSec.items || []) as Array<Record<string, string>>;
  const showcaseSec = (l.showcase || {}) as Record<string, unknown>;
  const showcaseList = (showcaseSec.highlights || []) as string[];
  const showcaseCardData = (showcaseSec.cards || []) as Array<Record<string, string>>;
  const cinematic = (l.cinematic || {}) as Record<string, unknown>;
  const cinematicWorld = (cinematic.worldMap || {}) as Record<string, string>;
  const cinematicReader = (cinematic.reader || {}) as Record<string, string>;
  const cinematicCharacter = (cinematic.character || {}) as Record<string, string>;
  const cinematicGallery = (cinematic.gallery || {}) as Record<string, string>;
  const mediaPanel = (l.mediaPanel || {}) as Record<string, unknown>;
  const mediaChoices = (mediaPanel.choices || []) as string[];
  const mediaGuide = (l.mediaGuide || {}) as Record<string, unknown>;
  const faqSec = (l.faq || {}) as Record<string, unknown>;
  const faqs = (faqSec.questions || []) as Array<Record<string, string>>;
  const cta = (l.cta || {}) as Record<string, string>;
  const footer = (l.footer || {}) as Record<string, unknown>;
  const footerLinks = (footer.links || {}) as Record<string, string>;

  const primaryHref = isAuthenticated ? '/worlds' : '/register';
  const primaryLabel = isAuthenticated ? nav.enterWorlds : nav.getStarted;

  // Hero video controls: pause/play both the full-bleed background and the
  // hero card video. Respect prefers-reduced-motion (auto-pause on load).
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const cardVideoRef = useRef<HTMLVideoElement>(null);
  const [videoPaused, setVideoPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    // If user prefers reduced motion, keep both videos paused so we don't
    // fight their system preference. (We don't setVideoPaused here because
    // effect body must not call setState synchronously per react-hooks rule;
    // initial-state factory above handles the initial value.)
    if (reducedMotion) {
      bgVideoRef.current?.pause();
      cardVideoRef.current?.pause();
    }
  }, [reducedMotion]);

  const toggleVideo = () => {
    const next = !videoPaused;
    if (next) {
      bgVideoRef.current?.pause();
      cardVideoRef.current?.pause();
    } else if (!reducedMotion) {
      // Don't resume if user prefers reduced motion.
      bgVideoRef.current?.play().catch(() => {/* ignore autoplay rejection */});
      cardVideoRef.current?.play().catch(() => {/* ignore autoplay rejection */});
    }
    setVideoPaused(next);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-ink-950 text-ink-200">
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <video ref={bgVideoRef} className="absolute inset-0 h-full w-full object-cover opacity-25" autoPlay={!reducedMotion} loop muted playsInline preload="metadata" poster="/landing/hero-poster.webp">
          <source src="/landing/hero-cinematic.webm" type="video/webm" />
          <source src="/landing/hero-cinematic.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(79,70,229,0.16),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,1)_48%,rgba(0,0,0,1))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(252,211,77,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(252,211,77,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
        <GlowOrb className="left-[-12rem] top-20 h-96 w-96 bg-gold-500/20" />
        <GlowOrb className="right-[-10rem] top-56 h-[28rem] w-[28rem] bg-accent-600/20" />
        <GlowOrb className="bottom-0 left-1/3 h-80 w-80 bg-gold-400/10" />
        <DataThread className="left-0 top-32 w-[38rem] rotate-12 animate-pulse" />
        <DataThread className="right-[-6rem] top-[28rem] w-[44rem] -rotate-12 animate-pulse" />
      </div>

      {/* Hero video pause/play control — respects prefers-reduced-motion. */}
      <button
        type="button"
        onClick={toggleVideo}
        aria-label={videoPaused ? (nav.playVideo ?? 'Play hero video') : (nav.pauseVideo ?? 'Pause hero video')}
        aria-pressed={videoPaused}
        className={cn(
          'fixed bottom-4 right-4 z-30 flex items-center gap-2',
          'min-h-[44px] min-w-[44px] rounded-full px-4',
          'bg-ink-900/80 backdrop-blur-md border border-gold-400/30',
          'text-ink-100 hover:text-gold-400 hover:border-gold-400/60',
          'transition-all duration-base ease-standard',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
          'shadow-lg shadow-black/40',
        )}
      >
        {videoPaused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
        <span className="hidden sm:inline text-sm font-medium">
          {videoPaused ? (nav.playVideo ?? 'Play') : (nav.pauseVideo ?? 'Pause')}
        </span>
      </button>

      <header className="relative z-10 border-b border-ink-700/50 bg-ink-950/55 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8" aria-label="Landing navigation">
          <Link to="/" className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded-2xl">
            <img src={logo} alt="Tera-Story" className="h-11 w-11 rounded-2xl shadow-gold" />
            <div>
              <p className="font-display text-xl text-ink-100">Tera-Story</p>
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-gold-400">AI Saga Engine</p>
            </div>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-ink-200/75 md:flex">
            <a href="#features" className="transition-colors hover:text-gold-400">{nav.features}</a>
            <a href="#showcase" className="transition-colors hover:text-gold-400">{nav.showcase}</a>
            <a href="#media" className="transition-colors hover:text-gold-400">{nav.mediaGuide}</a>
          </div>
          <div className="flex items-center gap-3">
            {!isAuthenticated && (
              <Link to="/login" className="hidden rounded-xl px-4 py-2 text-sm font-medium text-ink-200/80 transition-colors hover:text-ink-100 sm:inline-flex">{nav.login}</Link>
            )}
            <Button href={primaryHref} variant="gold" size="md" className="text-ink-950">{primaryLabel}</Button>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-28">
          <div className="mx-auto max-w-4xl text-center animate-fade-in">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-2 text-sm text-gold-400 shadow-gold">
              <Sparkles className="h-4 w-4" />
              {hero.badge}
            </div>
            <h1 className="font-display text-5xl leading-tight text-ink-100 sm:text-6xl lg:text-7xl">
              {hero.title} <span className="bg-gradient-to-r from-gold-400 via-gold-500 to-accent-400 bg-clip-text text-transparent">{hero.titleAccent}</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-ink-200/75 sm:text-xl">{hero.subtitle}</p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button href={primaryHref} variant="gold" size="lg" className="px-8 text-ink-950" rightIcon={<ArrowRight className="h-5 w-5" />}>{primaryLabel}</Button>
              <Button href="#showcase" variant="secondary" size="lg" className="border-gold-400/30 bg-ink-900/70 px-8 text-ink-100 hover:border-gold-400/60">{hero.ctaSecondary}</Button>
            </div>
          </div>

          <div className="mt-16 lg:mt-20">
            <div className="relative mx-auto max-w-5xl animate-scale-in" aria-label={hero.videoLabel}>
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-gold-500/20 via-accent-500/20 to-gold-400/10 blur-2xl" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[2rem] border border-gold-400/20 bg-ink-900/90 shadow-2xl shadow-black/40 backdrop-blur-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_85%_0%,rgba(99,102,241,0.18),transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.35),rgba(0,0,0,0.75))]" />
                <div className="relative grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.35fr_0.65fr] lg:p-8">
                  <div className="min-h-[360px] overflow-hidden rounded-3xl border border-ink-700/80 bg-ink-950/80 p-5 sm:p-7">
                    <div className="flex items-center justify-between gap-4 border-b border-ink-700/60 pb-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-400">{mediaPanel.chapterLabel as string}</p>
                        <h2 className="mt-2 font-display text-2xl text-ink-100 sm:text-3xl">{mediaPanel.chapterTitle as string}</h2>
                      </div>
                      <div className="rounded-2xl border border-gold-400/30 bg-gold-400/10 px-3 py-2 text-right text-xs text-gold-400 whitespace-pre-line">{mediaPanel.arcBadge as string}</div>
                    </div>
                    <div className="mt-6 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
                      <div className="relative min-h-56 overflow-hidden rounded-2xl border border-gold-400/20 bg-gradient-to-br from-ink-800 via-ink-950 to-black">
                        <video ref={cardVideoRef} className="absolute inset-0 h-full w-full object-cover opacity-90" autoPlay={!reducedMotion} loop muted playsInline preload="metadata" poster="/landing/hero-poster.webp" aria-label={hero.videoLabel}>
                          <source src="/landing/hero-cinematic.webm" type="video/webm" />
                          <source src="/landing/hero-cinematic.mp4" type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 bg-gradient-to-tr from-ink-950/70 via-ink-950/30 to-transparent" aria-hidden="true" />
                        <div className="absolute inset-x-8 top-8 h-24 rounded-full bg-gold-400/20 blur-2xl" aria-hidden="true" />
                        <div className="absolute bottom-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full border border-gold-400/30 bg-accent-600/10 shadow-gold" aria-hidden="true" />
                        <div className="absolute bottom-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full border border-gold-400/50 bg-ink-950/70" aria-hidden="true" />
                        <div className="absolute left-6 top-8 h-28 w-px rotate-12 bg-gradient-to-b from-transparent via-gold-400/70 to-transparent" aria-hidden="true" />
                        <div className="absolute right-8 top-10 h-32 w-px -rotate-12 bg-gradient-to-b from-transparent via-accent-400/70 to-transparent" aria-hidden="true" />
                        <span className="relative inline-flex rounded-full border border-gold-400/30 bg-black/30 px-3 py-1 text-xs text-gold-400 backdrop-blur m-4">{mediaPanel.badge as string}</span>
                      </div>
                      <div className="space-y-4">
                        <p className="font-serif text-lg leading-8 text-ink-100/90">{mediaPanel.description as string}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {mediaChoices.map((choice) => (
                            <div key={choice} className="rounded-2xl border border-ink-700/70 bg-ink-800/70 p-3 text-sm text-ink-200 transition-all hover:border-gold-400/50 hover:bg-gold-400/10 hover:text-ink-100">{choice}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {MEDIA_CARD_ICONS.map((Icon, i) => {
                      const item = [cinematicWorld, cinematicReader, cinematicCharacter][i] || {};
                      return (
                        <div key={i} className="group rounded-3xl border border-ink-700/70 bg-ink-950/70 p-5 transition-all hover:-translate-y-1 hover:border-gold-400/40 hover:shadow-gold">
                          <div className="flex items-start gap-4">
                            <div className="rounded-2xl border border-gold-400/30 bg-gold-400/10 p-3 text-gold-400 transition-transform group-hover:scale-110">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-accent-400">{item.label}</p>
                              <h3 className="mt-1 font-display text-xl text-ink-100">{item.title}</h3>
                              <p className="mt-2 text-sm leading-6 text-ink-200/70">{item.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-y border-ink-700/50 bg-ink-900/35 py-10 backdrop-blur" aria-label="Platform metrics">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
            {[
              { value: '4-level', label: statsSec.geography },
              { value: '17+', label: statsSec.tools },
              { value: '40+', label: statsSec.achievements },
              { value: '∞', label: statsSec.paths },
            ].map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-ink-700/60 bg-ink-950/50 p-5 text-center">
                <p className="font-display text-3xl text-gold-400 sm:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm uppercase tracking-[0.16em] text-ink-200/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold-400">{featuresSec.eyebrow as string}</p>
            <h2 className="mt-4 font-display text-4xl text-ink-100 sm:text-5xl">{featuresSec.title as string}</h2>
            <p className="mt-5 text-lg leading-8 text-ink-200/70">{featuresSec.subtitle as string}</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {featureItems.map((item, i) => {
              const Icon = FEATURE_ICONS[i];
              if (!Icon) return null;
              return (
                <Card key={item.title} variant="interactive" className="group border-gold-400/10 bg-ink-900/80 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <CardBody>
                    <div className="mb-5 inline-flex rounded-2xl border border-gold-400/30 bg-gold-400/10 p-3 text-gold-400 transition-transform group-hover:scale-110 group-hover:rotate-3">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-2xl text-ink-100">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-ink-200/70">{item.description}</p>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="showcase" className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold-400">{showcaseSec.eyebrow as string}</p>
            <h2 className="mt-4 font-display text-4xl text-ink-100 sm:text-5xl">{showcaseSec.title as string}</h2>
            <p className="mt-5 text-lg leading-8 text-ink-200/70">{showcaseSec.description as string}</p>
            <div className="mt-8 space-y-4">
              {showcaseList.map((line) => (
                <div key={line} className="flex items-center gap-3 rounded-2xl border border-ink-700/60 bg-ink-900/60 p-4">
                  <ChevronRight className="h-5 w-5 text-gold-400" />
                  <span className="text-ink-100">{line}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative rounded-[2rem] border border-gold-400/20 bg-ink-900/80 p-5 shadow-2xl shadow-black/30">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-gold-400/20 blur-3xl" aria-hidden="true" />
            <div className="relative grid gap-4 sm:grid-cols-2">
              {showcaseCardData.map((item, i) => {
                const Icon = SHOWCASE_ICONS[i];
                if (!Icon) return null;
                return (
                  <div key={item.label} className="rounded-3xl border border-ink-700/70 bg-ink-950/70 p-5 transition-all hover:-translate-y-1 hover:border-gold-400/50">
                    <Icon className="h-6 w-6 text-gold-400" />
                    <p className="mt-4 text-xs uppercase tracking-[0.2em] text-ink-200/50">{item.label}</p>
                    <p className="mt-2 font-serif text-lg text-ink-100">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" aria-label="Cinematic previews">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold-400">{cinematic.eyebrow as string}</p>
            <h2 className="mt-4 font-display text-4xl text-ink-100 sm:text-5xl">{cinematic.title as string}</h2>
            <p className="mt-5 text-lg leading-8 text-ink-200/70">{cinematic.description as string}</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {[
              { key: 'worldMap', src: '/landing/showcase-world-map.webp', data: cinematicWorld },
              { key: 'reader', src: '/landing/showcase-reader.webp', data: cinematicReader },
              { key: 'character', src: '/landing/showcase-character-panel.webp', data: cinematicCharacter },
              { key: 'gallery', src: '/landing/showcase-gallery.webp', data: cinematicGallery },
            ].map((item) => (
              <figure key={item.key} className="group overflow-hidden rounded-3xl border border-gold-400/15 bg-ink-900/80 shadow-2xl shadow-black/30 transition-all hover:-translate-y-1 hover:border-gold-400/50 hover:shadow-gold">
                <img src={item.src} alt={item.data.title || ''} className="aspect-[16/10] w-full object-cover transition-transform duration-slow ease-standard group-hover:scale-105" loading="lazy" />
                <figcaption className="p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-accent-400">{item.data.label}</p>
                  <h3 className="mt-1 font-display text-2xl text-ink-100">{item.data.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-200/70">{item.data.description}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="media" className="border-y border-ink-700/50 bg-ink-900/35 py-20 backdrop-blur">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold-400">{mediaGuide.eyebrow as string}</p>
              <h2 className="mt-4 font-display text-4xl text-ink-100 sm:text-5xl">{mediaGuide.title as string}</h2>
              <p className="mt-5 text-lg leading-8 text-ink-200/70">
                {mediaGuide.description as string} <code className="rounded bg-ink-950 px-2 py-1 text-gold-400">{mediaGuide.readmePath as string}</code>.
              </p>
            </div>
            <div className="rounded-[2rem] border border-gold-400/20 bg-ink-950/70 p-6">
              <div className="flex items-center gap-3 text-gold-400">
                <BookOpenText className="h-6 w-6" />
                <h3 className="font-display text-2xl">{mediaGuide.slotLabel as string}</h3>
              </div>
              <ul className="mt-6 space-y-4 text-sm leading-6 text-ink-200/75">
                <li><strong className="text-ink-100">/landing/hero-cinematic.webm</strong> — {mediaGuide.webm as string}</li>
                <li><strong className="text-ink-100">/landing/hero-cinematic.mp4</strong> — {mediaGuide.mp4 as string}</li>
                <li><strong className="text-ink-100">/landing/hero-poster.webp</strong> — {mediaGuide.poster as string}</li>
                <li><strong className="text-ink-100">/landing/showcase-*.webp</strong> — {mediaGuide.showcase as string}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold-400">{faqSec.eyebrow as string}</p>
            <h2 className="mt-4 font-display text-4xl text-ink-100">{faqSec.title as string}</h2>
          </div>
          <div className="mt-10 grid gap-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-3xl border border-ink-700/70 bg-ink-900/70 p-6 open:border-gold-400/40">
                <summary className="cursor-pointer list-none font-display text-xl text-ink-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded-xl">{faq.question}</summary>
                <p className="mt-4 leading-7 text-ink-200/70">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-gold-400/30 bg-gradient-to-br from-gold-500/20 via-ink-900 to-accent-600/20 p-8 text-center shadow-gold sm:p-12">
            <h2 className="font-display text-4xl text-ink-100 sm:text-5xl">{cta.title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-ink-200/75">{cta.description}</p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button href={primaryHref} variant="gold" size="lg" className="px-8" rightIcon={<ArrowRight className="h-5 w-5" />}>{primaryLabel}</Button>
              {!isAuthenticated && (
                <Button href="/login" variant="secondary" size="lg" className="border-gold-400/30 bg-ink-950/60 px-8 text-ink-100">{cta.login}</Button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-ink-700/50 bg-black/30 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-ink-200/60 sm:flex-row">
          <p>{footer.copyright as string}</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-gold-400">{footerLinks.login}</Link>
            <Link to="/register" className="hover:text-gold-400">{footerLinks.register}</Link>
            <Link to="/worlds" className="hover:text-gold-400">{footerLinks.worlds}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
