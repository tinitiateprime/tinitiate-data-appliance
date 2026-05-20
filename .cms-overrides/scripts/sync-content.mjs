import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const PAGE_EXTENSIONS = new Set(['.md', '.markdown']);
const ASSET_EXTENSIONS = new Set([
  '.apng',
  '.avif',
  '.bin',
  '.bmp',
  '.csv',
  '.gif',
  '.jpeg',
  '.jpg',
  '.json',
  '.parquet',
  '.pdf',
  '.png',
  '.py',
  '.svg',
  '.txt',
  '.ts',
  '.tsx',
  '.webp',
  '.yaml',
  '.yml',
]);

const LAYOUT_HEADER_CANDIDATES = ['images/header.md', '_layout/header.md', 'header.md'];
const LAYOUT_FOOTER_CANDIDATES = ['images/footer.md', '_layout/footer.md', 'footer.md'];

const args = parseArgs(process.argv.slice(2));
const source = args.source ?? 'local';
const rootDir = process.cwd();
const destDir = path.resolve(rootDir, process.env.CONTENT_DEST_DIR ?? 'public/content');
const contentSourceDir = normalizeDir(process.env.CONTENT_SOURCE_DIR ?? (source === 'github' ? 'banking-domain' : 'md'));

await resetDest(destDir);

if (source === 'github') {
  await syncGitHubContent({ rootDir, destDir, contentSourceDir });
} else if (source === 'local') {
  await syncLocalContent({ rootDir, destDir, contentSourceDir });
} else {
  throw new Error(`Unknown content source "${source}". Use local or github.`);
}

async function syncLocalContent({ rootDir, destDir, contentSourceDir }) {
  const sourceDir = path.resolve(rootDir, contentSourceDir);
  const sourceStats = await stat(sourceDir).catch(() => null);

  if (!sourceStats?.isDirectory()) {
    throw new Error(`Local content directory not found: ${sourceDir}`);
  }

  const files = await listLocalFiles(sourceDir);
  const copiedFiles = [];

  for (const file of files) {
    if (!isSupportedContentFile(file.relativePath)) {
      continue;
    }

    const destination = path.join(destDir, file.relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, await readFile(file.absolutePath));
    copiedFiles.push({
      path: file.relativePath,
      size: file.size,
    });
  }

  await writeManifest(destDir, {
    source: {
      type: 'local',
      directory: contentSourceDir,
    },
    files: copiedFiles,
  });

  console.log(`Synced ${copiedFiles.length} local content files from ${contentSourceDir}`);
}

async function syncGitHubContent({ destDir, contentSourceDir }) {
  const repo = process.env.CONTENT_REPO ?? 'tinitiateprime/tinitiate-data-appliance';
  const configuredBranch = process.env.CONTENT_BRANCH;
  const branch = configuredBranch || await getDefaultBranch(repo);
  const tree = await getGitTree(repo, branch);
  const prefix = contentSourceDir === '.' ? '' : `${contentSourceDir}/`;
  const candidates = tree
    .filter((entry) => entry.type === 'blob')
    .filter((entry) => entry.path.startsWith(prefix))
    .map((entry) => ({
      ...entry,
      relativePath: normalizePath(entry.path.slice(prefix.length)),
    }))
    .filter((entry) => entry.relativePath && isSupportedContentFile(entry.relativePath));

  const copiedFiles = [];

  for (const entry of candidates) {
    const destination = path.join(destDir, entry.relativePath);
    const bytes = await downloadGitHubFile(repo, branch, entry.path);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, bytes);
    copiedFiles.push({
      path: entry.relativePath,
      size: entry.size,
      sha: entry.sha,
      sourcePath: entry.path,
    });
  }

  await writeManifest(destDir, {
    source: {
      type: 'github',
      repo,
      branch,
      sourceDir: contentSourceDir,
    },
    files: copiedFiles,
  });

  console.log(`Synced ${copiedFiles.length} GitHub content files from ${repo}@${branch}/${contentSourceDir}`);
}

