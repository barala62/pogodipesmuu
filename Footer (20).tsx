import React from 'react';
import { 
  HelpCircle, 
  BarChart2, 
  Layers, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Heart, 
  Music2, 
  ShieldCheck, 
  Lock, 
  Dumbbell, 
  FileText, 
  ShieldAlert, 
  Cookie, 
  Mail 
} from 'lucide-react';

interface FooterProps {
  onOpenHelp: () => void;
  onOpenStats: () => void;
  onOpenCategory: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenTakedown?: () => void;
  onOpenCookieSettings?: () => void;
  onAdminTrigger?: () => void;
  onPracticeTrigger?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenHelp,
  onOpenStats,
  onOpenCategory,
  onOpenPrivacy,
  onOpenTerms,
  onOpenTakedown,
  onOpenCookieSettings,
  onAdminTrigger,
  onPracticeTrigger,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="app-footer" className="w-full mt-auto border-t border-white/10 bg-[#0a0d12]/90 backdrop-blur-md text-zinc-400 py-8 px-4 text-xs">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top: Logo & Fast Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Music2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Pogodi Pesmu</div>
              <div className="text-[11px] text-emerald-400/90 font-medium">Balkanski muzički izazov</div>
            </div>
          </div>

          {/* Quick navigation pill links */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              onClick={onOpenHelp}
              className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pravila</span>
            </button>

            <button
              onClick={onOpenStats}
              className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Statistika</span>
            </button>

            <button
              onClick={onOpenCategory}
              className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Režimi</span>
            </button>
          </div>
        </div>

        {/* Middle: Device compatibility & Responsiveness Info */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <div className="text-zinc-200 font-semibold flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Dostupno na svim uređajima (Mobilni, Tablet i Desktop)</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Aplikacija je potpuno responzivna i prilagođena za ekrane na dodir svih veličina. Može se dodati na početni ekran telefona (PWA / Add to Home Screen).
            </p>
          </div>

          <div className="flex items-center gap-2 text-zinc-400 shrink-0 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            <Smartphone className="w-4 h-4 text-emerald-400" title="Telefon" />
            <Tablet className="w-4 h-4 text-emerald-400" title="Tablet" />
            <Laptop className="w-4 h-4 text-emerald-400" title="Računar" />
            <span className="text-[10px] font-medium text-zinc-300 ml-1">Svi uređaji</span>
          </div>
        </div>

        {/* Comprehensive Legal Disclaimer & Fair Use Notice */}
        <div className="space-y-3 text-[11px] text-zinc-500 text-center sm:text-left leading-relaxed">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="font-semibold text-zinc-400 flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pravna napomena o autorskim pravima i promotivnom karakteru (Fair Use)</span>
            </div>
            <p>
              Ova web aplikacija je neprofitni promotivno-zabavni fan projekat posvećen popularizaciji muzike sa prostora bivše Jugoslavije. Svi zvučni isečci (do 30 sekundi) strimuju se direktno i u realnom vremenu sa zvaničnih promotivnih CDN servera nosilaca licenci (Deezer i Apple Music API). Sajt <strong>ne hostuje, ne skladišti, ne konvertuje i ne distribuira</strong> muzičke fajlove na svom serveru.
            </p>
            <p>
              Sva autorska, izvođačka i srodna prava nad pesmama, tekstovima, nazivima i omotima pripadaju njihovim autorima, kompozitorima, izvođačima i diskografskim kućama (Croatia Records, PGP RTS, Grand Production, IDJTunes, Jugoton i drugi) i organizacijama za zaštitu prava (SOKOJ, ZAMP, PAM, OFPS). Nakon svake igre pružamo direktne linkove za slušanje cele pesme na licenciranim platformama (Spotify, Apple Music, YouTube).
            </p>
          </div>

          {/* Legal Navigation Links: Privacy Policy, Terms, Takedown, Cookie Settings */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 pt-1 text-zinc-400">
            {onOpenPrivacy && (
              <button
                id="footer-link-privacy"
                onClick={onOpenPrivacy}
                className="hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Politika privatnosti</span>
              </button>
            )}

            {onOpenTerms && (
              <button
                id="footer-link-terms"
                onClick={onOpenTerms}
                className="hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <FileText className="w-3 h-3 text-emerald-400" />
                <span>Uslovi korišćenja</span>
              </button>
            )}

            {onOpenTakedown && (
              <button
                id="footer-link-takedown"
                onClick={onOpenTakedown}
                className="hover:text-red-400 transition-colors flex items-center gap-1 text-red-400/90 font-medium"
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Prijavi pesmu / DMCA Takedown</span>
              </button>
            )}

            {onOpenCookieSettings && (
              <button
                id="footer-link-cookies"
                onClick={onOpenCookieSettings}
                className="hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                <Cookie className="w-3 h-3 text-amber-400" />
                <span>Kolačići (GDPR)</span>
              </button>
            )}

            <a
              href="mailto:pogodipesmu.kontakt@gmail.com"
              className="hover:text-zinc-200 transition-colors flex items-center gap-1 text-zinc-500"
            >
              <Mail className="w-3 h-3" />
              <span>pogodipesmu.kontakt@gmail.com</span>
            </a>
          </div>

          {/* Bottom Copyright bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-white/5 text-zinc-500">
            <p>© {currentYear} Pogodi Pesmu. Sva prava zadržana od strane nosilaca autorskih prava.</p>
            <div className="flex items-center gap-2">
              <span>Balkanski hitovi svakog dana u ponoć</span>
              {onPracticeTrigger && (
                <button
                  onClick={onPracticeTrigger}
                  className="text-zinc-600 hover:text-purple-400 transition-colors p-1 rounded"
                  title="Skriveni Trening režim (/trening)"
                  aria-label="Trening režim"
                >
                  <Dumbbell className="w-3 h-3 opacity-40 hover:opacity-100" />
                </button>
              )}
              {onAdminTrigger && (
                <button
                  onClick={onAdminTrigger}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 rounded"
                  title="Urednički pristup (/admin)"
                  aria-label="Admin panel"
                >
                  <Lock className="w-3 h-3 opacity-40 hover:opacity-100" />
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

