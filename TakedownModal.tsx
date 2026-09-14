import React, { useState } from 'react';
import { X, ShieldAlert, Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface TakedownModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledSongTitle?: string;
  prefilledArtist?: string;
}

export const TakedownModal: React.FC<TakedownModalProps> = ({
  isOpen,
  onClose,
  prefilledSongTitle = '',
  prefilledArtist = '',
}) => {
  const [claimantName, setClaimantName] = useState('');
  const [email, setEmail] = useState('');
  const [songInfo, setSongInfo] = useState(
    prefilledSongTitle && prefilledArtist ? `${prefilledArtist} - ${prefilledSongTitle}` : ''
  );
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultSuccess, setResultSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !songInfo.trim()) {
      setError('Molimo unesite Vaš email i naziv pesme/izvođača.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/takedown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimantName: claimantName.trim(),
          email: email.trim(),
          songInfo: songInfo.trim(),
          proofUrl: proofUrl.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResultSuccess(
          `Zahtev #${data.ticketId} je uspešno zaprimljen! Pesma će biti proverena i uklonjena iz rotacije u roku od najviše 24 sata. Potvrda je poslata na ${email}.`
        );
      } else {
        setError(data.error || 'Došlo je do greške pri slanju. Pokušajte ponovo ili pišite na pogodipesmu.kontakt@gmail.com.');
      }
    } catch {
      setError('Greška u komunikaciji sa serverom. Molimo pošaljite direktan mejl na: pogodipesmu.kontakt@gmail.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setResultSuccess(null);
    setError(null);
    onClose();
  };

  return (
    <div
      id="takedown-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleResetAndClose}
    >
      <div
        id="takedown-modal-dialog"
        className="relative w-full max-w-lg bg-[#11141c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Zahtev za uklanjanje (DMCA / Takedown)</h2>
              <p className="text-xs text-zinc-400">Zaštita autorskih i srodnih prava nosilaca</p>
            </div>
          </div>
          <button
            id="btn-close-takedown"
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Zatvori"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-zinc-300">
          {resultSuccess ? (
            <div className="space-y-4 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Zahtev je uspešno zabeležen</h3>
              <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm max-w-md mx-auto">
                {resultSuccess}
              </p>
              <div className="pt-2">
                <button
                  onClick={handleResetAndClose}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
                >
                  U redu, zatvori
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Obaveštenje za autore i izdavačke kuće</span>
                </div>
                <p className="text-zinc-400">
                  Ukoliko ste autor, izvođač ili diskografska kuća i želite da se određena numera isključi iz igre, popunite donju formu. Sporni sadržaj uklanjamo u roku od <strong>24 sata</strong>.
                </p>
              </div>

              {error && (
                <div className="p-2.5 bg-red-500/15 border border-red-500/30 rounded-lg text-xs text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Vaše ime / Naziv organizacije ili izdavača:
                </label>
                <input
                  type="text"
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  placeholder="npr. Petar Petrović / Croatia Records / Grand"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Vaša kontakt email adresa <span className="text-red-400">*</span>:
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="npr. prava@izdavac.com"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Pesma i izvođač za uklanjanje <span className="text-red-400">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={songInfo}
                  onChange={(e) => setSongInfo(e.target.value)}
                  placeholder="npr. Zdravko Čolić - Ti si mi u krvi"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Link ka zvaničnom izdanju / Dokaz nosioca prava (opciono):
                </label>
                <input
                  type="text"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="npr. link ka zvaničnom YouTube kanalu ili katalogu"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Dodatna napomena:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Bilo kakve dodatne instrukcije..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <a
                  href={`mailto:pogodipesmu.kontakt@gmail.com?subject=Takedown%20Zahtev&body=${encodeURIComponent(
                    `Zahtev za uklanjanje pesme:\n${songInfo}\n\nPodnosilac: ${claimantName}\nEmail: ${email}`
                  )}`}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ili pošalji direktan mejl</span>
                </a>

                <button
                  id="btn-submit-takedown"
                  type="submit"
                  disabled={isSubmitting || !email.trim() || !songInfo.trim()}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-red-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Slanje...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Pošalji zahtev</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
