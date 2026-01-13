export default defineContentScript({
  matches: ['https://www.metal-archives.com/*'],
  runAt: 'document_start',

  async main() {
    // Wait for DOM to be ready before adding UI elements
    if (document.readyState === 'loading') {
      await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve));
    }

    const style = document.createElement('style');
    style.textContent = `
      .bma-controls {
        display: none;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 15px;
        padding: 12px;
        border: 1px solid #444;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.2);
      }

      .bma-controls.visible {
        display: flex;
      }

      .bma-controls-header {
        font-size: 11px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
        padding-bottom: 8px;
        border-bottom: 1px solid #333;
      }

      .bma-stats-section {
        margin-bottom: 10px;
      }

      .bma-stats-title {
        font-size: 10px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
      }

      .bma-stats-row {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .bma-stat {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: #1a1a1a;
        border: 1px solid #333;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.15s;
      }

      .bma-stat:hover {
        background: #252525;
        border-color: #444;
      }

      .bma-stat.active {
        border-color: #666;
        background: #2a2a2a;
      }

      .bma-stat-value {
        font-weight: bold;
      }

      .bma-stat-label {
        color: #999;
      }

      /* Status colors */
      .bma-stat[data-status="active"] .bma-stat-value { color: #6c6; }
      .bma-stat[data-status="active"].active { border-color: #6c6; background: #1a2a1a; }
      .bma-stat[data-status="split-up"] .bma-stat-value { color: #c66; }
      .bma-stat[data-status="split-up"].active { border-color: #c66; background: #2a1a1a; }
      .bma-stat[data-status="on-hold"] .bma-stat-value { color: #cc6; }
      .bma-stat[data-status="on-hold"].active { border-color: #cc6; background: #2a2a1a; }
      .bma-stat[data-status="changed-name"] .bma-stat-value { color: #69c; }
      .bma-stat[data-status="changed-name"].active { border-color: #69c; background: #1a2a3a; }
      .bma-stat[data-status="unknown"] .bma-stat-value { color: #888; }
      .bma-stat[data-status="unknown"].active { border-color: #888; background: #222; }
      .bma-stat[data-status="closed"] .bma-stat-value { color: #c66; }
      .bma-stat[data-status="closed"].active { border-color: #c66; background: #2a1a1a; }

      /* Genre colors */
      .bma-stat[data-genre] .bma-stat-value { color: #c9a; }
      .bma-stat[data-genre].active { border-color: #c9a; background: #2a1a2a; }

      /* Location colors */
      .bma-stat[data-location] .bma-stat-value { color: #9ac; }
      .bma-stat[data-location].active { border-color: #9ac; background: #1a2a2a; }

      /* No location - dimmer style */
      .bma-stat.no-location .bma-stat-value { color: #777; }
      .bma-stat.no-location .bma-stat-label { font-style: italic; }
      .bma-stat.no-location.active { border-color: #777; background: #222; }

      .bma-stat.total {
        cursor: default;
      }
      .bma-stat.total:hover {
        background: #1a1a1a;
        border-color: #333;
      }
      .bma-stat.total .bma-stat-value { color: #fff; }

      .bma-loading {
        color: #999;
        font-size: 11px;
        padding: 4px 0;
      }

      .bma-filter-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        padding-top: 10px;
        border-top: 1px solid #333;
      }

      .bma-filter-input {
        background: #1a1a1a;
        border: 1px solid #444;
        color: #ddd;
        padding: 6px 10px;
        font-size: 12px;
        width: 250px;
      }

      .bma-filter-input:focus {
        outline: none;
        border-color: #666;
        background: #222;
      }

      .bma-filter-input::placeholder {
        color: #666;
      }

      .bma-filter-count {
        color: #888;
        font-size: 11px;
        margin-left: auto;
      }

      /* Band hover preview */
      .bma-preview {
        position: fixed;
        z-index: 100000;
        background: #1a1a1a;
        border: 1px solid #444;
        border-radius: 4px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        font-size: 12px;
        color: #ccc;
        pointer-events: none;
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: stretch !important;
        overflow: hidden;
        max-width: 600px;
      }

      .bma-preview > .bma-preview-main {
        flex: 1 1 auto;
        padding: 12px;
        min-width: 280px;
      }

      .bma-preview > .bma-preview-photo {
        flex: 0 0 200px;
        width: 200px;
        background: #111;
        overflow: hidden;
        border-left: 1px solid #333;
      }

      .bma-preview > .bma-preview-photo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .bma-preview-header {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
      }

      .bma-preview-logo {
        width: 100px;
        height: 60px;
        flex-shrink: 0;
        background: #111;
        border-radius: 2px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .bma-preview-logo img {
        max-width: 100px;
        max-height: 60px;
        object-fit: contain;
      }

      .bma-preview-no-logo {
        font-size: 18px;
        color: #444;
      }

      .bma-preview-info {
        flex: 1;
        min-width: 0;
      }

      .bma-preview-name {
        font-size: 14px;
        font-weight: bold;
        color: #fff;
        margin-bottom: 4px;
      }

      .bma-preview-genre {
        color: #c9a;
        font-size: 11px;
        margin-bottom: 4px;
      }

      .bma-preview-location {
        color: #888;
        font-size: 11px;
        margin-bottom: 6px;
      }

      .bma-preview-meta {
        display: flex;
        gap: 12px;
        padding-top: 8px;
        border-top: 1px solid #333;
        font-size: 11px;
      }

      .bma-preview-meta-item {
        display: flex;
        flex-direction: column;
      }

      .bma-preview-meta-value {
        color: #fff;
        font-weight: bold;
      }

      .bma-preview-meta-label {
        color: #666;
        font-size: 10px;
      }

      .bma-preview-status {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
      }

      .bma-preview-status.active { background: #1a3a1a; color: #6c6; }
      .bma-preview-status.split-up { background: #3a1a1a; color: #c66; }
      .bma-preview-status.on-hold { background: #3a3a1a; color: #cc6; }
      .bma-preview-status.changed-name { background: #1a2a3a; color: #69c; }
      .bma-preview-status.closed { background: #3a1a1a; color: #c66; }

      .bma-preview-albums {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #333;
      }

      .bma-preview-albums-title {
        font-size: 10px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
      }

      .bma-preview-album {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding: 3px 0;
        font-size: 11px;
      }

      .bma-preview-album-name {
        color: #ddd;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-right: 8px;
      }

      .bma-preview-album-info {
        color: #666;
        font-size: 10px;
        white-space: nowrap;
      }

      .bma-preview-loading {
        color: #888;
        font-style: italic;
        padding: 12px;
      }

      /* Custom results container */
      .bma-results-container {
        display: none;
      }

      .bma-results-container.visible {
        display: block;
      }

      .bma-results-info {
        padding: 5px 0;
        font-size: 12px;
      }

      .bma-clear-filter {
        color: #999;
        cursor: pointer;
        margin-left: 10px;
      }

      .bma-clear-filter:hover {
        text-decoration: underline;
      }

      .bma-pagination {
        margin-top: 10px;
        text-align: center;
      }

      .bma-page-btn {
        display: inline-block;
        padding: 2px 8px;
        margin: 0 2px;
        background: transparent;
        border: 1px solid #333;
        color: #999;
        cursor: pointer;
        font-size: 11px;
      }

      .bma-page-btn:hover {
        border-color: #666;
        color: #fff;
      }

      .bma-page-btn.active {
        background: #333;
        color: #fff;
      }

      .bma-page-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Hide original table when showing filtered results */
      .bma-original-hidden {
        display: none !important;
      }

      /* Tabs */
      .bma-tabs {
        display: flex;
        gap: 0;
        margin-bottom: 12px;
        border-bottom: 1px solid #333;
      }

      .bma-tab {
        padding: 8px 16px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: #888;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.15s;
      }

      .bma-tab:hover {
        color: #ccc;
      }

      .bma-tab.active {
        color: #fff;
        border-bottom-color: #c9a;
      }

      .bma-tab-content {
        display: none;
      }

      .bma-tab-content.active {
        display: block;
      }

      /* Releases panel */
      .bma-releases-container {
        max-height: calc(100vh - 200px);
        overflow-y: auto;
        padding-right: 10px;
      }

      .bma-releases-month {
        margin-bottom: 20px;
      }

      .bma-releases-month-header {
        font-size: 13px;
        font-weight: bold;
        color: #c9a;
        padding: 8px 0;
        border-bottom: 1px solid #333;
        margin-bottom: 8px;
        position: sticky;
        top: 0;
        background: rgba(0, 0, 0, 0.9);
      }

      .bma-release-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 6px 0;
        border-bottom: 1px solid #222;
      }

      .bma-release-item:last-child {
        border-bottom: none;
      }

      .bma-release-date {
        flex: 0 0 50px;
        font-size: 11px;
        color: #666;
      }

      .bma-release-band {
        flex: 0 0 180px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .bma-release-band a {
        color: #fff;
      }

      .bma-release-title {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .bma-release-title a {
        color: #9ac;
      }

      .bma-release-type {
        flex: 0 0 80px;
        font-size: 10px;
        color: #666;
        text-align: right;
      }

      .bma-release-genre {
        flex: 0 0 150px;
        font-size: 10px;
        color: #888;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .bma-releases-nav {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
      }

      .bma-releases-nav select {
        background: #1a1a1a;
        border: 1px solid #444;
        color: #ddd;
        padding: 6px 10px;
        font-size: 12px;
        cursor: pointer;
      }

      .bma-releases-nav select:focus {
        outline: none;
        border-color: #666;
      }

      .bma-releases-summary {
        color: #888;
        font-size: 11px;
        margin-left: auto;
      }

      .bma-export-btn {
        background: #2a2a2a;
        border: 1px solid #444;
        color: #ccc;
        padding: 6px 12px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.15s;
      }

      .bma-export-btn:hover {
        background: #333;
        border-color: #666;
        color: #fff;
      }

      .bma-export-btn.copied {
        background: #1a3a1a;
        border-color: #6c6;
        color: #6c6;
      }

      .bma-releases-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #333;
      }

      .bma-release-type-filter {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: #1a1a1a;
        border: 1px solid #333;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.15s;
      }

      .bma-release-type-filter:hover {
        background: #252525;
        border-color: #444;
      }

      .bma-release-type-filter.active {
        border-color: #c9a;
        background: #2a1a2a;
      }

      .bma-release-type-filter .count {
        color: #c9a;
        font-weight: bold;
      }

      .bma-release-type-filter .label {
        color: #999;
      }

      .bma-release-type-filter.active .label {
        color: #fff;
      }
    `;
    document.head.appendChild(style);

    // Check if we're on a country list page or label country page
    const isCountryListPage = /^\/lists\/[A-Z]{2}$/.test(window.location.pathname);
    const isLabelCountryPage = /^\/label\/country\/c\/[A-Z]{2}$/.test(window.location.pathname);

    if (isCountryListPage) {
      initCountryListPage();
    } else if (isLabelCountryPage) {
      initLabelCountryPage();
    }

    // Initialize band hover preview on all pages
    initBandPreview();
  },
});

