import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { getWaitlistCount, joinWaitlist } from './lib/supabase';

/* ---------------------------------- data ---------------------------------- */

const FEATURES: { icon: ReactNode; title: string; body: string; tag: string }[] = [
  {
    tag: 'SCAN',
    title: 'Scan real cars into your garage',
    body: 'Point your camera at any car on the street. The app reads it, classifies it — Muscle, Drift, EV, Offroad, Luxury, JDM — and drops a card in your garage with your photo on it.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M4 8V6a2 2 0 0 1 2-2h2" />
        <path d="M16 4h2a2 2 0 0 1 2 2v2" />
        <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
        <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 5.2V3.5M18.8 12h1.7M12 18.8v1.7M5.2 12H3.5" />
      </svg>
    ),
  },
  {
    tag: 'BATTLE',
    title: 'Battle your friends, turn by turn',
    body: 'Challenge friends to head-to-head races with your tuned cars. Type matchups, equipped moves, and a stat-driven damage formula decide who takes the podium.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
      </svg>
    ),
  },
  {
    tag: 'DAILY',
    title: 'Daily free rewards that stack',
    body: 'Check in every day to build a streak. The longer you keep it alive, the bigger the payouts — fuel, credits, and rare drops keep the garage growing.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 3l1.9 4.8L19 9.7l-4.2 2.4L12 17l-2.8-4.9L5 9.7l5.1-1.9L12 3Z" />
        <path d="M5 19h14" />
      </svg>
    ),
  },
  {
    tag: 'TRADE',
    title: 'Trade cars with your crew',
    body: 'Got a duplicate drift machine? Swap it for the offroader you have been chasing. Offer cars to friends and negotiate your way to the perfect lineup.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M4 9h13l-3.5-3.5M20 15H7l3.5 3.5" />
      </svg>
    ),
  },
];

const CLASSES: { name: string; color: string; blurb: string; cars: string[] }[] = [
  { name: 'MUSCLE', color: '#ff4d00', blurb: 'Raw V8 power, big nitro, heavy hits.', cars: ['Challenger Hellcat', 'Camaro ZL1', 'Charger Daytona'] },
  { name: 'DRIFT', color: '#37f5c8', blurb: 'Grip, angle, and style points for days.', cars: ['RX-7 FD', 'Silvia S15', 'Chaser JZX100'] },
  { name: 'EV', color: '#4dd2ff', blurb: 'Instant torque. No exhaust, no mercy.', cars: ['Model S Plaid', 'Taycan Turbo S', 'Ioniq 5 N'] },
  { name: 'OFFROAD', color: '#c8a94d', blurb: 'Tanks that shrug off anything you throw.', cars: ['Bronco Raptor', 'Land Cruiser', 'Defender 110'] },
  { name: 'LUXURY', color: '#b08aff', blurb: 'Durable, smooth, quietly unstoppable.', cars: ['Ghost', 'Continental GT', 'S-Class'] },
  { name: 'JDM', color: '#ff5cc8', blurb: 'Balanced Japanese weaponry. Legend status.', cars: ['GT-R R34', 'Supra Turbo', 'NSX Type S'] },
];

const STEPS = [
  {
    n: '01',
    title: 'Point & scan',
    body: 'Aim your camera at any real car — parked, driving, whatever. The vision AI reads it and pins a class to it.',
  },
  {
    n: '02',
    title: 'Collect & tune',
    body: 'Every scan adds a card to your garage with randomized stats in range and your photo on it. Equip moves, stack your lineup.',
  },
  {
    n: '03',
    title: 'Battle & trade',
    body: 'Challenge friends turn-by-turn, or trade cars until your garage is untouchable. The leaderboard never forgets.',
  },
];

const FAQS = [
  {
    q: 'When does Shift3r launch?',
    a: 'We are in active development and working toward launch. Join the waitlist and you will be first to know — one email, the moment the lights go green.',
  },
  {
    q: 'Which phones are supported?',
    a: 'Shift3r is built as a mobile-first PWA, so any modern phone browser works — iPhone or Android. No app store download required.',
  },
  {
    q: 'Is it really free?',
    a: 'Yes. Scanning cars, building your garage, and battling friends are free. There will be optional cosmetics down the road, but the core game is free to play.',
  },
  {
    q: 'Does it actually recognize real cars?',
    a: 'It uses a vision model to classify the body style and character of whatever you point it at — muscle, drift, EV, offroad, luxury, or JDM. A photo of a Mustang will not give you a luxury sedan.',
  },
];

