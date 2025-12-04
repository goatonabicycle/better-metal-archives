export default defineContentScript({
  matches: ['https://www.metal-archives.com/*'],
  runAt: 'document_start',

  async main() {
    // Inject script into page context to intercept XHR/fetch
    const script = document.createElement('script');
    script.src = browser.runtime.getURL('/injected.js');
    script.onload = () => script.remove();
    document.documentElement.appendChild(script);

    // Wait for DOM to be ready before adding UI elements
    if (document.readyState === 'loading') {
      await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve));
    }

    const style = document.createElement('style');
    style.textContent = `
      #better-metal-archives-debug {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border: 1px solid #444;
        border-radius: 8px;
        padding: 0;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        color: #e0e0e0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        min-width: 220px;
        overflow: hidden;
      }

      #better-metal-archives-debug .bma-header {
        background: linear-gradient(135deg, #8b0000 0%, #a00000 100%);
        color: #fff;
        padding: 10px 14px;
        font-weight: 600;
        font-size: 14px;
        letter-spacing: 0.3px;
      }

      #better-metal-archives-debug .bma-content {
        padding: 12px 14px;
      }

      #better-metal-archives-debug .bma-info {
        color: #4ade80;
        margin-bottom: 6px;
      }

      #better-metal-archives-debug .bma-url {
        color: #888;
        font-size: 11px;
        word-break: break-all;
      }

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

      .bma-summary {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
      }

      .bma-stat {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        background: #1a1a1a;
        border: 1px solid #333;
        font-size: 11px;
      }

      .bma-stat-value {
        font-weight: bold;
      }

      .bma-stat-label {
        color: #999;
      }

      .bma-stat.active .bma-stat-value { color: #6c6; }
      .bma-stat.split-up .bma-stat-value { color: #c66; }
      .bma-stat.on-hold .bma-stat-value { color: #cc6; }
      .bma-stat.changed-name .bma-stat-value { color: #69c; }
      .bma-stat.unknown .bma-stat-value { color: #888; }
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
        padding-top: 8px;
        border-top: 1px solid #333;
      }

      .bma-filter-input {
        background: #1a1a1a;
        border: 1px solid #444;
        color: #ddd;
        padding: 4px 8px;
        font-size: 11px;
        width: 200px;
      }

      .bma-filter-input:focus {
        outline: none;
        border-color: #666;
        background: #222;
      }

      .bma-filter-input::placeholder {
        color: #666;
      }

      .bma-filter-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .bma-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        background: #333;
        border: 1px solid #444;
        color: #ccc;
        font-size: 10px;
        cursor: pointer;
      }

      .bma-tag:hover {
        background: #444;
        color: #fff;
      }

      .bma-tag.active {
        background: #2a4a2a;
        border-color: #4a6a4a;
        color: #6c6;
      }

      .bma-filter-count {
        color: #888;
        font-size: 11px;
        margin-left: auto;
      }

      .bma-locations {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding-top: 8px;
        border-top: 1px solid #333;
      }

      .bma-locations-title {
        font-size: 10px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        width: 100%;
        margin-bottom: 2px;
      }

      .bma-location {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        background: #1a1a1a;
        border: 1px solid #333;
        font-size: 10px;
        color: #aaa;
        cursor: pointer;
        transition: all 0.15s;
      }

      .bma-location:hover {
        background: #252525;
        border-color: #444;
        color: #fff;
      }

      .bma-location.active {
        background: #2a2a3a;
        border-color: #69c;
        color: #fff;
      }

      .bma-location-count {
        color: #666;
      }

      .bma-genres {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding-top: 8px;
        border-top: 1px solid #333;
      }

      .bma-genres-title {
        font-size: 10px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        width: 100%;
        margin-bottom: 2px;
      }

      .bma-genre {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        background: #1a1a1a;
        border: 1px solid #333;
        font-size: 10px;
        color: #c9a;
        cursor: pointer;
        transition: all 0.15s;
      }

      .bma-genre:hover {
        background: #252525;
        border-color: #444;
        color: #ebc;
      }

      .bma-genre.active {
        background: #3a2a3a;
        border-color: #c9a;
        color: #ebc;
      }

      .bma-genre-count {
        color: #666;
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

      /* Table links */
      .bma-table-link {
        display: inline-block;
        font-size: 14px;
        text-decoration: none;
        margin-right: 4px;
        opacity: 0.8;
        transition: opacity 0.15s;
      }

      .bma-table-link:hover {
        opacity: 1;
      }

      .bma-links-loading {
        color: #666;
        font-size: 11px;
      }

      .bma-links-cell {
        white-space: nowrap;
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
    `;
    document.head.appendChild(style);

    // Check if we're on a country list page
    const isCountryListPage = /^\/lists\/[A-Z]{2}$/.test(window.location.pathname);

    if (isCountryListPage) {
      initCountryListPage();
    }

    // Initialize band hover preview on all pages
    initBandPreview();

    // Debug panel
    const debugDiv = document.createElement('div');
    debugDiv.id = 'better-metal-archives-debug';
    debugDiv.innerHTML = `
      <div class="bma-header">Better Metal Archives</div>
      <div class="bma-content">
        <div class="bma-info">Extension loaded</div>
        <div class="bma-url">Page: ${isCountryListPage ? 'Country List' : 'Other'}</div>
      </div>
    `;
    document.body.appendChild(debugDiv);

    console.log('[Better Metal Archives] Content script loaded');
  },
});

