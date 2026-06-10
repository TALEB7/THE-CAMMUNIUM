import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0d0e12]">

      {/* LEFT — Form panel — white in light, dark in dark */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 relative z-10 bg-white dark:bg-transparent">

        {/* Top bar gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#C8102E] via-red-400 to-transparent" />

        {/* Logo */}
        <Link href="/" className="absolute top-6 left-8 flex items-center gap-2.5 group">
          <img src="/communium_logo.png" alt="The Communium" width={32} height={32} className="rounded" />
          <span className="text-sm font-extrabold text-[#C8102E] font-heading tracking-widest uppercase opacity-80 group-hover:opacity-100 transition">
            The Communium
          </span>
        </Link>

        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </div>

      {/* RIGHT — Atmospheric dark panel (always dark, desktop only) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" aria-hidden="true">
        {/* Base always dark */}
        <div className="absolute inset-0 bg-[#0a0b0f]" />

        {/* Aurora blobs */}
        <div className="absolute -top-40 -left-20 w-[700px] h-[700px] rounded-full bg-purple-600/25 blur-[130px]" />
        <div className="absolute -bottom-40 right-0 w-[600px] h-[600px] rounded-full bg-fuchsia-600/20 blur-[110px]" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] rounded-full bg-violet-800/15 blur-[90px]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-600 via-fuchsia-500 to-violet-600" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-16 text-center gap-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[11px] font-bold tracking-widest uppercase mb-8">
              ✦ Plateforme B2B · B2C · Maroc
            </div>
            <h2 className="text-[2.6rem] font-extrabold text-white leading-[1.15] mb-5">
              Là où les entrepreneurs{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400">
                grandissent ensemble
              </span>
            </h2>
            <p className="text-white/40 text-[15px] leading-relaxed max-w-xs mx-auto">
              Réseau professionnel, marketplace intelligente, mentorat et enchères — tout dans un seul espace.
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-3 w-full max-w-[280px]">
            {['Marketplace avec IA sémantique', 'Enchères en temps réel', 'Matching mentor · mentoré', 'Réunions WebRTC intégrées'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-left">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 shrink-0" />
                <span className="text-white/50 text-[13px]">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
