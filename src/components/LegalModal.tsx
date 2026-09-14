import React, { useState } from 'react';
import { X, Shield, FileText, Lock, CheckCircle, ExternalLink, Cookie } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      id="legal-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="legal-modal-dialog"
        className="relative w-full max-w-2xl max-h-[90vh] bg-[#11141c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Pravne Informacije & Uslovi</h2>
              <p className="text-xs text-zinc-400">Pravna zaštita, usklađenost sa GDPR i Google AdSense pravilima</p>
            </div>
          </div>
          <button
            id="btn-close-legal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Zatvori"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-zinc-950/40 px-4 pt-2 gap-2 shrink-0">
          <button
            id="tab-privacy-policy"
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'privacy'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Politika Privatnosti (Privacy Policy)</span>
          </button>
          <button
            id="tab-terms-of-service"
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'terms'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Uslovi Korišćenja (Terms of Service)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-zinc-300 text-xs sm:text-sm leading-relaxed">
          {activeTab === 'privacy' ? (
            <div className="space-y-5">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                Ova Politika privatnosti objašnjava kako veb sajt <strong>Pogodi Pesmu</strong> postupa sa vašim podacima, kolačićima (cookies) i pravilima o oglašavanju. Poslednje ažuriranje: {new Date().getFullYear()}.
              </div>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  1. Prikupljanje ličnih podataka
                </h3>
                <p className="text-zinc-400">
                  Naš sajt <strong>ne zahteva registraciju, unos imena, lozinke niti brojeva telefona</strong> za igranje osnovne igre. Vaš dnevni niz, statistika pogađanja i odgovori čuvaju se isključivo lokalno u vašem internet pregledaču (putem <em>HTML5 Web Storage - localStorage</em> tehnologije). Ovi podaci ne napuštaju vaš uređaj.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                  <Cookie className="w-4 h-4 text-amber-400" />
                  2. Kolačići (Cookies) i Google AdSense oglašavanje
                </h3>
                <p className="text-zinc-400">
                  Ovaj sajt može koristiti kolačiće trećih strana, uključujući <strong>Google AdSense</strong>, u svrhu prikazivanja oglasa:
                </p>
                <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
                  <li>
                    Google kao nezavisni dobavljač koristi kolačiće za posluživanje oglasa na ovom sajtu.
                  </li>
                  <li>
                    Korišćenje reklamnih kolačića (kao što je DoubleClick kolačić) omogućava Google-u i njegovim partnerima da poslužuju oglase korisnicima na osnovu njihovih poseta ovom ili drugim sajtovima na internetu.
                  </li>
                  <li>
                    Korisnici mogu u svakom trenutku isključiti personalizovano oglašavanje posetom stranici:{' '}
                    <a
                      href="https://adssettings.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 underline hover:text-emerald-300 inline-flex items-center gap-0.5"
                    >
                      Podešavanja Google oglasa <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    ili putem portala{' '}
                    <a
                      href="https://www.aboutads.info"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 underline hover:text-emerald-300 inline-flex items-center gap-0.5"
                    >
                      AboutAds.info <ExternalLink className="w-3 h-3" />
                    </a>.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-purple-400" />
                  3. Spoljni API servisi (Deezer / Apple Music)
                </h3>
                <p className="text-zinc-400">
                  Prilikom reprodukcije zvučnih isečaka, vaš internet pregledač šalje standardni HTTP zahtev zvaničnim CDN serverima muzičkih servisa (kao što su Deezer i Apple Music) radi preuzimanja promotivnog isečka od 30 sekundi. Sajt ne skladišti muzičke fajlove na svom serveru.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-blue-400" />
                  4. Prava korisnika pod GDPR & Zaštita podataka
                </h3>
                <p className="text-zinc-400">
                  U skladu sa Opštom uredbom o zaštiti podataka (GDPR), imate pravo na pristup, ispravku i brisanje svih lokalno uskladištenih podataka. Sve svoje statistike možete u bilo kom trenutku izbrisati brisanjem keša pregledača (Clear Site Data) ili klikom na dugme za resetovanje u prozoru sa statistikom.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-sm">5. Kontakt administratora</h3>
                <p className="text-zinc-400">
                  Za sva pitanja u vezi sa privatnošću ili uklanjanjem podataka, možete nas kontaktirati na zvanični kontakt:{' '}
                  <span className="text-emerald-400 font-mono">kontakt@pogodipesmu.com</span> (ili putem forme za prijavu u futeru).
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                Pristupom i korišćenjem sajta <strong>Pogodi Pesmu</strong> prihvatate sledeće Uslove korišćenja.
              </div>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-sm">1. Priroda sajta i neprofitni karakter</h3>
                <p className="text-zinc-400">
                  <strong>Pogodi Pesmu</strong> je interaktivna fan-made muzička kviz igra namenjena ljubiteljima regionalne i balkanske muzike, edukaciji, zabavi i kulturnoj promociji domaće muzičke scene. Igra se nudi besplatno svim korisnicima interneta.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-sm">2. Autorska prava i fer upotreba (Fair Use)</h3>
                <p className="text-zinc-400">
                  Sva autorska, izvođačka i srodna prava nad pesmama, muzičkim delima, tekstovima, nazivima izvođača i omotima albuma pripadaju njihovim originalnim autorima, izvođačima, kompozitorima i diskografskim kućama (Croatia Records, PGP RTS, Grand Production, IDJTunes, Jugoton i drugi) i organizacijama za kolektivno ostvarivanje prava (SOKOJ, ZAMP, PAM, OFPS).
                </p>
                <p className="text-zinc-400">
                  Kratki zvučni isečci (do najviše 30 sekundi) koriste se u skladu sa načelom <strong>fer upotrebe (Fair Use)</strong> u svrhu prepoznavanja dela, muzičkog kviza, kritike i javne promocije muzičkih izdanja. Sajt na kraju svake partije nudi direktne linkove za slušanje cele pesme na licenciranim platformama (Spotify, Apple Music, YouTube).
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-sm">3. Procedura uklanjanja sadržaja (Notice & Takedown)</h3>
                <p className="text-zinc-400">
                  Poštujemo prava svih nosilaca autorskih prava. Ukoliko ste autor, izvođač ili diskografska kuća i želite da se vaša pesma ukloni iz baze pogađanja, omogućili smo transparentnu proceduru obaveštavanja:
                </p>
                <p className="text-zinc-400">
                  Pošaljite zahtev putem dugmeta <strong>"Prijavi pesmu / DMCA"</strong> u futeru sajta ili direktnim mejlom. Svaki opravdani zahtev biće realizovan u roku od <strong>24 sata</strong> trajnim isključivanjem numere iz kataloga i rasporeda.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-sm">4. Ograničenje odgovornosti</h3>
                <p className="text-zinc-400">
                  Aplikacija se pruža "u viđenom stanju" (as-is). Ne garantujemo neprekidnu dostupnost spoljnih audio servisa trećih lica. Autori sajta ne snose odgovornost za eventualne prekide u radu mreže ili greške u metapodacima pesama.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-sm">5. Izmene uslova</h3>
                <p className="text-zinc-400">
                  Zadržavamo pravo da povremeno izmenimo ove Uslove radi usklađivanja sa zakonskim normama ili izmenama u servisima trećih lica.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-zinc-950/60 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-zinc-500">
            Sajt posvećen promociji muzike Balkana
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors"
          >
            Razumem i zatvori
          </button>
        </div>
      </div>
    </div>
  );
};