interface BandTableLink {
  name: string;
  url: string;
  icon: string;
}

interface BandData {
  name: string;
  nameHtml: string;
  bandUrl: string;
  genre: string;
  location: string;
  status: string;
  statusNormalized: string;
  links?: BandTableLink[];
  linksFetched?: boolean;
}

interface StatusCounts {
  active: number;
  'split-up': number;
  'on-hold': number;
  'changed-name': number;
  unknown: number;
  total: number;
}

// Global state
const appState = {
  allBands: [] as BandData[],
  filteredBands: [] as BandData[],
  filterText: '',
  filterStatuses: new Set<string>(),
  filterGenre: '' as string,
  filterLocation: '' as string,
  currentPage: 0,
  pageSize: 100,
  isFiltering: false,
};

function normalizeStatus(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('active')) return 'active';
  if (s.includes('split')) return 'split-up';
  if (s.includes('hold')) return 'on-hold';
  if (s.includes('changed')) return 'changed-name';
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
      const urlMatch = row[0].match(/href="([^"]+)"/);
      const bandUrl = urlMatch ? urlMatch[1] : '';
      const status = row[3];

      bands.push({
        name,
        nameHtml: row[0],
        bandUrl,
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

function countStatuses(bands: BandData[]): StatusCounts {
  const counts: StatusCounts = {
    active: 0,
    'split-up': 0,
    'on-hold': 0,
    'changed-name': 0,
    unknown: 0,
    total: bands.length,
  };

  for (const band of bands) {
    const status = band.statusNormalized;
    if (status === 'active') counts.active++;
    else if (status === 'split-up') counts['split-up']++;
    else if (status === 'on-hold') counts['on-hold']++;
    else if (status === 'changed-name') counts['changed-name']++;
    else counts.unknown++;
  }

  return counts;
}

function getTopLocations(bands: BandData[], limit = 10): Array<{ location: string; count: number }> {
  const locationCounts = new Map<string, number>();

  for (const band of bands) {
    const location = band.location.trim();
    if (!location) continue;
    locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
  }

  return Array.from(locationCounts.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getTopGenres(bands: BandData[], limit = 10): Array<{ genre: string; count: number }> {
  const genreCounts = new Map<string, number>();

  for (const band of bands) {
    // Normalize genre - extract primary genre keywords
    const genre = band.genre.trim();
    if (!genre) continue;

    // Split on common separators and get primary genres
    const primaryGenres = extractPrimaryGenres(genre);
    for (const g of primaryGenres) {
      genreCounts.set(g, (genreCounts.get(g) || 0) + 1);
    }
  }

  return Array.from(genreCounts.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function extractPrimaryGenres(genreStr: string): string[] {
  // Common metal genre keywords to look for
  const genreKeywords = [
    'Black Metal', 'Death Metal', 'Thrash Metal', 'Heavy Metal', 'Power Metal',
    'Doom Metal', 'Progressive Metal', 'Folk Metal', 'Gothic Metal', 'Symphonic Metal',
    'Melodic Death Metal', 'Melodic Black Metal', 'Technical Death Metal',
    'Brutal Death Metal', 'Atmospheric Black Metal', 'Blackened Death Metal',
    'Grindcore', 'Deathcore', 'Metalcore', 'Speed Metal', 'Sludge Metal',
    'Stoner Metal', 'Post-Metal', 'Industrial Metal', 'Nu-Metal', 'Groove Metal',
    'Viking Metal', 'Pagan Metal', 'Avant-garde Metal', 'Djent',
    'Hard Rock', 'Rock', 'Punk', 'Hardcore'
  ];

  const found: string[] = [];
  const lowerGenre = genreStr.toLowerCase();

  for (const keyword of genreKeywords) {
    if (lowerGenre.includes(keyword.toLowerCase())) {
      found.push(keyword);
      if (found.length >= 2) break; // Limit to 2 genres per band
    }
  }

  // If no matches, try to get first genre before slash/comma
  if (found.length === 0) {
    const firstPart = genreStr.split(/[\/,;]/)[0].trim();
    if (firstPart) {
      found.push(firstPart);
    }
  }

  return found;
}

function applyFilters(): BandData[] {
  const { allBands, filterText, filterStatuses, filterGenre, filterLocation } = appState;

  return allBands.filter((band) => {
    // Text filter (searches name only when genre/location filters are active)
    const textMatch = !filterText ||
      band.name.toLowerCase().includes(filterText) ||
      band.genre.toLowerCase().includes(filterText) ||
      band.location.toLowerCase().includes(filterText);

    // Status filter
    const statusMatch = filterStatuses.size === 0 ||
      filterStatuses.has(band.statusNormalized);

    // Genre filter
    const genreMatch = !filterGenre ||
      band.genre.toLowerCase().includes(filterGenre.toLowerCase());

    // Location filter
    const locationMatch = !filterLocation ||
      band.location.toLowerCase().includes(filterLocation.toLowerCase());

    return textMatch && statusMatch && genreMatch && locationMatch;
  });
}

async function fetchBandLinks(bandUrl: string): Promise<BandTableLink[]> {
  const links: BandTableLink[] = [];

  try {
    const fullUrl = bandUrl.startsWith('http') ? bandUrl : `https://www.metal-archives.com${bandUrl}`;
    const response = await fetch(fullUrl);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const linkPatterns: Array<{ pattern: RegExp; name: string; icon: string }> = [
      { pattern: /bandcamp\.com/i, name: 'Bandcamp', icon: '🎵' },
      { pattern: /spotify\.com/i, name: 'Spotify', icon: '🎧' },
      { pattern: /youtube\.com|youtu\.be/i, name: 'YouTube', icon: '▶️' },
      { pattern: /soundcloud\.com/i, name: 'SoundCloud', icon: '☁️' },
    ];

    const seenUrls = new Set<string>();
    const allLinks = doc.querySelectorAll('a[href]');

    allLinks.forEach((el) => {
      const href = el.getAttribute('href');
      if (!href || seenUrls.has(href)) return;

      for (const { pattern, name, icon } of linkPatterns) {
        if (pattern.test(href)) {
          seenUrls.add(href);
          links.push({ name, url: href, icon });
          break;
        }
      }
    });
  } catch (error) {
    console.error('[BMA] Failed to fetch band links:', error);
  }

  return links;
}

function renderBandLinks(band: BandData, cell: HTMLElement) {
  if (band.linksFetched) {
    if (band.links && band.links.length > 0) {
      cell.innerHTML = band.links.map((link) =>
        `<a href="${link.url}" target="_blank" rel="noopener" class="bma-table-link ${link.name.toLowerCase()}" title="${link.name}">${link.icon}</a>`
      ).join(' ');
    } else {
      cell.textContent = '-';
    }
  } else {
    cell.innerHTML = '<span class="bma-links-loading">...</span>';
    fetchBandLinks(band.bandUrl).then((links) => {
      band.links = links;
      band.linksFetched = true;
      if (links.length > 0) {
        cell.innerHTML = links.map((link) =>
          `<a href="${link.url}" target="_blank" rel="noopener" class="bma-table-link ${link.name.toLowerCase()}" title="${link.name}">${link.icon}</a>`
        ).join(' ');
      } else {
        cell.textContent = '-';
      }
    });
  }
}

function renderFilteredResults(container: HTMLElement) {
  const { filteredBands, currentPage, pageSize, filterText, filterStatuses, filterGenre, filterLocation } = appState;
  const isFiltering = filterText || filterStatuses.size > 0 || filterGenre || filterLocation;

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
  if (filterGenre) activeFilters.push(`Genre: ${filterGenre}`);
  if (filterLocation) activeFilters.push(`Location: ${filterLocation}`);
  if (filterStatuses.size > 0) activeFilters.push(`Status: ${Array.from(filterStatuses).join(', ')}`);
  if (filterText) activeFilters.push(`Text: "${filterText}"`);
  const filtersDisplay = activeFilters.length > 0 ? ` (${activeFilters.join(' + ')})` : '';

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
          <th>Links</th>
        </tr>
      </thead>
      <tbody>
        ${pageBands.map((band, idx) => `
          <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
            <td>${band.nameHtml}</td>
            <td>${band.genre}</td>
            <td>${band.location}</td>
            <td>${band.status}</td>
            <td class="bma-links-cell" data-band-idx="${startIdx + idx}"></td>
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

  // Fetch links for visible bands
  container.querySelectorAll('.bma-links-cell').forEach((cell) => {
    const idx = parseInt(cell.getAttribute('data-band-idx') || '0', 10);
    const band = filteredBands[idx];
    if (band) {
      renderBandLinks(band, cell as HTMLElement);
    }
  });

  // Clear filter handler
  container.querySelector('.bma-clear-filter')?.addEventListener('click', () => {
    appState.filterText = '';
    appState.filterStatuses.clear();
    appState.filterGenre = '';
    appState.filterLocation = '';
    appState.currentPage = 0;

    const input = document.getElementById('bma-filter-input') as HTMLInputElement;
    if (input) input.value = '';

    document.querySelectorAll('.bma-tag').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.bma-genre').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.bma-location').forEach((t) => t.classList.remove('active'));
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
    const { filteredBands, allBands, filterText, filterStatuses } = appState;
    if (filterText || filterStatuses.size > 0) {
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
    <div class="bma-summary">
      <div class="bma-loading">Loading all bands...</div>
    </div>
    <div class="bma-genres"></div>
    <div class="bma-locations"></div>
    <div class="bma-filter-row">
      <input type="text" class="bma-filter-input" placeholder="Filter all bands..." id="bma-filter-input">
      <div class="bma-filter-tags">
        <span class="bma-tag" data-status="active">Active</span>
        <span class="bma-tag" data-status="split-up">Split-up</span>
        <span class="bma-tag" data-status="on-hold">On hold</span>
        <span class="bma-tag" data-status="changed-name">Changed name</span>
      </div>
      <span class="bma-filter-count"></span>
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
      setupFilterLogic(resultsContainer);
      loadAllData(countryCode, controls, resultsContainer);
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

async function loadAllData(countryCode: string, controls: HTMLElement, resultsContainer: HTMLElement) {
  const summaryEl = controls.querySelector('.bma-summary');

  try {
    const bands = await fetchAllBands(countryCode, (loaded, total) => {
      if (summaryEl) {
        summaryEl.innerHTML = `<div class="bma-loading">Loading bands... ${loaded.toLocaleString()} / ${total.toLocaleString()}</div>`;
      }
    });

    appState.allBands = bands;
    appState.filteredBands = bands;

    const counts = countStatuses(bands);
    const topGenres = getTopGenres(bands, 10);
    const topLocations = getTopLocations(bands, 10);

    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="bma-stat total">
          <span class="bma-stat-value">${counts.total.toLocaleString()}</span>
          <span class="bma-stat-label">total</span>
        </div>
        <div class="bma-stat active">
          <span class="bma-stat-value">${counts.active.toLocaleString()}</span>
          <span class="bma-stat-label">active</span>
        </div>
        <div class="bma-stat split-up">
          <span class="bma-stat-value">${counts['split-up'].toLocaleString()}</span>
          <span class="bma-stat-label">split-up</span>
        </div>
        <div class="bma-stat on-hold">
          <span class="bma-stat-value">${counts['on-hold'].toLocaleString()}</span>
          <span class="bma-stat-label">on hold</span>
        </div>
        <div class="bma-stat changed-name">
          <span class="bma-stat-value">${counts['changed-name'].toLocaleString()}</span>
          <span class="bma-stat-label">changed name</span>
        </div>
        <div class="bma-stat unknown">
          <span class="bma-stat-value">${counts.unknown.toLocaleString()}</span>
          <span class="bma-stat-label">unknown</span>
        </div>
      `;
    }

    // Render top genres
    const genresEl = controls.querySelector('.bma-genres');
    if (genresEl && topGenres.length > 0) {
      genresEl.innerHTML = `
        <span class="bma-genres-title">Top genres</span>
        ${topGenres.map((g) => `
          <span class="bma-genre" data-genre="${g.genre}">
            ${g.genre}
            <span class="bma-genre-count">(${g.count.toLocaleString()})</span>
          </span>
        `).join('')}
      `;

      // Add click handlers to filter by genre (toggle)
      genresEl.querySelectorAll('.bma-genre').forEach((el) => {
        el.addEventListener('click', () => {
          const genre = el.getAttribute('data-genre');
          if (!genre) return;

          // Toggle: if same genre clicked again, clear it
          if (appState.filterGenre === genre) {
            appState.filterGenre = '';
            el.classList.remove('active');
          } else {
            // Clear previous active genre
            genresEl.querySelectorAll('.bma-genre').forEach((g) => g.classList.remove('active'));
            appState.filterGenre = genre;
            el.classList.add('active');
          }

          appState.currentPage = 0;
          appState.filteredBands = applyFilters();
          updateFilterCount();
          renderFilteredResults(resultsContainer);
        });
      });
    }

    // Render top locations
    const locationsEl = controls.querySelector('.bma-locations');
    if (locationsEl && topLocations.length > 0) {
      locationsEl.innerHTML = `
        <span class="bma-locations-title">Top locations</span>
        ${topLocations.map((loc) => `
          <span class="bma-location" data-location="${loc.location}">
            ${loc.location}
            <span class="bma-location-count">(${loc.count})</span>
          </span>
        `).join('')}
      `;

      // Add click handlers to filter by location (toggle)
      locationsEl.querySelectorAll('.bma-location').forEach((el) => {
        el.addEventListener('click', () => {
          const location = el.getAttribute('data-location');
          if (!location) return;

          // Toggle: if same location clicked again, clear it
          if (appState.filterLocation === location) {
            appState.filterLocation = '';
            el.classList.remove('active');
          } else {
            // Clear previous active location
            locationsEl.querySelectorAll('.bma-location').forEach((l) => l.classList.remove('active'));
            appState.filterLocation = location;
            el.classList.add('active');
          }

          appState.currentPage = 0;
          appState.filteredBands = applyFilters();
          updateFilterCount();
          renderFilteredResults(resultsContainer);
        });
      });
    }
  } catch (error) {
    console.error('[BMA] Failed to load data:', error);
    if (summaryEl) {
      summaryEl.innerHTML = `<div class="bma-loading" style="color: #f87171;">Failed to load data</div>`;
    }
  }
}

function setupFilterLogic(resultsContainer: HTMLElement) {
  const input = document.getElementById('bma-filter-input') as HTMLInputElement;
  const tags = document.querySelectorAll('.bma-tag[data-status]');

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
      renderFilteredResults(resultsContainer);
    }, 150);
  });

  // Status tag toggles
  tags.forEach((tag) => {
    tag.addEventListener('click', () => {
      const status = tag.getAttribute('data-status');
      if (!status) return;

      if (appState.filterStatuses.has(status)) {
        appState.filterStatuses.delete(status);
        tag.classList.remove('active');
      } else {
        appState.filterStatuses.add(status);
        tag.classList.add('active');
      }

      appState.currentPage = 0;
      appState.filteredBands = applyFilters();
      updateFilterCount();
      renderFilteredResults(resultsContainer);
    });
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
      else if (dtLabel.includes('lyrical')) lyricalThemes = value;
      else if (dtLabel.includes('years active')) yearsActive = value;
      else if (dtLabel.includes('label')) labelName = value;
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
          <span class="bma-preview-meta-label">Themes</span>
        </div>
        ` : ''}
      </div>
      ${albumsHtml}
    </div>
    ${data.photoUrl ? `<div class="bma-preview-photo"><img src="${data.photoUrl}" alt="Photo"></div>` : ''}
  `;
}

// Initialize band preview will be called from main()