interface BandData {
  name: string;
  nameHtml: string;
  genre: string;
  location: string;
  status: string;
  statusNormalized: string;
}

interface LabelData {
  name: string;
  nameHtml: string;
  specialisation: string;
  status: string;
  statusNormalized: string;
  hasWebsite: boolean;
  hasOnlineShopping: boolean;
}

interface StatusCounts {
  active: number;
  'split-up': number;
  'on-hold': number;
  'changed-name': number;
  closed: number;
  unknown: number;
  total: number;
}

interface ReleaseData {
  bandName: string;
  bandHtml: string;
  albumName: string;
  albumHtml: string;
  type: string;
  genre: string;
  date: string; // Full date string like "January 15th, 2025"
  year: number;
  month: number;
  day: number;
}

// Global state for band pages
const appState = {
  allBands: [] as BandData[],
  filteredBands: [] as BandData[],
  filterText: '',
  filterStatuses: new Set<string>(),
  filterGenres: new Set<string>(),
  filterLocations: new Set<string>(),
  currentPage: 0,
  pageSize: 100,
  isFiltering: false,
};

// Global state for label pages
const labelState = {
  allLabels: [] as LabelData[],
  filteredLabels: [] as LabelData[],
  filterText: '',
  filterStatuses: new Set<string>(),
  filterSpecialisations: new Set<string>(),
  currentPage: 0,
  pageSize: 100,
};

// Global state for releases
const releasesState = {
  releases: [] as ReleaseData[],
  selectedYear: new Date().getFullYear(),
  selectedMonth: 0, // 0 = all months
  isLoading: false,
  isLoaded: false,
  filterTypes: new Set<string>(),
};

function normalizeStatus(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('active')) return 'active';
  if (s.includes('split')) return 'split-up';
  if (s.includes('hold')) return 'on-hold';
  if (s.includes('changed')) return 'changed-name';
  if (s.includes('closed')) return 'closed';
  return 'unknown';
}

async function fetchAllBands(countryCode: string, onProgress?: (loaded: number, total: number) => void): Promise<BandData[]> {
  const bands: BandData[] = [];
  let start = 0;
  const pageSize = 500;
  let total = Infinity;

  while (start < total) {
    const url = `https://www.metal-archives.com/browse/ajax-country/c/${countryCode}/json/1?sEcho=1&iDisplayStart=${start}&iDisplayLength=${pageSize}`;

    const response = await fetch(url);
    const data = await response.json();

    total = data.iTotalRecords;

    for (const row of data.aaData) {
      const nameMatch = row[0].match(/>([^<]+)</);
      const name = nameMatch ? nameMatch[1] : row[0];
      const status = row[3];

      bands.push({
        name,
        nameHtml: row[0],
        genre: row[1],
        location: row[2],
        status,
        statusNormalized: normalizeStatus(status),
      });
    }

    start += pageSize;
    onProgress?.(Math.min(start, total), total);
  }

  return bands;
}

async function fetchReleasesByCountry(
  countryCode: string,
  year: number,
  onProgress?: (loaded: number, total: number) => void
): Promise<ReleaseData[]> {
  const releases: ReleaseData[] = [];
  let start = 0;
  const pageSize = 200;
  let total = Infinity;

  // Build search URL for albums by country and year
  const baseParams = new URLSearchParams({
    bandName: '',
    releaseTitle: '',
    releaseYearFrom: year.toString(),
    releaseYearTo: year.toString(),
    releaseMonthFrom: '',
    releaseMonthTo: '',
    releaseType: '',
    releaseLabelName: '',
  });
  baseParams.append('country[]', countryCode);

  while (start < total) {
    const url = `https://www.metal-archives.com/search/ajax-advanced/searching/albums/?${baseParams.toString()}&sEcho=1&iDisplayStart=${start}&iDisplayLength=${pageSize}`;

    const response = await fetch(url);
    const data = await response.json();

    total = data.iTotalRecords;

    for (const row of data.aaData) {
      // Row format: [bandHtml, albumHtml, type, date, genre]
      // But the advanced search returns: [bandHtml, albumHtml, type, date]
      const bandMatch = row[0].match(/>([^<]+)</);
      const bandName = bandMatch ? bandMatch[1] : row[0];

      const albumMatch = row[1].match(/>([^<]+)</);
      const albumName = albumMatch ? albumMatch[1] : row[1];

      const type = row[2] || '';
      const dateStr = row[3] || '';

      // Parse date - format is like "January 15th, 2025" or "2025"
      const { year: parsedYear, month, day } = parseReleaseDate(dateStr, year);

      releases.push({
        bandName,
        bandHtml: row[0],
        albumName,
        albumHtml: row[1],
        type,
        genre: row[4] || '',
        date: dateStr,
        year: parsedYear,
        month,
        day,
      });
    }

    start += pageSize;
    onProgress?.(Math.min(start, total), total);
  }

  // Sort by date descending (newest first)
  releases.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.month !== b.month) return b.month - a.month;
    return b.day - a.day;
  });

  return releases;
}

function parseReleaseDate(dateStr: string, fallbackYear: number): { year: number; month: number; day: number } {
  // Patterns:
  // "January 15th, 2025"
  // "January 2025"
  // "2025"
  const months: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  };

  const lower = dateStr.toLowerCase();

  // Try full date pattern
  const fullMatch = lower.match(/(\w+)\s+(\d+)(?:st|nd|rd|th)?,?\s*(\d{4})/);
  if (fullMatch) {
    return {
      year: parseInt(fullMatch[3]),
      month: months[fullMatch[1]] || 0,
      day: parseInt(fullMatch[2]),
    };
  }

  // Try month + year pattern
  const monthYearMatch = lower.match(/(\w+)\s+(\d{4})/);
  if (monthYearMatch) {
    return {
      year: parseInt(monthYearMatch[2]),
      month: months[monthYearMatch[1]] || 0,
      day: 0,
    };
  }

  // Try year only
  const yearMatch = dateStr.match(/(\d{4})/);
  if (yearMatch) {
    return {
      year: parseInt(yearMatch[1]),
      month: 0,
      day: 0,
    };
  }

  return { year: fallbackYear, month: 0, day: 0 };
}

