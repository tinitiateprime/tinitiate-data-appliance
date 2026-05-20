import { getPublicPageRoute } from './menu.js';

const CONTENT_ROOT = '/content';
const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown']);

let manifestPromise;
let cachedManifest;

export async function fetchContentManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(`${CONTENT_ROOT}/manifest.json`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Unable to load content manifest: ${response.status} ${response.statusText}`);
        }

        cachedManifest = await response.json();
        return cachedManifest;
      });
  }

  return manifestPromise;
}

export async function fetchMarkdownFile(filePath) {
  const response = await fetch(resolveContentFileUrl(filePath));

  if (!response.ok) {
    throw new Error(`Unable to load ${filePath}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

export function resolveContentUrl(src = '', pagePath = '') {
  if (!src || isExternalUrl(src) || src.startsWith('#')) {
    return src;
  }

  const parsed = splitHref(src);
  return `${resolveContentFileUrl(resolveRelativeContentPath(pagePath, parsed.pathname))}${parsed.search}${parsed.hash}`;
}

export function resolveMarkdownLink(href = '', pagePath = '') {
  if (!href || isExternalUrl(href) || href.startsWith('#')) {
    return { type: 'external', href };
  }

  const parsed = splitHref(href);

  if (MARKDOWN_EXTENSIONS.has(extensionOf(parsed.pathname))) {
    const resolvedPath = resolveRelativeContentPath(pagePath, parsed.pathname);
    const page = findPageForMarkdownPath(resolvedPath, pagePath);

    if (page) {
      return {
        type: 'route',
        href: `${getPublicPageRoute(page)}${parsed.search}${parsed.hash}`,
      };
    }
  }

  return {
    type: 'external',
    href: resolveContentUrl(href, pagePath),
  };
}

function findPageForMarkdownPath(targetPath, currentPagePath) {
  const pages = cachedManifest?.pages ?? [];
  const normalizedTarget = normalizeContentPath(targetPath);
  const exactMatch = pages.find((page) => normalizeContentPath(page.path).toLowerCase() === normalizedTarget.toLowerCase());

  if (exactMatch) {
    return exactMatch;
  }

  const targetFileName = normalizedTarget.split('/').at(-1)?.toLowerCase();
  if (!targetFileName) {
    return null;
  }

  const candidates = pages.filter((page) => normalizeContentPath(page.path).split('/').at(-1)?.toLowerCase() === targetFileName);
  if (candidates.length <= 1) {
    return candidates[0] ?? null;
  }

  const currentGroup = contentGroup(currentPagePath);
  return candidates.find((page) => contentGroup(page.path) === currentGroup) ?? candidates[0];
}

function contentGroup(filePath) {
  const segments = normalizeContentPath(filePath).split('/');
  if (segments[0]?.toLowerCase() === 'md') {
    return (segments[1] ?? '').toLowerCase();
  }

  return (segments[0] ?? '').toLowerCase();
}

function resolveContentFileUrl(filePath) {
  return `${CONTENT_ROOT}/${encodeContentPath(normalizeContentPath(filePath))}`;
}

function resolveRelativeContentPath(pagePath, targetPath) {
  const rawTarget = String(targetPath).replaceAll('\\', '/');

  if (rawTarget.startsWith('/')) {
    return normalizeContentPath(rawTarget);
  }

  const baseParts = normalizeContentPath(pagePath).split('/').filter(Boolean);
  if (baseParts.length > 0) {
    baseParts.pop();
  }

  return normalizeContentPath([...baseParts, rawTarget].join('/'));
}

function splitHref(href) {
  const raw = String(href);
  const hashStart = raw.indexOf('#');
  const withoutHash = hashStart === -1 ? raw : raw.slice(0, hashStart);
  const hash = hashStart === -1 ? '' : raw.slice(hashStart);
  const searchStart = withoutHash.indexOf('?');

  if (searchStart === -1) {
    return {
      pathname: withoutHash,
      search: '',
      hash,
    };
  }

  return {
    pathname: withoutHash.slice(0, searchStart),
    search: withoutHash.slice(searchStart),
    hash,
  };
}

function extensionOf(filePath) {
  const lastDot = filePath.lastIndexOf('.');
  return lastDot === -1 ? '' : filePath.slice(lastDot).toLowerCase();
}

function isExternalUrl(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value);
}

function normalizeContentPath(value = '') {
  const normalized = String(value)
    .replaceAll('\\', '/')
    .replace(/^\/+/, '')
    .split('/');
  const parts = [];

  for (const part of normalized) {
    if (!part || part === '.') {
      continue;
    }

    if (part === '..') {
      parts.pop();
      continue;
    }

    parts.push(part);
  }

  return parts.join('/');
}

function encodeContentPath(filePath) {
  return filePath.split('/').map(encodeURIComponent).join('/');
}
