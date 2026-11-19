const GROUPS = [
  {
    title: 'Working in the browser',
    items: [
      'Spacebar timer with a configurable hold, inspection, +2, and DNF',
      'performance.now() timing painted on animation frames',
      'Typing, mouse, touch, multi-phase, and last-layer timer modes',
      'WCA-style Ao5 and Ao12, means, distribution, and time-to-beat',
      'Sessions: create, rename, delete, clear, split, and merge',
      'Official random-state scrambles through cubing.js, with a random-move fallback',
      'Seeded random-move scrambles for a shared seed',
      '2D scramble images through TwistyPlayer',
      '3×3 cross, block, Roux, EOLine, Petrus, and F2L searches',
      'Square-1 inverse, which restores shape and pieces and is not a shortest search',
      'Full Pyraminx and Skewb solutions through cubing.js',
      'Interactive 3×3 with real sticker state, phase splits, and TPS',
      'PLL, OLL, and training scrambles, with the limits noted in Settings',
      'Import, export, CSV, and local IndexedDB backups',
      'Configurable shortcuts and timer gestures',
    ],
  },
  {
    title: 'Needs hardware or a capable browser',
    items: [
      'Stackmat audio: microphone access, then a valid checksum packet. The app does not claim a timer is connected before that.',
      'Bluetooth smart cubes and Gan timers: Chrome or Edge, localhost or HTTPS, and a cube cubing.js recognizes.',
      'Battery level only when the cube exposes it.',
      'Smart-cube reconstruction assumes the cube was solved when tracking started.',
    ],
  },
  {
    title: 'Not claimed',
    items: [
      'No account, server, or cloud backup.',
      'No shortest Square-1 solver and no Roux-preserving CMLL library.',
      'F2L training is an FR-slot drill, not 41 named cases.',
      'X-cross, full F2L, Petrus, and ZZF2L can stop early and will say when they do.',
      'There is no 4×4–7×7, Megaminx, or Clock solver. Those events still get scrambles and a drawing.',
      'Navigation is translated. The rest of the interface is English.',
    ],
  },
];

export function FeaturesPage() {
  return (
    <div className="scroll-y min-h-0 flex-1 space-y-4 p-4 md:p-8">
      <h2 className="text-xl font-semibold">What Cubic actually does</h2>
      <p className="max-w-2xl text-sm text-[var(--muted)]">This list matches the build. A control that cannot do the real work is described here instead of pretending.</p>
      {GROUPS.map((group) => (
        <section key={group.title} className="card p-4">
          <h3 className="mb-3 font-medium">{group.title}</h3>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            {group.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      ))}
    </div>
  );
}
