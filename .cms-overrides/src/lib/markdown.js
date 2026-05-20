export function stripFrontmatter(raw) {
  if (!raw.startsWith('---')) {
    return raw;
  }

  const end = raw.indexOf('\n---', 3);
  if (end === -1) {
    return raw;
  }

  return raw.slice(end + 4).replace(/^\r?\n/, '');
}

export function extractMarkdownHeadings(markdown, usedIds = new Map()) {
  return [...markdown.replace(/\r\n/g, '\n').matchAll(/^(#{1,3})\s+(.+)$/gm)].map((match) => {
    const text = stripMarkdownInline(match[2].trim());

    return {
      level: match[1].length,
      text,
      id: createUniqueHeadingId(text, usedIds),
    };
  });
}

export function createUniqueHeadingId(value, usedIds = new Map()) {
  const baseId = slugifyHeading(value) || 'section';
  const count = usedIds.get(baseId) ?? 0;
  usedIds.set(baseId, count + 1);

  return count === 0 ? baseId : `${baseId}-${count + 1}`;
}

export function slugifyHeading(value) {
  return stripMarkdownInline(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function stripMarkdownInline(value) {
  return String(value ?? '')
    .replace(/!\[([^\]]*)]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[*`~#]/g, '')
    .trim();
}

export function splitMarkdownSections(markdown) {
  const normalized = markdown.replace(/\r\n/g, '\n').trim();

  if (!normalized) {
    return [{ id: 'empty', markdown: '' }];
  }

  if (normalized.includes('<!-- section -->')) {
    return normalized
      .split(/<!--\s*section\s*-->/i)
      .map((section, index) => createSection(section.trim(), index))
      .filter((section) => section.markdown);
  }

  const lines = normalized.split('\n');
  const sections = [];
  let current = [];
  let index = 0;

  for (const line of lines) {
    if (/^##\s+/.test(line) && current.length > 0) {
      sections.push(createSection(current.join('\n').trim(), index));
      current = [];
      index += 1;
    }

    current.push(line);
  }

  if (current.length > 0) {
    sections.push(createSection(current.join('\n').trim(), index));
  }

  return sections.length > 0 ? sections : [{ id: 'content', markdown: normalized }];
}

function createSection(markdown, index) {
  const heading = markdown.match(/^#{1,3}\s+(.+)$/m)?.[1] ?? `section-${index + 1}`;
  return {
    id: slugifyHeading(heading) || `section-${index + 1}`,
    markdown,
  };
}