async function writeManifest(destDir, { source, files }) {
  const pages = [];
  const assets = [];
  const markdownByPath = new Map();

  for (const file of files) {
    const extension = path.extname(file.path).toLowerCase();
    if (!PAGE_EXTENSIONS.has(extension)) {
      assets.push({
        ...file,
        kind: classifyAsset(file.path),
      });
      continue;
    }

    const absolutePath = path.join(destDir, file.path);
    const raw = await readFile(absolutePath, 'utf8');
    const parsed = parseMarkdownMeta(raw, file.path);
    markdownByPath.set(file.path, parsed);

    pages.push({
      ...file,
      type: 'page',
      route: routeFromMarkdownPath(file.path),
      title: parsed.title,
      order: parsed.order,
      hidden: parsed.hidden,
      layoutRole: parsed.layoutRole,
      headings: parsed.headings,
    });
  }

  const layout = {
    header: findFirstExisting(markdownByPath, LAYOUT_HEADER_CANDIDATES),
    footer: findFirstExisting(markdownByPath, LAYOUT_FOOTER_CANDIDATES),
  };

  const menuPages = pages
    .filter((page) => page.layoutRole === 'page')
    .sort(comparePages);

  const manifest = {
    generatedAt: new Date().toISOString(),
    source,
    layout,
    pages: menuPages,
    assets: assets.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true })),
  };

  await mkdir(destDir, { recursive: true });
  await writeFile(path.join(destDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

async function listLocalFiles(root, dir = root) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listLocalFiles(root, absolutePath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const fileStat = await stat(absolutePath);
    files.push({
      absolutePath,
      relativePath: normalizePath(path.relative(root, absolutePath)),
      size: fileStat.size,
    });
  }

  return files;
}

async function resetDest(destDir) {
  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });
}