function countStatuses(items: Array<{ statusNormalized: string }>): StatusCounts {
  const counts: StatusCounts = {
    active: 0,
    'split-up': 0,
    'on-hold': 0,
    'changed-name': 0,
    closed: 0,
    unknown: 0,
    total: items.length,
  };

  for (const item of items) {
    const status = item.statusNormalized;
    if (status === 'active') counts.active++;
    else if (status === 'split-up') counts['split-up']++;
    else if (status === 'on-hold') counts['on-hold']++;
    else if (status === 'changed-name') counts['changed-name']++;
    else if (status === 'closed') counts.closed++;
    else counts.unknown++;
  }

  return counts;
}

function getTopLocations(bands: BandData[], limit = 10): Array<{ location: string; count: number; isNoLocation?: boolean }> {
  const locationCounts = new Map<string, number>();
  let noLocationCount = 0;

  for (const band of bands) {
    if (!band.location.trim()) {
      noLocationCount++;
      continue;
    }
    const parts = parseLocationParts(band.location);
    for (const part of parts) {
      locationCounts.set(part, (locationCounts.get(part) || 0) + 1);
    }
  }

  const results: Array<{ location: string; count: number; isNoLocation?: boolean }> = Array.from(locationCounts.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  // Add "No location" at the end if there are any
  if (noLocationCount > 0) {
    results.push({ location: '__no_location__', count: noLocationCount, isNoLocation: true });
  }

  return results;
}

// Normalize a genre by removing "Metal" suffix
// e.g., "Death Metal" -> "Death", "Black Metal" -> "Black", "Doom" -> "Doom"
function normalizeGenre(genre: string): string {
  return genre.replace(/\s+Metal$/i, '').trim();
}

// Parse a band's genre string into normalized parts
// e.g., "Black/Thrash Metal" -> ["Black", "Thrash"]
// e.g., "Melodic Death Metal" -> ["Melodic Death"]
// e.g., "Death Metal, Black Metal" -> ["Death", "Black"]
function parseGenreParts(genreStr: string): string[] {
  if (!genreStr) return [];

  // Remove parenthetical content like "(early)", "(later)"
  const cleaned = genreStr.replace(/\s*\([^)]*\)\s*/g, ' ').trim();

  // Split on comma or semicolon first (these are usually separate genres)
  const commaParts = cleaned.split(/[,;]/).map(p => p.trim()).filter(p => p);

  const results: string[] = [];

  for (const part of commaParts) {
    // Check if this part has a slash (e.g., "Black/Thrash Metal" or "Death/Black Metal")
    if (part.includes('/')) {
      // Find the suffix (e.g., "Metal", "Rock")
      const suffixMatch = part.match(/\s+(Metal|Rock|Punk|Core|Grind|Grindcore|Doom|Hardcore)$/i);
      const suffix = suffixMatch ? suffixMatch[0] : '';

      // Remove the suffix from the end, split on slash, then re-add suffix to each
      const withoutSuffix = suffix ? part.slice(0, -suffix.length).trim() : part;
      const slashParts = withoutSuffix.split('/').map(p => p.trim()).filter(p => p);

      for (const sp of slashParts) {
        // If the part already ends with a genre word, don't add suffix
        if (/Metal|Rock|Punk|Core|Grind|Grindcore|Doom|Hardcore$/i.test(sp)) {
          results.push(normalizeGenre(sp));
        } else {
          results.push(normalizeGenre((sp + suffix).trim()));
        }
      }
    } else {
      results.push(normalizeGenre(part));
    }
  }

  return [...new Set(results)]; // Remove duplicates
}

// Check if a band matches any of the selected genre filters
function bandMatchesGenreFilter(band: BandData, filterGenres: Set<string>): boolean {
  if (filterGenres.size === 0) return true;
  const bandGenres = parseGenreParts(band.genre);
  return bandGenres.some(g => filterGenres.has(g));
}

// Parse a band's location string into normalized parts
// Location format is typically: "City, Region" or "City, Region ; City2, Region2" for multi-country bands
function parseLocationParts(locationStr: string): string[] {
  if (!locationStr) return [];

  // Remove parenthetical content like "(early)"
  const cleaned = locationStr.replace(/\s*\([^)]*\)\s*/g, ' ').trim();

  // Split on semicolon first (for multi-country bands)
  const locations = cleaned.split(/\s*;\s*/);

  const parts: string[] = [];
  for (const loc of locations) {
    // For each location, split on comma to get city and region
    const cityRegion = loc.split(/,/).map(p => p.trim()).filter(p => p);
    // Add the full location and individual parts
    if (cityRegion.length > 1) {
      // Add region (usually province/state/country) - this is typically the last part
      parts.push(cityRegion[cityRegion.length - 1]);
    }
    if (cityRegion.length > 0) {
      // Add city (first part)
      parts.push(cityRegion[0]);
    }
  }

  return [...new Set(parts)]; // Remove duplicates
}

// Check if a band matches any of the selected location filters
function bandMatchesLocationFilter(band: BandData, filterLocations: Set<string>): boolean {
  if (filterLocations.size === 0) return true;

  // Check for "No location" filter
  if (filterLocations.has('__no_location__') && !band.location.trim()) {
    return true;
  }

  const bandLocations = parseLocationParts(band.location);
  return bandLocations.some(l => filterLocations.has(l));
}

