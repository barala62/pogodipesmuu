import React, { useState, useEffect } from 'react';
import { Cookie, Shield, Check, X } from 'lucide-react';

interface CookieConsentBannerProps {
  onOpenPrivacyPolicy: () => void;
}

const COOKIE_CONSENT_KEY = 'pogodi_cookie_consent';

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onOpenPrivacyPolicy,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show after a tiny delay for smooth entry
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'all');
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'essential');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      id="cookie-consent-banner"
      className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 animate-in slide-in-from-bottom duration-300 pointer-events-none"
    >
      <div className="max-w-3xl mx-auto bg-[#0d1017]/95 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md pointer-events-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="text-white font-bold text-xs sm:text-sm flex items-center gap-2">
              <span>Privatnost i kolačići (Cookies)</span>
              <span className="text-[10px] bg-white/10 text-zinc-400 px-2 py-0.5 rounded-full font-medium">
                GDPR & AdSense
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-xl">
              Koristimo lokalno skladište (Local Storage) za čuvanje vašeg napretka i rezultata u igri, kao i kolačiće za osnovno funkcionisanje sajta i oglašavanje (Google AdSense). Možete prihvatiti sve ili izabrati samo neophodne kolačiće.{' '}
              <button
                onClick={onOpenPrivacyPolicy}
                className="text-emerald-400 hover:text-emerald-300 underline font-medium"
              >
                Saznaj više u Politici privatnosti
              </button>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
          <button
            id="btn-cookie-essential"
            onClick={handleAcceptEssential}
            className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition-colors border border-white/10 text-center"
          >
            Samo neophodni
          </button>
          <button
            id="btn-cookie-accept-all"
            onClick={handleAcceptAll}
            className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 text-center flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Prihvati sve</span>
          </button>
        </div>
      </div>
    </div>
  );
};