async function getDefaultBranch(repo) {
  const response = await githubFetch(`https://api.github.com/repos/${repo}`);
  if (!response.ok) {
    throw new Error(`Unable to read GitHub repository ${repo}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.default_branch ?? 'main';
}

async function getGitTree(repo, branch) {
  const response = await githubFetch(`https://api.github.com/repos/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  if (!response.ok) {
    throw new Error(`Unable to read GitHub tree ${repo}@${branch}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.truncated) {
    console.warn('GitHub returned a truncated tree. Set CONTENT_SOURCE_DIR to a smaller folder if files are missing.');
  }

  return data.tree ?? [];
}

async function downloadGitHubFile(repo, branch, filePath) {
  const url = `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(branch)}/${filePath.split('/').map(encodeURIComponent).join('/')}`;
  const response = await githubFetch(url);

  if (!response.ok) {
    throw new Error(`Unable to download ${filePath}: ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function githubFetch(url) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'markdown-site-framework',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return fetch(url, { headers });
}

function parseMarkdownMeta(raw, filePath) {
  const { body, frontmatter } = splitFrontmatter(raw);
  const headingIds = new Map();
  const headings = [...body.matchAll(/^#{1,3}\s+(.+)$/gm)].map((match) => ({
    level: match[0].match(/^#+/)?.[0].length ?? 1,
    text: stripMarkdownInline(match[1].trim()),
    id: createUniqueHeadingId(match[1].trim(), headingIds),
  }));
  const title = stringOrUndefined(frontmatter.title) ?? headings.find((heading) => heading.level === 1)?.text ?? titleFromPath(filePath);
  const order = numberOrUndefined(frontmatter.order);
  const hidden = booleanOrFalse(frontmatter.hidden);
  const layoutRole = getLayoutRole(filePath, frontmatter.layout);

  return {
    title,
    order,
    hidden,
    layoutRole,
    headings,
  };
}

function splitFrontmatter(raw) {
  if (!raw.startsWith('---')) {
    return { body: raw, frontmatter: {} };
  }

  const end = raw.indexOf('\n---', 3);
  if (end === -1) {
    return { body: raw, frontmatter: {} };
  }

  const yaml = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, '');
  const frontmatter = {};

  for (const line of yaml.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      continue;
    }

    frontmatter[match[1]] = match[2].replace(/^['"]|['"]$/g, '').trim();
  }

  return { body, frontmatter };
}

function getLayoutRole(filePath, layoutValue) {
  const normalized = normalizePath(filePath).toLowerCase();
  const layout = String(layoutValue ?? '').toLowerCase();

  if (layout === 'header' || LAYOUT_HEADER_CANDIDATES.includes(normalized)) {
    return 'header';
  }

  if (layout === 'footer' || LAYOUT_FOOTER_CANDIDATES.includes(normalized)) {
    return 'footer';
  }

  return 'page';
}

function findFirstExisting(markdownByPath, candidates) {
  return candidates.find((candidate) => markdownByPath.has(candidate)) ?? null;
}

function comparePages(a, b) {
  if (a.route === '/') return -1;
  if (b.route === '/') return 1;

  const orderA = a.order ?? Number.POSITIVE_INFINITY;
  const orderB = b.order ?? Number.POSITIVE_INFINITY;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' });
}

function routeFromMarkdownPath(filePath) {
  const parsed = path.posix.parse(normalizePath(filePath));
  const dir = parsed.dir === '.' ? '' : parsed.dir;
  const routeDir = normalizeRouteDir(dir);
  const name = parsed.name.toLowerCase();

  if (!routeDir && name === 'readme') {
    return '/';
  }

  if (name === 'readme' || name === 'index') {
    return `/${routeDir}`.replace(/\/+/g, '/') || '/';
  }

  return `/${path.posix.join(routeDir, parsed.name)}`.replace(/\/+/g, '/');
}

function normalizeRouteDir(dir) {
  const segments = normalizePath(dir).split('/').filter(Boolean);

  if (segments[0]?.toLowerCase() === 'md') {
    segments.shift();
  }

  return segments
    .map((segment) => (segment.toLowerCase() === 'requriments' ? 'requirements' : segment))
    .join('/');
}

function titleFromPath(filePath) {
  const parsed = path.posix.parse(normalizePath(filePath));
  const name = parsed.name.toLowerCase() === 'readme' ? 'Home' : parsed.name;
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stripMarkdownInline(value) {
  return value
    .replace(/!\[([^\]]*)]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[*`~#]/g, '')
    .trim();
}

function createUniqueHeadingId(value, usedIds = new Map()) {
  const baseId = slugifyHeading(value) || 'section';
  const count = usedIds.get(baseId) ?? 0;
  usedIds.set(baseId, count + 1);

  return count === 0 ? baseId : `${baseId}-${count + 1}`;
}

function slugifyHeading(value) {
  return stripMarkdownInline(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function classifyAsset(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (['.apng', '.avif', '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'].includes(extension)) {
    return 'image';
  }

  if (['.csv', '.json', '.parquet', '.yaml', '.yml'].includes(extension)) {
    return 'data';
  }

  if (['.py', '.ts', '.tsx'].includes(extension)) {
    return 'script';
  }

  return 'asset';
}

function isSupportedContentFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return PAGE_EXTENSIONS.has(extension) || ASSET_EXTENSIONS.has(extension);
}

function normalizePath(value) {
  return value.replaceAll('\\', '/').replace(/^\/+/, '');
}

function normalizeDir(value) {
  const normalized = normalizePath(value).replace(/\/+$/, '');
  return normalized || '.';
}

function parseArgs(rawArgs) {
  const parsed = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (!match) {
      continue;
    }

    const next = rawArgs[index + 1];
    if (match[2] !== undefined) {
      parsed[match[1]] = match[2];
    } else if (next && !next.startsWith('--')) {
      parsed[match[1]] = next;
      index += 1;
    } else {
      parsed[match[1]] = true;
    }
  }

  return parsed;
}

function stringOrUndefined(value) {
  return value ? String(value) : undefined;
}

function numberOrUndefined(value) {
  if (value === undefined || value === '') {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function booleanOrFalse(value) {
  return ['true', 'yes', '1'].includes(String(value ?? '').toLowerCase());
}
