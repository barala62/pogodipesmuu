import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { ALL_BALKAN_SONGS } from './src/data/songs/balkanSongs';
import { Song, SongPreviewResponse } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent data directory
const DATA_DIR = path.join(process.cwd(), 'data');
const SCHEDULE_FILE = path.join(DATA_DIR, 'schedule_overrides.json');
const SECRETS_FILE = path.join(DATA_DIR, '.credentials.json');
const TAKEDOWNS_FILE = path.join(DATA_DIR, 'takedowns.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Secure credentials initialization:
// 1. Checks process.env.ADMIN_PASSWORD / process.env.PRACTICE_PASSWORD
// 2. Or loads/generates high-entropy random secrets in data/.credentials.json
// Never uses trivial hardcoded passwords in production!
interface StoredCredentials {
  adminPassword: string;
  practicePassword: string;
  generatedAt: string;
}

function getOrGenerateCredentials(): { adminPass: string; practicePass: string } {
  let stored: StoredCredentials | null = null;

  try {
    if (fs.existsSync(SECRETS_FILE)) {
      stored = JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('[SECURITY] Error reading credentials file:', e);
  }

  if (!stored || !stored.adminPassword || !stored.practicePassword) {
    // Generate high-entropy 24-char secrets
    stored = {
      adminPassword: `Adm#${crypto.randomBytes(9).toString('base64url')}!`,
      practicePassword: `Trn#${crypto.randomBytes(9).toString('base64url')}!`,
      generatedAt: new Date().toISOString()
    };
    try {
      fs.writeFileSync(SECRETS_FILE, JSON.stringify(stored, null, 2), { mode: 0o600 });
      console.log('[SECURITY] Generated new secure credentials in data/.credentials.json');
    } catch (e) {
      console.error('[SECURITY] Could not persist credentials file:', e);
    }
  }

  const adminPass = process.env.ADMIN_PASSWORD || stored.adminPassword;
  const practicePass = process.env.PRACTICE_PASSWORD || stored.practicePassword;

  return { adminPass, practicePass };
}

const { adminPass: ADMIN_PASSWORD, practicePass: PRACTICE_PASSWORD } = getOrGenerateCredentials();

console.log('[SECURITY] Auth credentials initialized successfully.');
console.log(`[SECURITY] Admin access: ${process.env.ADMIN_PASSWORD ? 'Configured via ADMIN_PASSWORD environment variable' : 'Configured via persistent server secret'}`);
console.log(`[SECURITY] Practice access: ${process.env.PRACTICE_PASSWORD ? 'Configured via PRACTICE_PASSWORD environment variable' : 'Configured via persistent server secret'}`);

// Rate-limiting & Brute Force Protection
interface AuthAttemptRecord {
  failedAttempts: number;
  firstAttemptTime: number;
  blockedUntil: number;
}

const authAttempts = new Map<string, AuthAttemptRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(ip: string): { blocked: boolean; remainingMinutes?: number } {
  const now = Date.now();
  const record = authAttempts.get(ip);
  if (!record) return { blocked: false };

  if (record.blockedUntil > now) {
    const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
    return { blocked: true, remainingMinutes };
  }

  // If lockout or window expired (30 min), reset
  if (now - record.firstAttemptTime > 30 * 60 * 1000) {
    authAttempts.delete(ip);
    return { blocked: false };
  }

  return { blocked: false };
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const record = authAttempts.get(ip) || { failedAttempts: 0, firstAttemptTime: now, blockedUntil: 0 };
  record.failedAttempts += 1;

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + LOCKOUT_DURATION_MS;
    console.warn(`[SECURITY] IP ${ip} privremeno blokiran na 15 minuta zbog ${record.failedAttempts} neuspelih pokušaja!`);
  }
  authAttempts.set(ip, record);
}

function recordSuccessfulAttempt(ip: string): void {
  authAttempts.delete(ip);
}

// Constant-time string comparison to prevent timing attacks
function safeStringCompare(a?: string, b?: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Perform dummy timing
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// Ephemeral server-side secret for admin session tokens
const ADMIN_TOKEN_SECRET = crypto.randomBytes(32).toString('base64');
function getValidAdminToken(): string {
  return crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(ADMIN_PASSWORD).digest('hex');
}

function isAuthorizedAdmin(req: express.Request): boolean {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const bodyToken = req.body?.token;
  const rawPassword = req.body?.password;

  const validToken = getValidAdminToken();
  if (bearerToken && safeStringCompare(bearerToken, validToken)) return true;
  if (bodyToken && safeStringCompare(bodyToken, validToken)) return true;
  if (rawPassword && safeStringCompare(rawPassword, ADMIN_PASSWORD)) return true;
  return false;
}

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

function loadScheduleOverrides(): Record<string, string> {
  try {
    if (fs.existsSync(SCHEDULE_FILE)) {
      const content = fs.readFileSync(SCHEDULE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading schedule overrides:', err);
  }
  return {};
}

function saveScheduleOverrides(overrides: Record<string, string>): void {
  try {
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(overrides, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing schedule overrides:', err);
  }
}

import { Readable } from 'node:stream';

// In-memory cache for resolved previews with TTL (2 hours)
interface CachedPreview {
  data: SongPreviewResponse;
  expiresAt: number;
}
const previewCache = new Map<string, CachedPreview>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// Clean query terms for search engines
function sanitizeSearchQuery(str: string): string {
  return str
    .replace(/[čć]/g, 'c')
    .replace(/đ/g, 'dj')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z')
    .replace(/['"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanForComparison(str: string): string {
  return str.toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/đ/g, 'dj')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z')
    .replace(/[^a-z0-9]/g, '');
}

const LIVE_PATTERNS = /\b(live|uzivo|uživo|koncert|concert|arena|turneja|bez struje|in concert|at lisinski|hala tivoli|live in|live at|music week live|live 20\d\d|live in hollywood|live stark arena|zetra 20\d\d live)\b/i;
const GARBAGE_PATTERNS = /\b(tribute|karaoke|instrumental|acoustic cover|piano cover|backing track|ringtone)\b/i;

interface ScoredCandidate {
  previewUrl: string;
  coverUrl: string;
  albumTitle?: string;
  trackTitle: string;
  artistName: string;
  score: number;
}

function scoreCandidateTrack(
  candidateTitle: string,
  candidateArtist: string,
  candidateAlbum: string,
  targetSong: Song
): number {
  let score = 0;
  const targetCleanTitle = cleanForComparison(targetSong.title);
  const candCleanTitle = cleanForComparison(candidateTitle);
  const targetCleanArtist = cleanForComparison(targetSong.artist);
  const candCleanArtist = cleanForComparison(candidateArtist);

  // 1. Heavy penalty for live recordings (user explicitly requested removing live versions)
  if (LIVE_PATTERNS.test(candidateTitle)) score -= 300;
  if (LIVE_PATTERNS.test(candidateAlbum)) score -= 250;

  // 2. Heavy penalty for karaoke, tribute, cover, instrumental
  if (GARBAGE_PATTERNS.test(candidateTitle) || GARBAGE_PATTERNS.test(candidateArtist) || GARBAGE_PATTERNS.test(candidateAlbum)) {
    score -= 350;
  }

  // 3. Penalty for remix if target song is not a remix
  if (!/\bremix\b/i.test(targetSong.title) && /\bremix\b/i.test(candidateTitle)) {
    score -= 80;
  }

  // 4. Title matching (Crucial! Prevents picking 'Blokada' for 'Ona e')
  if (candCleanTitle === targetCleanTitle) {
    score += 160; // Exact title match
  } else if (candCleanTitle.startsWith(targetCleanTitle) || targetCleanTitle.startsWith(candCleanTitle)) {
    score += 100;
  } else if (candCleanTitle.includes(targetCleanTitle) || targetCleanTitle.includes(candCleanTitle)) {
    score += 70;
  } else {
    // Check keyword overlap
    const targetWords = targetSong.title.toLowerCase().split(/[\s,.'"-]+/).filter(w => w.length > 2);
    const candWords = candidateTitle.toLowerCase().split(/[\s,.'"-]+/).filter(w => w.length > 2);
    const overlap = targetWords.filter(w => candWords.some(cw => cw.includes(w) || w.includes(cw)));
    if (targetWords.length > 0 && overlap.length === targetWords.length) {
      score += 50;
    } else if (overlap.length > 0) {
      score += 15 * overlap.length;
    } else {
      score -= 140; // Title doesn't match at all
    }
  }

  // 5. Artist matching
  if (candCleanArtist === targetCleanArtist) {
    score += 60;
  } else if (candCleanArtist.includes(targetCleanArtist) || targetCleanArtist.includes(candCleanArtist)) {
    score += 40;
  } else {
    const mainTarget = targetSong.artist.split(/&|,|feat\.|ft\./i)[0].trim();
    if (mainTarget && candCleanArtist.includes(cleanForComparison(mainTarget))) {
      score += 30;
    }
  }

  return score;
}

// Generate candidate queries for a song
function getCandidateQueries(song: Song): string[] {
  const queries: string[] = [];
  
  if (song.previewQuery) {
    queries.push(sanitizeSearchQuery(song.previewQuery));
  }
  
  // Artist + Title
  queries.push(sanitizeSearchQuery(`${song.artist} ${song.title}`));
  
  // First main artist + Title (split & or feat)
  const mainArtist = song.artist.split(/&|,|feat\.|ft\./i)[0].trim();
  if (mainArtist !== song.artist) {
    queries.push(sanitizeSearchQuery(`${mainArtist} ${song.title}`));
  }
  
  // Title + Artist
  queries.push(sanitizeSearchQuery(`${song.title} ${mainArtist}`));

  // Unique list
  return Array.from(new Set(queries));
}

// Fetch and score candidates from Deezer API
async function fetchDeezerCandidates(query: string, targetSong: Song): Promise<ScoredCandidate[]> {
  try {
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=10`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return [];
    const data = await res.json() as { 
      data?: Array<{ 
        title: string;
        preview?: string; 
        artist?: { name: string };
        album?: { cover_medium?: string; cover_big?: string; title?: string } 
      }> 
    };
    
    if (!data?.data || data.data.length === 0) return [];

    const candidates: ScoredCandidate[] = [];
    for (const track of data.data) {
      if (!track.preview) continue;
      const score = scoreCandidateTrack(
        track.title || '',
        track.artist?.name || '',
        track.album?.title || '',
        targetSong
      );
      candidates.push({
        previewUrl: track.preview,
        coverUrl: track.album?.cover_big || track.album?.cover_medium || '',
        albumTitle: track.album?.title,
        trackTitle: track.title,
        artistName: track.artist?.name || '',
        score
      });
    }

    return candidates.sort((a, b) => b.score - a.score);
  } catch (err) {
    console.warn(`Deezer fetch error for query "${query}":`, err);
    return [];
  }
}

// Fetch and score candidates from iTunes API as fallback
async function fetchItunesCandidates(query: string, targetSong: Song): Promise<ScoredCandidate[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return [];
    const data = await res.json() as { 
      results?: Array<{ 
        trackName?: string;
        artistName?: string;
        previewUrl?: string; 
        artworkUrl100?: string; 
        collectionName?: string 
      }> 
    };
    
    if (!data?.results || data.results.length === 0) return [];

    const candidates: ScoredCandidate[] = [];
    for (const track of data.results) {
      if (!track.previewUrl || !track.trackName) continue;
      const highResCover = track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '600x600bb') : '';
      const score = scoreCandidateTrack(
        track.trackName,
        track.artistName || '',
        track.collectionName || '',
        targetSong
      );
      candidates.push({
        previewUrl: track.previewUrl,
        coverUrl: highResCover,
        albumTitle: track.collectionName,
        trackTitle: track.trackName,
        artistName: track.artistName || '',
        score
      });
    }

    return candidates.sort((a, b) => b.score - a.score);
  } catch (err) {
    console.warn(`iTunes fetch error for query "${query}":`, err);
    return [];
  }
}

// API: Song List for autocomplete
app.get('/api/songs', (req, res) => {
  const songs = ALL_BALKAN_SONGS.map(s => ({
    id: s.id,
    title: s.title,
    artist: s.artist,
    year: s.year,
    genre: s.genre,
    album: s.album,
    searchTerms: s.searchTerms
  }));
  res.json({ total: songs.length, songs });
});

// API: Audio Proxy to bypass CORS / iframe restrictions & provide Range support
app.get('/api/proxy/audio', async (req, res) => {
  const audioUrl = req.query.url as string;
  if (!audioUrl) {
    res.status(400).send('Missing audio URL parameter');
    return;
  }

  try {
    const parsed = new URL(audioUrl);
    // Only allow streaming from deezer or apple/itunes CDNs
    const allowedHosts = ['deezer.com', 'dzcdn.net', 'itunes.apple.com', 'apple.com', 'mzstatic.com', 'akamaihd.net'];
    const isAllowed = allowedHosts.some(host => parsed.hostname.endsWith(host));
    if (!isAllowed) {
      res.status(403).send('Audio host not allowed');
      return;
    }

    const rangeHeader = req.headers.range;
    const forwardHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    };
    if (rangeHeader) {
      forwardHeaders['Range'] = rangeHeader;
    }

    const audioRes = await fetch(audioUrl, { headers: forwardHeaders });
    if (!audioRes.ok && audioRes.status !== 206) {
      res.status(audioRes.status).send('Failed to fetch upstream audio');
      return;
    }

    res.status(audioRes.status);
    const contentType = audioRes.headers.get('content-type') || 'audio/mpeg';
    const contentLength = audioRes.headers.get('content-length');
    const contentRange = audioRes.headers.get('content-range');
    const acceptRanges = audioRes.headers.get('accept-ranges') || 'bytes';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', acceptRanges);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);

    if (audioRes.body) {
      // Pipe stream cleanly to client response, handling client aborts without crash
      try {
        // @ts-ignore Web ReadableStream to Node Readable
        const nodeStream = Readable.fromWeb(audioRes.body);
        nodeStream.on('error', (err) => {
          console.warn('Upstream audio stream error:', err.message);
        });
        req.on('close', () => {
          nodeStream.destroy();
        });
        nodeStream.pipe(res);
      } catch (streamErr) {
        const buffer = await audioRes.arrayBuffer();
        res.send(Buffer.from(buffer));
      }
    } else {
      const buffer = await audioRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (err) {
    console.error('Audio proxy error:', err);
    if (!res.headersSent) {
      res.status(500).send('Internal audio proxy error');
    }
  }
});

// API: Preview endpoint for a song ID
app.get('/api/preview/:songId', async (req, res) => {
  const { songId } = req.params;
  const song = ALL_BALKAN_SONGS.find(s => s.id === songId);

  if (!song) {
    res.status(404).json({ error: 'Song not found' });
    return;
  }

  // Check cache with TTL
  const cached = previewCache.get(songId);
  if (cached && Date.now() < cached.expiresAt) {
    res.json(cached.data);
    return;
  }

  const queries = getCandidateQueries(song);
  let bestCandidate: ScoredCandidate | null = null;
  let source: 'deezer' | 'itunes' | 'synth' = 'synth';

  // Collect candidates from Deezer
  const candidatePool: { candidate: ScoredCandidate; source: 'deezer' | 'itunes' }[] = [];
  for (const q of queries) {
    const candidates = await fetchDeezerCandidates(q, song);
    for (const c of candidates) {
      candidatePool.push({ candidate: c, source: 'deezer' });
    }
    // If we have an unequivocal studio match (score >= 180), stop querying Deezer
    if (candidates.length > 0 && candidates[0].score >= 180) {
      break;
    }
  }

  // If top Deezer candidate is not an unequivocal studio match (e.g. penalized by live album), also check iTunes
  const topDeezerScore = candidatePool.length > 0 ? Math.max(...candidatePool.map(c => c.candidate.score)) : -999;
  if (topDeezerScore < 180) {
    for (const q of queries) {
      const candidates = await fetchItunesCandidates(q, song);
      for (const c of candidates) {
        candidatePool.push({ candidate: c, source: 'itunes' });
      }
      if (candidates.length > 0 && candidates[0].score >= 180) {
        break;
      }
    }
  }

  // Sort candidate pool by score descending
  candidatePool.sort((a, b) => b.candidate.score - a.candidate.score);

  if (candidatePool.length > 0 && candidatePool[0].candidate.score > 0) {
    bestCandidate = candidatePool[0].candidate;
    source = candidatePool[0].source;
  } else if (candidatePool.length > 0) {
    // Only live or low-score tracks exist online, pick least penalized
    bestCandidate = candidatePool[0].candidate;
    source = candidatePool[0].source;
  }

  const response: SongPreviewResponse = {
    songId: song.id,
    title: song.title,
    artist: song.artist,
    year: song.year,
    genre: song.genre,
    album: bestCandidate?.albumTitle || song.album,
    coverUrl: bestCandidate?.coverUrl || '',
    previewUrl: bestCandidate?.previewUrl ? `/api/proxy/audio?url=${encodeURIComponent(bestCandidate.previewUrl)}` : '',
    directPreviewUrl: bestCandidate?.previewUrl || '',
    source: bestCandidate ? source : 'synth',
    startOffset: song.startOffset || 0
  };

  // Cache result with TTL
  previewCache.set(songId, {
    data: response,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
  res.json(response);
});

// API: Get global daily schedule overrides (available to all players)
app.get('/api/schedule', (req, res) => {
  const overrides = loadScheduleOverrides();
  res.json({ overrides });
});

// API: Verify admin password with brute-force protection
app.post('/api/admin/verify', (req, res) => {
  const ip = getClientIp(req);
  const rateCheck = checkRateLimit(ip);
  if (rateCheck.blocked) {
    res.status(429).json({ 
      success: false, 
      error: `Previše neuspelih pokušaja sa ove IP adrese. Pristup je privremeno blokiran (još ${rateCheck.remainingMinutes} min).` 
    });
    return;
  }

  const { password } = req.body || {};
  if (safeStringCompare(password, ADMIN_PASSWORD)) {
    recordSuccessfulAttempt(ip);
    res.json({ success: true, authorized: true, token: getValidAdminToken() });
  } else {
    recordFailedAttempt(ip);
    res.status(401).json({ success: false, error: 'Pogrešna lozinka' });
  }
});

// API: Verify practice mode password with brute-force protection
app.post('/api/practice/verify', (req, res) => {
  const ip = getClientIp(req);
  const rateCheck = checkRateLimit(ip);
  if (rateCheck.blocked) {
    res.status(429).json({ 
      success: false, 
      error: `Previše neuspelih pokušaja sa ove IP adrese. Pristup je privremeno blokiran (još ${rateCheck.remainingMinutes} min).` 
    });
    return;
  }

  const { password } = req.body || {};
  if (safeStringCompare(password, PRACTICE_PASSWORD)) {
    recordSuccessfulAttempt(ip);
    res.json({ success: true, authorized: true });
  } else {
    recordFailedAttempt(ip);
    res.status(401).json({ success: false, error: 'Pogrešna šifra za trening' });
  }
});

// API: Copyright Notice & Takedown Request
app.post('/api/takedown', (req, res) => {
  const { claimantName, email, songInfo, proofUrl, notes } = req.body || {};

  if (!email || !songInfo) {
    res.status(400).json({ error: 'Morate navesti email adresu i podatke o pesmi.' });
    return;
  }

  const takedownRecord = {
    id: `tk_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    receivedAt: new Date().toISOString(),
    claimantName: (claimantName || 'Anonimno').slice(0, 100),
    email: email.slice(0, 150),
    songInfo: songInfo.slice(0, 300),
    proofUrl: (proofUrl || '').slice(0, 500),
    notes: (notes || '').slice(0, 1000),
    status: 'received'
  };

  try {
    let list: any[] = [];
    if (fs.existsSync(TAKEDOWNS_FILE)) {
      list = JSON.parse(fs.readFileSync(TAKEDOWNS_FILE, 'utf-8'));
    }
    list.push(takedownRecord);
    fs.writeFileSync(TAKEDOWNS_FILE, JSON.stringify(list, null, 2));
    console.log(`[TAKEDOWN] Primljen zahtev za uklanjanje #${takedownRecord.id}: ${songInfo} od ${email}`);
  } catch (err) {
    console.error('[TAKEDOWN] Greška pri čuvanju zahteva:', err);
  }

  res.json({
    success: true,
    ticketId: takedownRecord.id,
    message: 'Vaš zahtev za uklanjanje pesme je uspešno zaprimljen. Sporni sadržaj se pregleda i uklanja u roku od 24 sata.'
  });
});

// API: Admin update schedule override (applies immediately to all players)
app.post('/api/admin/schedule', (req, res) => {
  const ip = getClientIp(req);
  const rateCheck = checkRateLimit(ip);
  if (rateCheck.blocked) {
    res.status(429).json({ error: 'Previše neuspelih zahteva. Pristup je privremeno blokiran.' });
    return;
  }

  if (!isAuthorizedAdmin(req)) {
    recordFailedAttempt(ip);
    res.status(401).json({ error: 'Neautorizovan pristup' });
    return;
  }
  recordSuccessfulAttempt(ip);

  const { dateStr, category, songId } = req.body || {};

  if (!dateStr || !category || !songId) {
    res.status(400).json({ error: 'Nedostaju podaci (dateStr, category, songId)' });
    return;
  }

  const overrides = loadScheduleOverrides();
  const key = `${dateStr}:${category}`;
  overrides[key] = songId;
  saveScheduleOverrides(overrides);

  console.log(`[Admin] Postavljena pesma za ${key}: ${songId}`);
  res.json({ success: true, overrides });
});

// API: Admin delete schedule override (reverts to algorithmic daily song for all players)
app.delete('/api/admin/schedule', (req, res) => {
  const ip = getClientIp(req);
  const rateCheck = checkRateLimit(ip);
  if (rateCheck.blocked) {
    res.status(429).json({ error: 'Previše neuspelih zahteva. Pristup je privremeno blokiran.' });
    return;
  }

  if (!isAuthorizedAdmin(req)) {
    recordFailedAttempt(ip);
    res.status(401).json({ error: 'Neautorizovan pristup' });
    return;
  }
  recordSuccessfulAttempt(ip);

  const { dateStr, category } = req.body || {};

  if (!dateStr || !category) {
    res.status(400).json({ error: 'Nedostaju parametri' });
    return;
  }

  const overrides = loadScheduleOverrides();
  const key = `${dateStr}:${category}`;
  delete overrides[key];
  saveScheduleOverrides(overrides);

  console.log(`[Admin] Obrisana izmena rasporeda za ${key}`);
  res.json({ success: true, overrides });
});

async function startServer() {
  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pogodi Pesmu server running on port ${PORT}`);
  });
}

startServer();