const TICKER_CARS = [
  'CHALLENGER HELLCAT', 'RX-7 FD', 'TAYCAN TURBO S', 'BRONCO RAPTOR', 'GHOST',
  'GT-R R34', 'CAMARO ZL1', 'SILVIA S15', 'MODEL S PLAID', 'LAND CRUISER',
  'CONTINENTAL GT', 'SUPRA TURBO', 'CHARGER DAYTONA', 'CHASER JZX100', 'DEFENDER 110',
];

/* ------------------------------- hooks/utils ------------------------------ */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);
  return ref;
}

function useCountdown(target: Date) {
  const [left, setLeft] = useState(() => Math.max(0, target.getTime() - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, target.getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);
  const s = Math.floor(left / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins: Math.floor((s % 3600) / 60),
    secs: s % 60,
  };
}

/* ---------------------------------- hero ---------------------------------- */

function CarSilhouette() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="absolute inset-x-6 -bottom-4 top-1/3 rounded-[50%] bg-nitro/25 blur-3xl" />

      <div className="relative rounded-2xl border border-white/10 bg-carbon/80 p-5 shadow-[0_30px_80px_-20px_rgba(255,77,0,0.25)] backdrop-blur">
        <span className="absolute left-2 top-2 h-5 w-5 border-l-2 border-t-2 border-nitro" />
        <span className="absolute right-2 top-2 h-5 w-5 border-r-2 border-t-2 border-nitro" />
        <span className="absolute bottom-2 left-2 h-5 w-5 border-b-2 border-l-2 border-nitro" />
        <span className="absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2 border-nitro" />

        <span className="absolute left-1/2 top-2 h-2.5 w-px -translate-x-1/2 bg-nitro" />
        <span className="absolute left-1/2 bottom-2 h-2.5 w-px -translate-x-1/2 bg-nitro" />

        <div className="overflow-hidden rounded-lg bg-gradient-to-b from-[#10101a] to-[#0a0a12]">
          <svg viewBox="0 0 360 240" className="w-full">
            <defs>
              <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3a3a4d" />
                <stop offset="100%" stopColor="#17171f" />
              </linearGradient>
              <linearGradient id="carGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff4d00" stopOpacity="0" />
                <stop offset="55%" stopColor="#ff4d00" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ff4d00" stopOpacity="0" />
              </linearGradient>
            </defs>

            <g stroke="#ff4d00" strokeOpacity="0.5" strokeWidth="1.5">
              <line x1="0" y1="60" x2="60" y2="60" className="animate-speedline" />
              <line x1="0" y1="120" x2="90" y2="120" className="animate-speedline" style={{ animationDelay: '0.3s' }} />
              <line x1="0" y1="180" x2="45" y2="180" className="animate-speedline" style={{ animationDelay: '0.6s' }} />
            </g>

            <line x1="20" y1="195" x2="340" y2="195" stroke="#2c2c3a" strokeWidth="2" />

            <g>
              <path
                d="M40 170 L78 148 L118 120 Q128 112 140 112 L210 112 Q228 112 236 126 L252 146 Q258 154 268 156 L312 162 Q322 164 326 172 L330 180 L42 180 Z"
                fill="url(#carBody)"
                stroke="#4a4a5e"
                strokeWidth="2"
              />
              <path
                d="M150 132 Q164 122 196 122 L224 122 Q236 122 242 132 L224 148 L150 148 Z"
                fill="#0a0a12"
                stroke="#34343f"
                strokeWidth="1.5"
              />
              <path d="M56 176 L324 176 L326 180 L52 180 Z" fill="url(#carGlow)" />
              <circle cx="112" cy="184" r="22" fill="#0a0a12" stroke="#3d3d4d" strokeWidth="5" />
              <circle cx="112" cy="184" r="8" fill="#ff4d00" />
              <circle cx="268" cy="184" r="22" fill="#0a0a12" stroke="#3d3d4d" strokeWidth="5" />
              <circle cx="268" cy="184" r="8" fill="#ff4d00" />
              <path d="M40 168 L64 160 L64 170 L44 176 Z" fill="#ffb27a" />
            </g>

            <rect x="14" y="0" width="332" height="2" fill="url(#carGlow)" className="animate-scanline" />
          </svg>

          <div className="flex items-center justify-between border-t border-white/5 px-4 py-2 font-mono text-[10px] tracking-widest text-fog">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-nitro animate-pulse-dot" />
              SCANNING
            </span>
            <span>CLASS: <span className="text-volt">JDM</span></span>
            <span className="text-nitro">▮ REC</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- form ---------------------------------- */

type FormState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; email: string; position: number };

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<FormState>({ status: 'idle' });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setState({ status: 'error', message: 'That email does not look right — double-check it.' });
      return;
    }
    setState({ status: 'loading' });
    try {
      const position = await joinWaitlist(trimmed);
      setState({ status: 'success', email: trimmed, position });
    } catch {
      setState({
        status: 'error',
        message: 'Could not join right now. Try again in a moment.',
      });
    }
  }

  if (state.status === 'success') {
    return (
      <div className="animate-rise rounded-2xl border border-volt/30 bg-volt/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-volt text-volt">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
            <path d="M4 12.5 9.5 18 20 6.5" />
          </svg>
        </div>
        <p className="font-display text-2xl tracking-tight">
          YOU'RE ON THE GRID
        </p>
        <p className="mt-2 text-sm text-fog">
          We'll hit up <span className="text-bone">{state.email}</span> the moment the lights go green.
        </p>
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-fog">Your waitlist position</p>
          <p className="mt-1 font-display text-6xl text-nitro">
            #{state.position.toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="animate-rise" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@fastmail.com"
          className="w-full flex-1 rounded-xl border border-white/10 bg-carbon px-4 py-3.5 text-sm text-bone placeholder-fog/60 outline-none transition focus:border-nitro/60 focus:ring-2 focus:ring-nitro/30"
        />
        <button
          type="submit"
          disabled={state.status === 'loading'}
          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-nitro px-7 py-3.5 font-display text-sm tracking-wide text-white transition hover:bg-nitro-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.status === 'loading' ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              JOINING…
            </>
          ) : (
            <>
              GET EARLY ACCESS
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </>
          )}
        </button>
      </div>
      {state.status === 'error' && (
        <p className="mt-3 text-sm text-[#ff6b6b]">{state.message}</p>
      )}
      <p className="mt-3 text-xs text-fog/70">
        No spam. One email when the app drops. Unsubscribe anytime.
      </p>
    </form>
  );
}

