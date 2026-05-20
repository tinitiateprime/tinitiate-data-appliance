const FOLDER_LABELS = new Map([
  ['md', 'Documentation'],
  ['architecture', 'Architecture'],
  ['requriments', 'Requirements'],
  ['requirements', 'Requirements'],
]);

export function buildMenuTree(pages = []) {
  const rootItems = [];
  const folderItems = new Map();

  for (const page of pages.filter((item) => item && !item.hidden)) {
    const segments = getMenuPathSegments(page);
    const publicRoute = getPublicPageRoute(page);

    if (publicRoute === '/') {
      rootItems.push(createPageItem(page, publicRoute));
      continue;
    }

    let siblings = rootItems;
    let folderKey = '';

    for (const segment of segments.slice(0, -1)) {
      folderKey = folderKey ? `${folderKey}/${segment}` : segment;

      let folder = folderItems.get(folderKey);
      if (!folder) {
        folder = {
          type: 'folder',
          key: folderKey,
          segment,
          title: titleFromSegment(segment),
          children: [],
        };
        folderItems.set(folderKey, folder);
        siblings.push(folder);
      }

      siblings = folder.children;
    }

    siblings.push(createPageItem(page, publicRoute));
  }

  return sortMenuItems(rootItems, 0);
}

export function findPageByRoute(pages = [], route = '/') {
  return pages.find((page) => routesMatch(page.route, route) || routesMatch(getPublicPageRoute(page), route)) ?? null;
}

export function getPublicPageRoute(pageOrRoute) {
  const route = normalizeRoute(typeof pageOrRoute === 'string' ? pageOrRoute : pageOrRoute?.route);

  if (route === '/') {
    return route;
  }

  return normalizeRoute(route
    .replace(/^\/md\/requriments(?=\/|$)/, '/requirements')
    .replace(/^\/md\/architecture(?=\/|$)/, '/architecture')
    .replace(/^\/md(?=\/|$)/, '')
    .replace(/\/requriments(?=\/|$)/g, '/requirements'));
}

export function routesMatch(left, right) {
  const leftAliases = routeAliases(left);
  const rightAliases = routeAliases(right);

  return [...leftAliases].some((route) => rightAliases.has(route));
}

function createPageItem(page, route) {
  return {
    type: 'page',
    key: page.path ?? route,
    title: displayPageTitle(page),
    route,
    page,
  };
}

function displayPageTitle(page) {
  if (looksLikeSourceFileTitle(page?.title)) {
    return normalizeContentPath(page?.path ?? '').split('/').at(-1) ?? page.title;
  }

  return page?.title ?? titleFromSegment(getMenuPathSegments(page).at(-1) ?? 'Home');
}

function looksLikeSourceFileTitle(value) {
  return /\.(?:py|js|jsx|ts|tsx|sql)$/i.test(String(value ?? '').trim());
}

function getMenuPathSegments(page) {
  const path = normalizeContentPath(page?.path ?? '');
  const withoutExtension = path.replace(/\.(?:md|markdown)$/i, '');
  const segments = withoutExtension.split('/').filter(Boolean);

  if (segments[0]?.toLowerCase() === 'md') {
    segments.shift();
  }

  if (segments.length === 0) {
    return ['home'];
  }

  if (segments.length === 1 && segments[0].toLowerCase() === 'readme') {
    return ['home'];
  }

  return segments.map((segment) => (segment.toLowerCase() === 'requriments' ? 'requirements' : segment));
}

function sortMenuItems(items, depth) {
  const orderedItems = depth === 0 ? [...items].sort(compareMenuItems) : [...items];

  return orderedItems
    .map((item) => (item.type === 'folder' ? { ...item, children: sortMenuItems(item.children, depth + 1) } : item));
}

function compareMenuItems(left, right) {
  const leftRank = menuRank(left);
  const rightRank = menuRank(right);

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  return left.title.localeCompare(right.title, undefined, { numeric: true, sensitivity: 'base' });
}

function menuRank(item) {
  if (item.type === 'page' && item.route === '/') {
    return 0;
  }

  if (item.type === 'folder' && item.segment === 'architecture') {
    return 10;
  }

  if (item.type === 'folder' && item.segment === 'requirements') {
    return 20;
  }

  return item.type === 'folder' ? 30 : 40;
}

function routeAliases(route) {
  const normalized = normalizeRoute(route);
  const aliases = new Set([normalized, getPublicPageRoute(normalized)]);

  for (const candidate of [...aliases]) {
    aliases.add(candidate.replace(/^\/requirements(?=\/|$)/, '/md/requriments'));
    aliases.add(candidate.replace(/^\/architecture(?=\/|$)/, '/md/architecture'));
    aliases.add(candidate.replace(/\/requirements(?=\/|$)/g, '/requriments'));
    aliases.add(candidate.replace(/\/requriments(?=\/|$)/g, '/requirements'));
  }

  return new Set([...aliases].map(normalizeRoute));
}

function titleFromSegment(segment) {
  const normalized = String(segment ?? '').toLowerCase();
  const knownLabel = FOLDER_LABELS.get(normalized);

  if (knownLabel) {
    return knownLabel;
  }

  return String(segment ?? '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeRoute(value = '/') {
  const [path] = String(value || '/').split(/[?#]/);
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  const normalized = withSlash.replace(/\/+/g, '/').replace(/\/$/, '');

  return normalized || '/';
}

function normalizeContentPath(value = '') {
  return String(value).replaceAll('\\', '/').replace(/^\/+/, '');
}