function getTopGenres(bands: BandData[], limit = 10): Array<{ genre: string; count: number }> {
  const genreCounts = new Map<string, number>();

  for (const band of bands) {
    const parts = parseGenreParts(band.genre);
    for (const part of parts) {
      genreCounts.set(part, (genreCounts.get(part) || 0) + 1);
    }
  }

  return Array.from(genreCounts.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function applyFilters(): BandData[] {
  const { allBands, filterText, filterStatuses, filterGenres, filterLocations } = appState;

  return allBands.filter((band) => {
    // Text filter
    const textMatch = !filterText ||
      band.name.toLowerCase().includes(filterText) ||
      band.genre.toLowerCase().includes(filterText) ||
      band.location.toLowerCase().includes(filterText);

    // Status filter (OR within statuses)
    const statusMatch = filterStatuses.size === 0 ||
      filterStatuses.has(band.statusNormalized);

    // Genre filter (OR within genres)
    const genreMatch = bandMatchesGenreFilter(band, filterGenres);

    // Location filter (OR within locations)
    const locationMatch = bandMatchesLocationFilter(band, filterLocations);

    return textMatch && statusMatch && genreMatch && locationMatch;
  });
}

function renderFilteredResults(container: HTMLElement) {
  const { filteredBands, currentPage, pageSize, filterText, filterStatuses, filterGenres, filterLocations } = appState;
  const isFiltering = filterText || filterStatuses.size > 0 || filterGenres.size > 0 || filterLocations.size > 0;

  if (!isFiltering) {
    container.classList.remove('visible');
    document.querySelector('#bandListCountry_wrapper')?.classList.remove('bma-original-hidden');
    return;
  }

  container.classList.add('visible');
  document.querySelector('#bandListCountry_wrapper')?.classList.add('bma-original-hidden');

  const totalPages = Math.ceil(filteredBands.length / pageSize);
  const startIdx = currentPage * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filteredBands.length);
  const pageBands = filteredBands.slice(startIdx, endIdx);

  // Build active filters display
  const activeFilters: string[] = [];
  if (filterGenres.size > 0) activeFilters.push(`Genre: ${Array.from(filterGenres).join(' or ')}`);
  if (filterLocations.size > 0) activeFilters.push(`Location: ${Array.from(filterLocations).join(' or ')}`);
  if (filterStatuses.size > 0) activeFilters.push(`Status: ${Array.from(filterStatuses).join(' or ')}`);
  if (filterText) activeFilters.push(`"${filterText}"`);
  const filtersDisplay = activeFilters.length > 0 ? ` — ${activeFilters.join(' + ')}` : '';

  container.innerHTML = `
    <div class="bma-results-info">
      Showing ${startIdx + 1}-${endIdx} of ${filteredBands.length.toLocaleString()} results${filtersDisplay}
      <span class="bma-clear-filter">[Clear all filters]</span>
    </div>
    <table id="bma-filtered-table" class="display">
      <thead>
        <tr>
          <th>Band name</th>
          <th>Genre</th>
          <th>Location</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${pageBands.map((band, idx) => `
          <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
            <td>${band.nameHtml}</td>
            <td>${band.genre}</td>
            <td>${band.location}</td>
            <td>${band.status}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${totalPages > 1 ? `
      <div class="bma-pagination">
        <button class="bma-page-btn" data-page="prev" ${currentPage === 0 ? 'disabled' : ''}>Prev</button>
        ${generatePageButtons(currentPage, totalPages)}
        <button class="bma-page-btn" data-page="next" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>Next</button>
      </div>
    ` : ''}
  `;

  // Clear filter handler
  container.querySelector('.bma-clear-filter')?.addEventListener('click', () => {
    appState.filterText = '';
    appState.filterStatuses.clear();
    appState.filterGenres.clear();
    appState.filterLocations.clear();
    appState.currentPage = 0;

    const input = document.getElementById('bma-filter-input') as HTMLInputElement;
    if (input) input.value = '';

    document.querySelectorAll('.bma-stat').forEach((t) => t.classList.remove('active'));
    updateFilterCount();
    appState.filteredBands = applyFilters();
    renderFilteredResults(container);
  });

  // Pagination handlers
  container.querySelectorAll('.bma-page-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-page');
      if (page === 'prev' && appState.currentPage > 0) {
        appState.currentPage--;
      } else if (page === 'next' && appState.currentPage < totalPages - 1) {
        appState.currentPage++;
      } else if (page !== 'prev' && page !== 'next') {
        appState.currentPage = parseInt(page!, 10);
      }
      renderFilteredResults(container);
    });
  });
}

function generatePageButtons(current: number, total: number): string {
  const buttons: string[] = [];
  const maxButtons = 7;

  if (total <= maxButtons) {
    for (let i = 0; i < total; i++) {
      buttons.push(`<button class="bma-page-btn ${i === current ? 'active' : ''}" data-page="${i}">${i + 1}</button>`);
    }
  } else {
    // Always show first page
    buttons.push(`<button class="bma-page-btn ${0 === current ? 'active' : ''}" data-page="0">1</button>`);

    if (current > 2) {
      buttons.push(`<span style="color:#666">...</span>`);
    }

    // Show pages around current
    const start = Math.max(1, current - 1);
    const end = Math.min(total - 2, current + 1);

    for (let i = start; i <= end; i++) {
      buttons.push(`<button class="bma-page-btn ${i === current ? 'active' : ''}" data-page="${i}">${i + 1}</button>`);
    }

    if (current < total - 3) {
      buttons.push(`<span style="color:#666">...</span>`);
    }

    // Always show last page
    buttons.push(`<button class="bma-page-btn ${total - 1 === current ? 'active' : ''}" data-page="${total - 1}">${total}</button>`);
  }

  return buttons.join('');
}

function updateFilterCount() {
  const countEl = document.querySelector('.bma-filter-count');
  if (countEl) {
    const { filteredBands, allBands, filterText, filterStatuses, filterGenres, filterLocations } = appState;
    const hasFilters = filterText || filterStatuses.size > 0 || filterGenres.size > 0 || filterLocations.size > 0;
    if (hasFilters) {
      countEl.textContent = `${filteredBands.length.toLocaleString()} / ${allBands.length.toLocaleString()}`;
    } else {
      countEl.textContent = '';
    }
  }
}

function initCountryListPage() {
  const countryCode = window.location.pathname.split('/').pop() || '';

  // Create controls container
  const controls = document.createElement('div');
  controls.className = 'bma-controls';
  controls.innerHTML = `
    <div class="bma-controls-header">Better Metal Archives</div>
    <div class="bma-tabs">
      <button class="bma-tab active" data-tab="bands">Bands</button>
      <button class="bma-tab" data-tab="releases">Releases</button>
    </div>
    <div class="bma-tab-content active" data-tab-content="bands">
      <div class="bma-loading">Loading all bands...</div>
      <div class="bma-stats-section bma-status-stats"></div>
      <div class="bma-stats-section bma-genre-stats"></div>
      <div class="bma-stats-section bma-location-stats"></div>
      <div class="bma-filter-row">
        <input type="text" class="bma-filter-input" placeholder="Search by name..." id="bma-filter-input">
        <span class="bma-filter-count"></span>
      </div>
    </div>
    <div class="bma-tab-content" data-tab-content="releases">
      <div class="bma-releases-panel"></div>
    </div>
  `;

  // Create results container
  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'bma-results-container';

  // Wait for the table to load and insert controls above it
  const observer = new MutationObserver(() => {
    const tableWrapper = document.querySelector('#bandListCountry_wrapper');
    if (tableWrapper && !document.querySelector('.bma-controls.visible')) {
      tableWrapper.parentElement?.insertBefore(controls, tableWrapper);
      tableWrapper.parentElement?.insertBefore(resultsContainer, tableWrapper);
      controls.classList.add('visible');
      setupFilterLogic(controls, resultsContainer);
      setupTabs(controls, countryCode);
      loadAllData(countryCode, controls, resultsContainer);
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function setupTabs(controls: HTMLElement, countryCode: string) {
  const tabs = controls.querySelectorAll('.bma-tab');
  const tabContents = controls.querySelectorAll('.bma-tab-content');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');

      // Update active tab
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active content
      tabContents.forEach((content) => {
        if (content.getAttribute('data-tab-content') === tabName) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });

      // Hide/show original table and filtered results based on tab
      const tableWrapper = document.querySelector('#bandListCountry_wrapper');
      const resultsContainer = document.querySelector('.bma-results-container');

      if (tabName === 'releases') {
        tableWrapper?.classList.add('bma-original-hidden');
        resultsContainer?.classList.remove('visible');
        // Load releases if not loaded yet
        if (!releasesState.isLoaded && !releasesState.isLoading) {
          loadReleases(controls, countryCode);
        }
      } else {
        // Restore table visibility based on filter state
        const hasFilters = appState.filterText || appState.filterStatuses.size > 0 ||
          appState.filterGenres.size > 0 || appState.filterLocations.size > 0;
        if (hasFilters) {
          tableWrapper?.classList.add('bma-original-hidden');
          resultsContainer?.classList.add('visible');
        } else {
          tableWrapper?.classList.remove('bma-original-hidden');
          resultsContainer?.classList.remove('visible');
        }
      }
    });
  });
}

async function loadReleases(controls: HTMLElement, countryCode: string) {
  const panel = controls.querySelector('.bma-releases-panel');
  if (!panel) return;

  releasesState.isLoading = true;

  // Show loading with year selector
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  panel.innerHTML = `
    <div class="bma-releases-nav">
      <select id="bma-releases-year">
        ${years.map((y) => `<option value="${y}"${y === releasesState.selectedYear ? ' selected' : ''}>${y}</option>`).join('')}
      </select>
      <span class="bma-loading">Loading releases...</span>
    </div>
    <div class="bma-releases-container"></div>
  `;

  // Set up year change handler
  const yearSelect = panel.querySelector('#bma-releases-year') as HTMLSelectElement;
  yearSelect?.addEventListener('change', () => {
    releasesState.selectedYear = parseInt(yearSelect.value);
    releasesState.isLoaded = false;
    loadReleases(controls, countryCode);
  });

  try {
    const releases = await fetchReleasesByCountry(countryCode, releasesState.selectedYear, (loaded, total) => {
      const loadingEl = panel.querySelector('.bma-loading');
      if (loadingEl) {
        loadingEl.textContent = `Loading releases... ${loaded.toLocaleString()} / ${total.toLocaleString()}`;
      }
    });

    releasesState.releases = releases;
    releasesState.isLoaded = true;
    releasesState.isLoading = false;

    renderReleases(panel as HTMLElement);
  } catch (error) {
    console.error('[BMA] Failed to load releases:', error);
    panel.innerHTML = `<div class="bma-loading" style="color: #f87171;">Failed to load releases</div>`;
    releasesState.isLoading = false;
  }
}

function renderReleases(panel: HTMLElement) {
  const { releases, selectedYear, filterTypes } = releasesState;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);
  const countryCode = window.location.pathname.split('/').pop() || '';

  // Count release types
  const typeCounts = new Map<string, number>();
  for (const release of releases) {
    const type = release.type || 'Unknown';
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  }
  const sortedTypes = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1]);

  // Filter releases by type
  const filteredReleases = filterTypes.size === 0
    ? releases
    : releases.filter((r) => filterTypes.has(r.type || 'Unknown'));

  // Group filtered releases by month
  const byMonth = new Map<number, ReleaseData[]>();
  for (const release of filteredReleases) {
    const month = release.month || 0;
    if (!byMonth.has(month)) {
      byMonth.set(month, []);
    }
    byMonth.get(month)!.push(release);
  }

  // Sort months descending
  const sortedMonths = Array.from(byMonth.keys()).sort((a, b) => b - a);

  const monthNames = ['Unknown', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const summaryText = filterTypes.size > 0
    ? `${filteredReleases.length.toLocaleString()} of ${releases.length.toLocaleString()} releases`
    : `${releases.length.toLocaleString()} releases in ${selectedYear}`;

  panel.innerHTML = `
    <div class="bma-releases-nav">
      <select id="bma-releases-year">
        ${years.map((y) => `<option value="${y}"${y === selectedYear ? ' selected' : ''}>${y}</option>`).join('')}
      </select>
      <button class="bma-export-btn" id="bma-export-releases">Copy as Text</button>
      <span class="bma-releases-summary">${summaryText}</span>
    </div>
    <div class="bma-releases-filters">
      ${sortedTypes.map(([type, count]) => `
        <div class="bma-release-type-filter${filterTypes.has(type) ? ' active' : ''}" data-type="${type}">
          <span class="count">${count}</span>
          <span class="label">${type}</span>
        </div>
      `).join('')}
    </div>
    <div class="bma-releases-container">
      ${sortedMonths.length === 0 ? '<div style="color: #888; padding: 20px 0;">No releases match the selected filters</div>' : ''}
      ${sortedMonths.map((month) => `
        <div class="bma-releases-month">
          <div class="bma-releases-month-header">${monthNames[month]} ${selectedYear}</div>
          ${byMonth.get(month)!.map((r) => `
            <div class="bma-release-item">
              <div class="bma-release-date">${r.day ? monthNames[r.month].slice(0, 3) + ' ' + r.day : ''}</div>
              <div class="bma-release-band">${r.bandHtml}</div>
              <div class="bma-release-title">${r.albumHtml}</div>
              <div class="bma-release-type">${r.type}</div>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;

  // Re-attach year change handler
  const yearSelect = panel.querySelector('#bma-releases-year') as HTMLSelectElement;
  yearSelect?.addEventListener('change', () => {
    releasesState.selectedYear = parseInt(yearSelect.value);
    releasesState.isLoaded = false;
    releasesState.filterTypes.clear();
    loadReleases(document.querySelector('.bma-controls') as HTMLElement, countryCode);
  });

  // Type filter handlers
  panel.querySelectorAll('.bma-release-type-filter').forEach((el) => {
    el.addEventListener('click', () => {
      const type = el.getAttribute('data-type');
      if (!type) return;

      if (releasesState.filterTypes.has(type)) {
        releasesState.filterTypes.delete(type);
      } else {
        releasesState.filterTypes.add(type);
      }

      renderReleases(panel);
    });
  });

  // Export button handler
  const exportBtn = panel.querySelector('#bma-export-releases') as HTMLButtonElement;
  exportBtn?.addEventListener('click', () => {
    const text = formatReleasesAsText(filteredReleases, selectedYear, sortedMonths, byMonth, monthNames, countryCode);
    navigator.clipboard.writeText(text).then(() => {
      exportBtn.textContent = 'Copied!';
      exportBtn.classList.add('copied');
      setTimeout(() => {
        exportBtn.textContent = 'Copy as Text';
        exportBtn.classList.remove('copied');
      }, 2000);
    });
  });
}

function formatReleasesAsText(
  releases: ReleaseData[],
  year: number,
  sortedMonths: number[],
  byMonth: Map<number, ReleaseData[]>,
  monthNames: string[],
  countryCode: string
): string {
  const lines: string[] = [];

  lines.push(`${countryCode} Metal Releases - ${year} (${releases.length})`);
  lines.push('');

  for (const month of sortedMonths) {
    const monthReleases = byMonth.get(month)!;
    lines.push(`${monthNames[month]} (${monthReleases.length})`);

    for (const r of monthReleases) {
      const date = r.day ? `${monthNames[r.month].slice(0, 3)} ${r.day}` : '';
      const datePart = date ? ` - ${date}` : '';
      lines.push(`  ${r.bandName} - ${r.albumName} (${r.type})${datePart}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

async function loadAllData(countryCode: string, controls: HTMLElement, resultsContainer: HTMLElement) {
  const loadingEl = controls.querySelector('.bma-loading');

  try {
    const bands = await fetchAllBands(countryCode, (loaded, total) => {
      if (loadingEl) {
        (loadingEl as HTMLElement).textContent = `Loading bands... ${loaded.toLocaleString()} / ${total.toLocaleString()}`;
      }
    });

    // Hide loading
    if (loadingEl) (loadingEl as HTMLElement).style.display = 'none';

    appState.allBands = bands;
    appState.filteredBands = bands;

    // Initial render of stats
    renderStats(controls, resultsContainer);
  } catch (error) {
    console.error('[BMA] Failed to load data:', error);
    if (loadingEl) {
      (loadingEl as HTMLElement).textContent = 'Failed to load data';
      (loadingEl as HTMLElement).style.color = '#f87171';
    }
  }
}

function renderStats(controls: HTMLElement, resultsContainer: HTMLElement) {
  const { allBands, filteredBands, filterStatuses, filterGenres, filterLocations } = appState;
  const hasFilters = filterStatuses.size > 0 || filterGenres.size > 0 || filterLocations.size > 0 || appState.filterText;

  // Calculate counts based on filtered data (excluding the filter type being counted)
  // For status: count from bands filtered by genres + locations + text only
  const bandsForStatusCount = allBands.filter((band) => {
    const textMatch = !appState.filterText ||
      band.name.toLowerCase().includes(appState.filterText) ||
      band.genre.toLowerCase().includes(appState.filterText) ||
      band.location.toLowerCase().includes(appState.filterText);
    const genreMatch = bandMatchesGenreFilter(band, filterGenres);
    const locationMatch = bandMatchesLocationFilter(band, filterLocations);
    return textMatch && genreMatch && locationMatch;
  });

  // For genres: count from bands filtered by statuses + locations + text only
  const bandsForGenreCount = allBands.filter((band) => {
    const textMatch = !appState.filterText ||
      band.name.toLowerCase().includes(appState.filterText) ||
      band.genre.toLowerCase().includes(appState.filterText) ||
      band.location.toLowerCase().includes(appState.filterText);
    const statusMatch = filterStatuses.size === 0 ||
      filterStatuses.has(band.statusNormalized);
    const locationMatch = bandMatchesLocationFilter(band, filterLocations);
    return textMatch && statusMatch && locationMatch;
  });

  // For locations: count from bands filtered by statuses + genres + text only
  const bandsForLocationCount = allBands.filter((band) => {
    const textMatch = !appState.filterText ||
      band.name.toLowerCase().includes(appState.filterText) ||
      band.genre.toLowerCase().includes(appState.filterText) ||
      band.location.toLowerCase().includes(appState.filterText);
    const statusMatch = filterStatuses.size === 0 ||
      filterStatuses.has(band.statusNormalized);
    const genreMatch = bandMatchesGenreFilter(band, filterGenres);
    return textMatch && statusMatch && genreMatch;
  });

  const statusCounts = countStatuses(bandsForStatusCount);
  const topGenres = getTopGenres(bandsForGenreCount, 30);
  const topLocations = getTopLocations(bandsForLocationCount, 30);

  // Render status stats
  const statusStatsEl = controls.querySelector('.bma-status-stats');
  if (statusStatsEl) {
    statusStatsEl.innerHTML = `
      <div class="bma-stats-title">Status</div>
      <div class="bma-stats-row">
        <div class="bma-stat total">
          <span class="bma-stat-value">${(hasFilters ? filteredBands.length : allBands.length).toLocaleString()}</span>
          <span class="bma-stat-label">total</span>
        </div>
        <div class="bma-stat${filterStatuses.has('active') ? ' active' : ''}" data-status="active">
          <span class="bma-stat-value">${statusCounts.active.toLocaleString()}</span>
          <span class="bma-stat-label">active</span>
        </div>
        <div class="bma-stat${filterStatuses.has('split-up') ? ' active' : ''}" data-status="split-up">
          <span class="bma-stat-value">${statusCounts['split-up'].toLocaleString()}</span>
          <span class="bma-stat-label">split-up</span>
        </div>
        <div class="bma-stat${filterStatuses.has('on-hold') ? ' active' : ''}" data-status="on-hold">
          <span class="bma-stat-value">${statusCounts['on-hold'].toLocaleString()}</span>
          <span class="bma-stat-label">on hold</span>
        </div>
        <div class="bma-stat${filterStatuses.has('changed-name') ? ' active' : ''}" data-status="changed-name">
          <span class="bma-stat-value">${statusCounts['changed-name'].toLocaleString()}</span>
          <span class="bma-stat-label">changed</span>
        </div>
        <div class="bma-stat${filterStatuses.has('unknown') ? ' active' : ''}" data-status="unknown">
          <span class="bma-stat-value">${statusCounts.unknown.toLocaleString()}</span>
          <span class="bma-stat-label">unknown</span>
        </div>
      </div>
    `;

    // Add click handlers for status stats
    statusStatsEl.querySelectorAll('.bma-stat[data-status]').forEach((el) => {
      el.addEventListener('click', () => {
        const status = el.getAttribute('data-status');
        if (!status) return;

        if (appState.filterStatuses.has(status)) {
          appState.filterStatuses.delete(status);
        } else {
          appState.filterStatuses.add(status);
        }

        appState.currentPage = 0;
        appState.filteredBands = applyFilters();
        updateFilterCount();
        renderStats(controls, resultsContainer);
        renderFilteredResults(resultsContainer);
      });
    });
  }

  // Render genre stats
  const genreStatsEl = controls.querySelector('.bma-genre-stats');
  if (genreStatsEl && topGenres.length > 0) {
    genreStatsEl.innerHTML = `
      <div class="bma-stats-title">Top Genres</div>
      <div class="bma-stats-row">
        ${topGenres.map((g) => `
          <div class="bma-stat${filterGenres.has(g.genre) ? ' active' : ''}" data-genre="${g.genre}">
            <span class="bma-stat-value">${g.count.toLocaleString()}</span>
            <span class="bma-stat-label">${g.genre}</span>
          </div>
        `).join('')}
      </div>
    `;

    // Add click handlers for genre stats
    genreStatsEl.querySelectorAll('.bma-stat[data-genre]').forEach((el) => {
      el.addEventListener('click', () => {
        const genre = el.getAttribute('data-genre');
        if (!genre) return;

        if (appState.filterGenres.has(genre)) {
          appState.filterGenres.delete(genre);
        } else {
          appState.filterGenres.add(genre);
        }

        appState.currentPage = 0;
        appState.filteredBands = applyFilters();
        updateFilterCount();
        renderStats(controls, resultsContainer);
        renderFilteredResults(resultsContainer);
      });
    });
  }

  // Render location stats
  const locationStatsEl = controls.querySelector('.bma-location-stats');
  if (locationStatsEl && topLocations.length > 0) {
    locationStatsEl.innerHTML = `
      <div class="bma-stats-title">Top Locations</div>
      <div class="bma-stats-row">
        ${topLocations.map((loc) => `
          <div class="bma-stat${filterLocations.has(loc.location) ? ' active' : ''}${loc.isNoLocation ? ' no-location' : ''}" data-location="${loc.location}">
            <span class="bma-stat-value">${loc.count.toLocaleString()}</span>
            <span class="bma-stat-label">${loc.isNoLocation ? 'No location' : loc.location}</span>
          </div>
        `).join('')}
      </div>
    `;

    // Add click handlers for location stats
    locationStatsEl.querySelectorAll('.bma-stat[data-location]').forEach((el) => {
      el.addEventListener('click', () => {
        const location = el.getAttribute('data-location');
        if (!location) return;

        if (appState.filterLocations.has(location)) {
          appState.filterLocations.delete(location);
        } else {
          appState.filterLocations.add(location);
        }

        appState.currentPage = 0;
        appState.filteredBands = applyFilters();
        updateFilterCount();
        renderStats(controls, resultsContainer);
        renderFilteredResults(resultsContainer);
      });
    });
  }
}

function setupFilterLogic(controls: HTMLElement, resultsContainer: HTMLElement) {
  const input = document.getElementById('bma-filter-input') as HTMLInputElement;

  if (!input) return;

  // Debounce for text input
  let debounceTimer: number;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      appState.filterText = input.value.toLowerCase();
      appState.currentPage = 0;
      appState.filteredBands = applyFilters();
      updateFilterCount();
      renderStats(controls, resultsContainer);
      renderFilteredResults(resultsContainer);
    }, 150);
  });
}

// ============================================
// Label Country Page Functions
// ============================================

async function fetchAllLabels(countryCode: string, onProgress?: (loaded: number, total: number) => void): Promise<LabelData[]> {
  const labels: LabelData[] = [];
  let start = 0;
  const pageSize = 500;
  let total = Infinity;

  while (start < total) {
    const url = `https://www.metal-archives.com/label/ajax-list/c/${countryCode}/json/1?sEcho=1&iDisplayStart=${start}&iDisplayLength=${pageSize}`;

    const response = await fetch(url);
    const data = await response.json();

    total = data.iTotalRecords;

    for (const row of data.aaData) {
      // Row format: [edit_link, name_html, specialisation, status_html, website_html, online_shopping_html]
      const nameMatch = row[1].match(/>([^<]+)</);
      const name = nameMatch ? nameMatch[1] : row[1];

      // Extract status text from the span
      const statusMatch = row[3].match(/>([^<]+)</);
      const status = statusMatch ? statusMatch[1] : row[3];

      labels.push({
        name,
        nameHtml: row[1],
        specialisation: row[2]?.replace(/&nbsp;/g, '').trim() || '',
        status,
        statusNormalized: normalizeStatus(status),
        hasWebsite: row[4]?.includes('href') || false,
        hasOnlineShopping: row[5]?.includes('ui-icon-check') || false,
      });
    }

    start += pageSize;
    onProgress?.(Math.min(start, total), total);
  }

  return labels;
}

function getTopSpecialisations(labels: LabelData[], limit = 30): Array<{ specialisation: string; count: number }> {
  const specCounts = new Map<string, number>();

  for (const label of labels) {
    if (!label.specialisation) continue;
    const parts = parseGenreParts(label.specialisation);
    for (const part of parts) {
      specCounts.set(part, (specCounts.get(part) || 0) + 1);
    }
  }

  return Array.from(specCounts.entries())
    .map(([specialisation, count]) => ({ specialisation, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function labelMatchesSpecialisationFilter(label: LabelData, filterSpecs: Set<string>): boolean {
  if (filterSpecs.size === 0) return true;
  const labelSpecs = parseGenreParts(label.specialisation);
  return labelSpecs.some(s => filterSpecs.has(s));
}

function applyLabelFilters(): LabelData[] {
  const { allLabels, filterText, filterStatuses, filterSpecialisations } = labelState;

  return allLabels.filter((label) => {
    // Text filter
    const textMatch = !filterText ||
      label.name.toLowerCase().includes(filterText) ||
      label.specialisation.toLowerCase().includes(filterText);

    // Status filter (OR within statuses)
    const statusMatch = filterStatuses.size === 0 ||
      filterStatuses.has(label.statusNormalized);

    // Specialisation filter (OR within specialisations)
    const specMatch = labelMatchesSpecialisationFilter(label, filterSpecialisations);

    return textMatch && statusMatch && specMatch;
  });
}

function renderLabelFilteredResults(container: HTMLElement) {
  const { filteredLabels, currentPage, pageSize, filterText, filterStatuses, filterSpecialisations } = labelState;
  const isFiltering = filterText || filterStatuses.size > 0 || filterSpecialisations.size > 0;

  if (!isFiltering) {
    container.classList.remove('visible');
    document.querySelector('#labelListCountry_wrapper')?.classList.remove('bma-original-hidden');
    return;
  }

  container.classList.add('visible');
  document.querySelector('#labelListCountry_wrapper')?.classList.add('bma-original-hidden');

  const totalPages = Math.ceil(filteredLabels.length / pageSize);
  const startIdx = currentPage * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filteredLabels.length);
  const pageLabels = filteredLabels.slice(startIdx, endIdx);

  // Build active filters display
  const activeFilters: string[] = [];
  if (filterSpecialisations.size > 0) activeFilters.push(`Specialisation: ${Array.from(filterSpecialisations).join(' or ')}`);
  if (filterStatuses.size > 0) activeFilters.push(`Status: ${Array.from(filterStatuses).join(' or ')}`);
  if (filterText) activeFilters.push(`"${filterText}"`);
  const filtersDisplay = activeFilters.length > 0 ? ` — ${activeFilters.join(' + ')}` : '';

  container.innerHTML = `
    <div class="bma-results-info">
      Showing ${startIdx + 1}-${endIdx} of ${filteredLabels.length.toLocaleString()} results${filtersDisplay}
      <span class="bma-clear-filter">[Clear all filters]</span>
    </div>
    <table id="bma-filtered-table" class="display">
      <thead>
        <tr>
          <th>Name</th>
          <th>Specialisation</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${pageLabels.map((label, idx) => `
          <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
            <td>${label.nameHtml}</td>
            <td>${label.specialisation || ''}</td>
            <td><span class="${label.statusNormalized}">${label.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${totalPages > 1 ? `
      <div class="bma-pagination">
        <button class="bma-page-btn" data-page="prev" ${currentPage === 0 ? 'disabled' : ''}>Prev</button>
        ${generatePageButtons(currentPage, totalPages)}
        <button class="bma-page-btn" data-page="next" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>Next</button>
      </div>
    ` : ''}
  `;

  // Clear filter handler
  container.querySelector('.bma-clear-filter')?.addEventListener('click', () => {
    labelState.filterText = '';
    labelState.filterStatuses.clear();
    labelState.filterSpecialisations.clear();
    labelState.currentPage = 0;

    const input = document.getElementById('bma-label-filter-input') as HTMLInputElement;
    if (input) input.value = '';

    document.querySelectorAll('.bma-stat').forEach((t) => t.classList.remove('active'));
    updateLabelFilterCount();
    labelState.filteredLabels = applyLabelFilters();
    renderLabelFilteredResults(container);
  });

  // Pagination handlers
  container.querySelectorAll('.bma-page-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-page');
      if (page === 'prev' && labelState.currentPage > 0) {
        labelState.currentPage--;
      } else if (page === 'next' && labelState.currentPage < totalPages - 1) {
        labelState.currentPage++;
      } else if (page !== 'prev' && page !== 'next') {
        labelState.currentPage = parseInt(page!, 10);
      }
      renderLabelFilteredResults(container);
    });
  });
}

function updateLabelFilterCount() {
  const countEl = document.querySelector('.bma-filter-count');
  if (countEl) {
    const { filteredLabels, allLabels, filterText, filterStatuses, filterSpecialisations } = labelState;
    const hasFilters = filterText || filterStatuses.size > 0 || filterSpecialisations.size > 0;
    if (hasFilters) {
      countEl.textContent = `${filteredLabels.length.toLocaleString()} / ${allLabels.length.toLocaleString()}`;
    } else {
      countEl.textContent = '';
    }
  }
}

function initLabelCountryPage() {
  const pathParts = window.location.pathname.split('/');
  const countryCode = pathParts[pathParts.length - 1] || '';

  // Create controls container
  const controls = document.createElement('div');
  controls.className = 'bma-controls';
  controls.innerHTML = `
    <div class="bma-controls-header">Better Metal Archives</div>
    <div class="bma-loading">Loading all labels...</div>
    <div class="bma-stats-section bma-status-stats"></div>
    <div class="bma-stats-section bma-specialisation-stats"></div>
    <div class="bma-filter-row">
      <input type="text" class="bma-filter-input" placeholder="Search by name..." id="bma-label-filter-input">
      <span class="bma-filter-count"></span>
    </div>
  `;

  // Create results container
  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'bma-results-container';

  // Wait for the table to load and insert controls above it
  const observer = new MutationObserver(() => {
    const tableWrapper = document.querySelector('#labelListCountry_wrapper');
    if (tableWrapper && !document.querySelector('.bma-controls.visible')) {
      tableWrapper.parentElement?.insertBefore(controls, tableWrapper);
      tableWrapper.parentElement?.insertBefore(resultsContainer, tableWrapper);
      controls.classList.add('visible');
      setupLabelFilterLogic(controls, resultsContainer);
      loadAllLabelData(countryCode, controls, resultsContainer);
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

async function loadAllLabelData(countryCode: string, controls: HTMLElement, resultsContainer: HTMLElement) {
  const loadingEl = controls.querySelector('.bma-loading');

  try {
    const labels = await fetchAllLabels(countryCode, (loaded, total) => {
      if (loadingEl) {
        (loadingEl as HTMLElement).textContent = `Loading labels... ${loaded.toLocaleString()} / ${total.toLocaleString()}`;
      }
    });

    // Hide loading
    if (loadingEl) (loadingEl as HTMLElement).style.display = 'none';

    labelState.allLabels = labels;
    labelState.filteredLabels = labels;

    // Initial render of stats
    renderLabelStats(controls, resultsContainer);
  } catch (error) {
    console.error('[BMA] Failed to load label data:', error);
    if (loadingEl) {
      (loadingEl as HTMLElement).textContent = 'Failed to load data';
      (loadingEl as HTMLElement).style.color = '#f87171';
    }
  }
}

function renderLabelStats(controls: HTMLElement, resultsContainer: HTMLElement) {
  const { allLabels, filteredLabels, filterStatuses, filterSpecialisations } = labelState;
  const hasFilters = filterStatuses.size > 0 || filterSpecialisations.size > 0 || labelState.filterText;

  // Calculate counts based on filtered data (excluding the filter type being counted)
  const labelsForStatusCount = allLabels.filter((label) => {
    const textMatch = !labelState.filterText ||
      label.name.toLowerCase().includes(labelState.filterText) ||
      label.specialisation.toLowerCase().includes(labelState.filterText);
    const specMatch = labelMatchesSpecialisationFilter(label, filterSpecialisations);
    return textMatch && specMatch;
  });

  const labelsForSpecCount = allLabels.filter((label) => {
    const textMatch = !labelState.filterText ||
      label.name.toLowerCase().includes(labelState.filterText) ||
      label.specialisation.toLowerCase().includes(labelState.filterText);
    const statusMatch = filterStatuses.size === 0 ||
      filterStatuses.has(label.statusNormalized);
    return textMatch && statusMatch;
  });

  const statusCounts = countStatuses(labelsForStatusCount);
  const topSpecs = getTopSpecialisations(labelsForSpecCount, 30);

  // Render status stats
  const statusStatsEl = controls.querySelector('.bma-status-stats');
  if (statusStatsEl) {
    statusStatsEl.innerHTML = `
      <div class="bma-stats-title">Status</div>
      <div class="bma-stats-row">
        <div class="bma-stat total">
          <span class="bma-stat-value">${(hasFilters ? filteredLabels.length : allLabels.length).toLocaleString()}</span>
          <span class="bma-stat-label">total</span>
        </div>
        <div class="bma-stat${filterStatuses.has('active') ? ' active' : ''}" data-status="active">
          <span class="bma-stat-value">${statusCounts.active.toLocaleString()}</span>
          <span class="bma-stat-label">active</span>
        </div>
        <div class="bma-stat${filterStatuses.has('closed') ? ' active' : ''}" data-status="closed">
          <span class="bma-stat-value">${statusCounts.closed.toLocaleString()}</span>
          <span class="bma-stat-label">closed</span>
        </div>
        <div class="bma-stat${filterStatuses.has('on-hold') ? ' active' : ''}" data-status="on-hold">
          <span class="bma-stat-value">${statusCounts['on-hold'].toLocaleString()}</span>
          <span class="bma-stat-label">on hold</span>
        </div>
        <div class="bma-stat${filterStatuses.has('unknown') ? ' active' : ''}" data-status="unknown">
          <span class="bma-stat-value">${statusCounts.unknown.toLocaleString()}</span>
          <span class="bma-stat-label">unknown</span>
        </div>
      </div>
    `;

    // Add click handlers for status stats
    statusStatsEl.querySelectorAll('.bma-stat[data-status]').forEach((el) => {
      el.addEventListener('click', () => {
        const status = el.getAttribute('data-status');
        if (!status) return;

        if (labelState.filterStatuses.has(status)) {
          labelState.filterStatuses.delete(status);
        } else {
          labelState.filterStatuses.add(status);
        }

        labelState.currentPage = 0;
        labelState.filteredLabels = applyLabelFilters();
        updateLabelFilterCount();
        renderLabelStats(controls, resultsContainer);
        renderLabelFilteredResults(resultsContainer);
      });
    });
  }

  // Render specialisation stats
  const specStatsEl = controls.querySelector('.bma-specialisation-stats');
  if (specStatsEl && topSpecs.length > 0) {
    specStatsEl.innerHTML = `
      <div class="bma-stats-title">Top Specialisations</div>
      <div class="bma-stats-row">
        ${topSpecs.map((s) => `
          <div class="bma-stat${filterSpecialisations.has(s.specialisation) ? ' active' : ''}" data-genre="${s.specialisation}">
            <span class="bma-stat-value">${s.count.toLocaleString()}</span>
            <span class="bma-stat-label">${s.specialisation}</span>
          </div>
        `).join('')}
      </div>
    `;

    // Add click handlers for specialisation stats
    specStatsEl.querySelectorAll('.bma-stat[data-genre]').forEach((el) => {
      el.addEventListener('click', () => {
        const spec = el.getAttribute('data-genre');
        if (!spec) return;

        if (labelState.filterSpecialisations.has(spec)) {
          labelState.filterSpecialisations.delete(spec);
        } else {
          labelState.filterSpecialisations.add(spec);
        }

        labelState.currentPage = 0;
        labelState.filteredLabels = applyLabelFilters();
        updateLabelFilterCount();
        renderLabelStats(controls, resultsContainer);
        renderLabelFilteredResults(resultsContainer);
      });
    });
  }
}

function setupLabelFilterLogic(controls: HTMLElement, resultsContainer: HTMLElement) {
  const input = document.getElementById('bma-label-filter-input') as HTMLInputElement;

  if (!input) return;

  // Debounce for text input
  let debounceTimer: number;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      labelState.filterText = input.value.toLowerCase();
      labelState.currentPage = 0;
      labelState.filteredLabels = applyLabelFilters();
      updateLabelFilterCount();
      renderLabelStats(controls, resultsContainer);
      renderLabelFilteredResults(resultsContainer);
    }, 150);
  });
}

// Band hover preview functionality
const previewCache = new Map<string, BandPreviewData>();
let previewElement: HTMLElement | null = null;
let previewTimeout: number | null = null;
let currentPreviewUrl: string | null = null;

interface AlbumData {
  name: string;
  type: string;
  year: string;
}

interface BandPreviewData {
  name: string;
  genre: string;
  country: string;
  location: string;
  status: string;
  formedIn: string;
  yearsActive: string;
  lyricalThemes: string;
  labelName: string;
  logoUrl?: string;
  photoUrl?: string;
  albums: AlbumData[];
}

function initBandPreview() {
  // Create preview element
  previewElement = document.createElement('div');
  previewElement.className = 'bma-preview';
  previewElement.style.display = 'none';
  document.body.appendChild(previewElement);

  // Attach listeners to existing and future band links
  attachBandLinkListeners();

  // Watch for new band links being added to the DOM
  const observer = new MutationObserver(() => {
    attachBandLinkListeners();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

const processedLinks = new WeakSet<HTMLElement>();

function attachBandLinkListeners() {
  const links = document.querySelectorAll('a[href*="/bands/"]');
  links.forEach((link) => {
    if (processedLinks.has(link as HTMLElement)) return;
    processedLinks.add(link as HTMLElement);

    link.addEventListener('mouseenter', (e) => {
      const href = link.getAttribute('href');
      if (!href) return;

      currentPreviewUrl = href;

      if (previewTimeout) {
        clearTimeout(previewTimeout);
      }

      previewTimeout = window.setTimeout(() => {
        showPreview(href, e as MouseEvent);
      }, 300);
    });

    link.addEventListener('mouseleave', () => {
      if (previewTimeout) {
        clearTimeout(previewTimeout);
        previewTimeout = null;
      }
      currentPreviewUrl = null;
      hidePreview();
    });

    link.addEventListener('mousemove', (e) => {
      updatePreviewPosition(e as MouseEvent);
    });
  });
}

function hidePreview() {
  if (previewElement) {
    previewElement.style.display = 'none';
    previewElement.innerHTML = '';
  }
}

function updatePreviewPosition(e: MouseEvent) {
  if (!previewElement || previewElement.style.display === 'none') return;

  const padding = 15;
  let x = e.clientX + padding;
  let y = e.clientY + padding;

  // Keep preview within viewport
  const rect = previewElement.getBoundingClientRect();
  if (x + rect.width > window.innerWidth) {
    x = e.clientX - rect.width - padding;
  }
  if (y + rect.height > window.innerHeight) {
    y = e.clientY - rect.height - padding;
  }

  previewElement.style.left = `${x}px`;
  previewElement.style.top = `${y}px`;
}

async function showPreview(href: string, e: MouseEvent) {
  if (!previewElement) return;

  // Bail if we've already moved away
  if (currentPreviewUrl !== href) return;

  // Show loading state
  previewElement.innerHTML = `<div class="bma-preview-loading">Loading...</div>`;
  previewElement.style.display = 'flex';
  updatePreviewPosition(e);

  // Check cache first
  if (previewCache.has(href)) {
    if (currentPreviewUrl === href) {
      renderPreview(previewCache.get(href)!);
    }
    return;
  }

  try {
    // Fetch band page
    const fullUrl = href.startsWith('http') ? href : `https://www.metal-archives.com${href}`;
    const response = await fetch(fullUrl);

    // Check if we moved away during fetch
    if (currentPreviewUrl !== href) return;

    const html = await response.text();

    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract band ID for discography fetch
    const bandIdMatch = href.match(/\/bands\/[^\/]+\/(\d+)/);
    const bandId = bandIdMatch ? bandIdMatch[1] : null;

    let albums: AlbumData[] = [];
    if (bandId) {
      albums = await fetchDiscography(bandId);
    }

    // Check again after discography fetch
    if (currentPreviewUrl !== href) return;

    const data = extractBandData(doc, albums);
    previewCache.set(href, data);

    // Only render if still hovering same link
    if (currentPreviewUrl === href) {
      renderPreview(data);
    }
  } catch (error) {
    console.error('[BMA] Failed to load preview:', error);
    if (previewElement && currentPreviewUrl === href) {
      previewElement.innerHTML = `<div class="bma-preview-loading">Failed to load</div>`;
    }
  }
}

async function fetchDiscography(bandId: string): Promise<AlbumData[]> {
  try {
    const url = `https://www.metal-archives.com/band/discography/id/${bandId}/tab/all`;
    const response = await fetch(url);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const albums: AlbumData[] = [];
    const rows = doc.querySelectorAll('tbody tr');

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        const name = cells[0].textContent?.trim() || '';
        const type = cells[1].textContent?.trim() || '';
        const year = cells[2].textContent?.trim() || '';
        if (name) {
          albums.push({ name, type, year });
        }
      }
    });

    // Return last 5 albums (most recent)
    return albums.slice(-5).reverse();
  } catch (error) {
    console.error('[BMA] Failed to fetch discography:', error);
    return [];
  }
}

function extractBandData(doc: Document, albums: AlbumData[]): BandPreviewData {
  const name = doc.querySelector('.band_name a')?.textContent?.trim() || 'Unknown';

  // Extract stats by finding dt labels and their corresponding dd values
  const statsContainer = doc.querySelector('#band_stats');
  let genre = '';
  let country = '';
  let location = '';
  let status = '';
  let formedIn = '';
  let yearsActive = '';
  let lyricalThemes = '';

  let labelName = '';

  if (statsContainer) {
    const dts = statsContainer.querySelectorAll('dt');
    dts.forEach((dt) => {
      const dtLabel = dt.textContent?.trim().toLowerCase() || '';
      const dd = dt.nextElementSibling as HTMLElement;
      const value = dd?.textContent?.trim() || '';

      if (dtLabel.includes('country')) country = value;
      else if (dtLabel.includes('location')) location = value;
      else if (dtLabel.includes('status')) status = value;
      else if (dtLabel.includes('formed')) formedIn = value;
      else if (dtLabel.includes('genre')) genre = value;
      else if (dtLabel.includes('lyrical') || dtLabel.includes('themes')) lyricalThemes = value;
      else if (dtLabel.includes('years active')) yearsActive = value;
      else if (dtLabel.includes('current label') || (dtLabel.includes('label') && !dtLabel.includes('lyrical'))) labelName = value;
    });
  }

  // Try to get logo
  const logoImg = doc.querySelector('#logo img') as HTMLImageElement;
  const logoUrl = logoImg?.src;

  // Try to get photo
  const photoImg = doc.querySelector('#photo img') as HTMLImageElement;
  const photoUrl = photoImg?.src;

  return { name, genre, country, location, status, formedIn, yearsActive, lyricalThemes, labelName, logoUrl, photoUrl, albums };
}

function renderPreview(data: BandPreviewData) {
  if (!previewElement) return;

  const statusClass = normalizeStatus(data.status);

  const albumsHtml = data.albums.length > 0 ? `
    <div class="bma-preview-albums">
      <div class="bma-preview-albums-title">Latest releases</div>
      ${data.albums.map((album) => `
        <div class="bma-preview-album">
          <span class="bma-preview-album-name">${album.name}</span>
          <span class="bma-preview-album-info">${album.type} (${album.year})</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  previewElement.innerHTML = `
    <div class="bma-preview-main">
      <div class="bma-preview-header">
        <div class="bma-preview-logo">
          ${data.logoUrl ? `<img src="${data.logoUrl}" alt="Logo">` : '<div class="bma-preview-no-logo">🎸</div>'}
        </div>
        <div class="bma-preview-info">
          <div class="bma-preview-name">${data.name}</div>
          <div class="bma-preview-genre">${data.genre || 'Unknown genre'}</div>
          <div class="bma-preview-location">${data.location}${data.country ? `, ${data.country}` : ''}</div>
          <span class="bma-preview-status ${statusClass}">${data.status || 'Unknown'}</span>
        </div>
      </div>
      <div class="bma-preview-meta">
        ${data.formedIn ? `
        <div class="bma-preview-meta-item">
          <span class="bma-preview-meta-value">${data.formedIn}</span>
          <span class="bma-preview-meta-label">Formed</span>
        </div>
        ` : ''}
        ${data.labelName ? `
        <div class="bma-preview-meta-item">
          <span class="bma-preview-meta-value">${data.labelName}</span>
          <span class="bma-preview-meta-label">Label</span>
        </div>
        ` : ''}
        ${data.lyricalThemes ? `
        <div class="bma-preview-meta-item">
          <span class="bma-preview-meta-value">${data.lyricalThemes}</span>
          <span class="bma-preview-meta-label">Lyrical Themes</span>
        </div>
        ` : ''}
      </div>
      ${albumsHtml}
    </div>
    ${data.photoUrl ? `<div class="bma-preview-photo"><img src="${data.photoUrl}" alt="Photo"></div>` : ''}
  `;
}

// Initialize band preview will be called from main()