/* ------------------------------- countdown -------------------------------- */

const LAUNCH_DATE = new Date('2026-11-01T00:00:00');

function Countdown() {
  const { days, hours, mins, secs } = useCountdown(LAUNCH_DATE);
  const isPast = days === 0 && hours === 0 && mins === 0 && secs === 0 && Date.now() > LAUNCH_DATE.getTime();
  if (isPast) {
    return (
      <div className="rounded-xl border border-volt/30 bg-volt/5 px-6 py-4 text-center">
        <p className="font-display text-lg text-volt">LAUNCH IS LIVE</p>
        <p className="mt-1 text-xs text-fog">Get in now — the grid is filling up.</p>
      </div>
    );
  }

  const cells = [
    { v: days, l: 'DAYS' },
    { v: hours, l: 'HRS' },
    { v: mins, l: 'MIN' },
    { v: secs, l: 'SEC' },
  ];
  return (
    <div className="grid grid-cols-4 gap-3">
      {cells.map((c) => (
        <div key={c.l} className="rounded-xl border border-white/10 bg-carbon px-2 py-4 text-center">
          <p className="font-display text-3xl tabular-nums text-bone sm:text-4xl">
            {String(c.v).padStart(2, '0')}
          </p>
          <p className="mt-1 font-mono text-[10px] tracking-[0.25em] text-fog">{c.l}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------- app ----------------------------------- */

export default function App() {
  const revealRef = useReveal();
  const [count, setCount] = useState<number | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  useEffect(() => {
    getWaitlistCount().then(setCount);
  }, []);

  return (
    <div ref={revealRef} className="relative min-h-screen overflow-x-clip">
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-nitro/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[420px] rounded-full bg-volt/5 blur-[110px]" />
        <svg className="absolute inset-x-0 top-0 h-full w-full opacity-[0.04]" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <pattern id="stripes" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="7" height="14" fill="#ffffff" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#stripes)" />
        </svg>
      </div>

      {/* nav */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-night/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-nitro font-display text-sm text-white">S3</span>
            <span className="font-display text-lg tracking-tight">SHIFT<span className="text-nitro">3</span>R</span>
          </a>
          <nav className="hidden items-center gap-7 text-xs font-semibold tracking-widest text-fog md:flex">
            <a href="#how" className="transition hover:text-bone">HOW IT WORKS</a>
            <a href="#classes" className="transition hover:text-bone">CAR CLASSES</a>
            <a href="#faq" className="transition hover:text-bone">FAQ</a>
          </nav>
          <a
            href="#waitlist"
            className="rounded-lg bg-nitro px-4 py-2 text-xs font-semibold tracking-widest text-white transition hover:bg-nitro-soft"
          >
            JOIN
          </a>
        </div>
      </header>

      <main id="top" className="relative z-10 mx-auto w-full max-w-6xl px-6">
        {/* hero */}
        <section className="grid items-center gap-14 pb-20 pt-10 lg:grid-cols-2 lg:gap-10 lg:pt-20">
          <div className="animate-rise">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-carbon px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-fog">
              <span className="h-1.5 w-1.5 rounded-full bg-nitro animate-pulse-dot" />
              Now in development
            </p>
            <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              SHIFT<span className="text-nitro">3</span>R
            </h1>
            <p className="mt-5 max-w-md text-lg text-fog">
              Point your camera at real cars. Collect them. Build the fastest garage on the street — then take your friends down.
            </p>
            <div id="waitlist" className="mt-9 max-w-md scroll-mt-28">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-fog">
                {count !== null
                  ? `${count.toLocaleString()} drivers already on the grid`
                  : 'Reserve your spot in the garage'}
              </p>
              <WaitlistForm />
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-fog/80">
              <span className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-nitro"><path d="M4 9h13l-3.5-3.5M20 15H7l3.5 3.5" /></svg>
                Trade with friends
              </span>
              <span className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-volt"><path d="M12 3l1.9 4.8L19 9.7l-4.2 2.4L12 17l-2.8-4.9L5 9.7l5.1-1.9L12 3Z" /></svg>
                Daily streak rewards
              </span>
              <span className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-bone"><circle cx="12" cy="12" r="3.2" /><path d="M12 5.2V3.5M18.8 12h1.7M12 18.8v1.7M5.2 12H3.5" /></svg>
                Free to play
              </span>
            </div>
          </div>

          <div className="animate-rise" style={{ animationDelay: '0.15s' }}>
            <CarSilhouette />
            <div className="mx-auto mt-6 max-w-md">
              <Countdown />
            </div>
          </div>
        </section>

        {/* ticker */}
        <div className="relative overflow-hidden border-y border-white/5 py-3" aria-hidden="true">
          <div className="flex w-max animate-ticker gap-12 whitespace-nowrap font-mono text-xs tracking-[0.3em] text-fog/50">
            {[...TICKER_CARS, ...TICKER_CARS].map((c, i) => (
              <span key={i} className="flex items-center gap-12">
                {c} <span className="text-nitro">✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* features */}
        <section className="pb-24 pt-24">
          <div className="mb-10 flex items-end justify-between gap-6 reveal">
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
              BUILT FOR THE <span className="text-nitro">STREET</span>
            </h2>
            <span className="hidden font-mono text-xs tracking-widest text-fog sm:block">04 MODULES / ONLINE</span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <article
                key={f.title}
                className="group relative reveal overflow-hidden rounded-2xl border border-white/10 bg-panel p-6 transition duration-300 hover:-translate-y-1 hover:border-nitro/50 hover:shadow-[0_20px_60px_-20px_rgba(255,77,0,0.35)]"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className="absolute right-4 top-4 font-mono text-[10px] tracking-widest text-fog/50">
                  0{i + 1}
                </span>
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-carbon text-nitro transition group-hover:border-nitro/50 group-hover:text-volt">
                  {f.icon}
                </div>
                <p className="mb-2 font-mono text-[10px] tracking-[0.3em] text-nitro">{f.tag}</p>
                <h3 className="mb-2 font-display text-base leading-snug">{f.title}</h3>
                <p className="text-sm leading-relaxed text-fog">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* how it works */}
        <section id="how" className="scroll-mt-24 pb-24">
          <div className="mb-12 reveal">
            <p className="mb-3 font-mono text-[10px] tracking-[0.3em] text-nitro">THE FORMULA</p>
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
              THREE GEARS TO <span className="text-nitro">GLORY</span>
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.n} className="group reveal relative overflow-hidden rounded-2xl border border-white/10 bg-carbon p-7" style={{ transitionDelay: `${i * 80}ms` }}>
                <span className="absolute -right-3 -top-6 font-display text-[88px] leading-none text-white/5">{s.n}</span>
                <span className="font-mono text-xs tracking-widest text-nitro">GEAR {s.n}</span>
                <h3 className="mt-3 font-display text-xl">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-fog">{s.body}</p>
                <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-0 rounded-full bg-nitro transition-all duration-700 group-hover:w-full" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* car classes */}
        <section id="classes" className="scroll-mt-24 pb-24">
          <div className="mb-12 reveal">
            <p className="mb-3 font-mono text-[10px] tracking-[0.3em] text-nitro">THE ROSTER</p>
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
              SIX CLASSES. <span className="text-nitro">36 CARS.</span> ZERO MERCY.
            </h2>
            <p className="mt-3 max-w-lg text-sm text-fog">
              Every scan lands in one of six classes, each with its own stat archetype and type advantages. Collect them all.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CLASSES.map((c, i) => (
              <article
                key={c.name}
                className="group reveal relative overflow-hidden rounded-2xl border border-white/10 bg-panel p-6 transition duration-300 hover:-translate-y-1"
                style={{ transitionDelay: `${(i % 3) * 70}ms` }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-0.5"
                  style={{ background: `linear-gradient(90deg, transparent, ${c.color}, transparent)` }}
                />
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl tracking-wide" style={{ color: c.color }}>{c.name}</h3>
                  <span className="font-mono text-[10px] tracking-widest text-fog/60">0{i + 1}</span>
                </div>
                <p className="mt-2 text-sm text-fog">{c.blurb}</p>
                <ul className="mt-5 space-y-2 border-t border-white/5 pt-5">
                  {c.cars.map((car) => (
                    <li key={car} className="flex items-center gap-2.5 text-sm text-bone/90">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                      {car}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-24 pb-24">
          <div className="mb-12 reveal">
            <p className="mb-3 font-mono text-[10px] tracking-[0.3em] text-nitro">PIT WALL</p>
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
              QUICK <span className="text-nitro">QUESTIONS</span>
            </h2>
          </div>
          <div className="mx-auto max-w-2xl space-y-3">
            {FAQS.map((f, i) => {
              const open = faqOpen === i;
              return (
                <div key={f.q} className="reveal overflow-hidden rounded-xl border border-white/10 bg-carbon" style={{ transitionDelay: `${i * 50}ms` }}>
                  <button
                    onClick={() => setFaqOpen(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                    aria-expanded={open}
                  >
                    <span className="font-semibold text-bone">{f.q}</span>
                    <span className={`font-mono text-nitro transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm leading-relaxed text-fog">{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* final CTA */}
        <section className="reveal relative mb-24 overflow-hidden rounded-3xl border border-nitro/30 bg-gradient-to-br from-carbon via-panel to-carbon p-10 text-center sm:p-14">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-nitro/20 blur-3xl" />
            <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-volt/10 blur-3xl" />
          </div>
          <div className="relative">
            <p className="font-mono text-xs tracking-[0.3em] text-nitro animate-flicker">FINAL LAP APPROACHING</p>
            <h2 className="mx-auto mt-4 max-w-xl font-display text-3xl leading-tight tracking-tight sm:text-5xl">
              YOUR GARAGE IS <span className="text-nitro">WAITING</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-fog">
              Launch is coming. Get on the grid now and be first through the gates when we drop.
            </p>
            <div className="mx-auto mt-8 max-w-md">
              <WaitlistForm />
            </div>
          </div>
        </section>
      </main>

      {/* footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-fog/70 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-nitro font-display text-[9px] text-white">S3</span>
            <span>© {new Date().getFullYear()} Shift3r</span>
          </div>
          <p className="font-mono tracking-widest">SCAN · COLLECT · BATTLE · TRADE</p>
        </div>
      </footer>
    </div>
  );
}
