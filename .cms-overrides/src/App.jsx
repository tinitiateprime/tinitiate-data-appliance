import { Menu, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MarkdownPage from './components/MarkdownPage.jsx';
import Navigation from './components/Navigation.jsx';
import { buildMenuTree, findPageByRoute } from './lib/menu.js';
import { fetchContentManifest, fetchMarkdownFile } from './lib/content.js';
import { createUniqueHeadingId } from './lib/markdown.js';

export default function App() {
  const location = useLocation();
  const [manifest, setManifest] = useState(null);
  const [layoutMarkdown, setLayoutMarkdown] = useState({ header: '', footer: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [currentHeadings, setCurrentHeadings] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadManifest() {
      setLoading(true);
      setError('');

      try {
        const loadedManifest = await fetchContentManifest();
        const [header, footer] = await Promise.all([
          loadedManifest.layout?.header ? fetchMarkdownFile(loadedManifest.layout.header) : Promise.resolve(''),
          loadedManifest.layout?.footer ? fetchMarkdownFile(loadedManifest.layout.footer) : Promise.resolve(''),
        ]);

        if (active) {
          setManifest(loadedManifest);
          setLayoutMarkdown({ header, footer });
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadManifest();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  const menuTree = useMemo(() => buildMenuTree(manifest?.pages ?? []), [manifest]);
  const currentPage = useMemo(
    () => findPageByRoute(manifest?.pages ?? [], location.pathname),
    [manifest, location.pathname],
  );
  const homePage = useMemo(() => findPageByRoute(manifest?.pages ?? [], '/'), [manifest]);
  const headerMarkdown = layoutMarkdown.header || (homePage?.title ? `# ${homePage.title}` : '');
  const initialPageHeadings = useMemo(() => normalizePageHeadings(currentPage?.headings ?? []), [currentPage]);
  const pageHeadings = currentPage ? currentHeadings : [];
  const hasPageOutline = pageHeadings.length > 0;

  useEffect(() => {
    setCurrentHeadings(initialPageHeadings);
  }, [initialPageHeadings]);

  useEffect(() => {
    if (!currentPage || !location.hash) {
      return undefined;
    }

    const headingId = decodeHash(location.hash);
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(headingId)?.scrollIntoView({ block: 'start' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentPage, currentHeadings, location.hash, location.pathname]);

  const handlePageHeadingsChange = useCallback((headings) => {
    setCurrentHeadings(headings);
  }, []);

  if (loading) {
    return <FrameworkShell state="loading" />;
  }

  if (error) {
    return <FrameworkShell state="error" message={error} />;
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand-link" to="/" aria-label="Home">
            <MarkdownPage
              className="layout-markdown layout-markdown-header"
              markdown={headerMarkdown}
              pagePath={manifest.layout?.header}
              compact
            />
          </Link>
          <button
            className="icon-button mobile-menu-button"
            type="button"
            aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((value) => !value)}
          >
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <div className={`site-body ${hasPageOutline ? 'site-body-with-outline' : ''}`}>
        <aside className={`site-sidebar ${navOpen ? 'site-sidebar-open' : ''}`}>
          <Navigation items={menuTree} />
        </aside>

        <main className="content-shell">
          {currentPage ? (
            <MarkdownPage
              key={currentPage.path}
              className="page-markdown"
              page={currentPage}
              pagePath={currentPage.path}
              onHeadingsChange={handlePageHeadingsChange}
            />
          ) : (
            <MissingPage path={location.pathname} />
          )}
        </main>

        {hasPageOutline ? <PageOutline headings={pageHeadings} /> : null}
      </div>

      <footer className="site-footer">
        <MarkdownPage
          className="layout-markdown layout-markdown-footer"
          markdown={layoutMarkdown.footer}
          pagePath={manifest.layout?.footer}
          compact
        />
      </footer>
    </div>
  );
}

function decodeHash(hash) {
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return hash.slice(1);
  }
}

function PageOutline({ headings }) {
  const handleOutlineClick = useCallback((event, headingId) => {
    const target = document.getElementById(headingId);

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ block: 'start', behavior: 'smooth' });

    const encodedId = encodeURIComponent(headingId);
    const nextUrl = `${window.location.pathname}${window.location.search}#${encodedId}`;

    if (window.location.hash === `#${encodedId}`) {
      window.history.replaceState(null, '', nextUrl);
    } else {
      window.history.pushState(null, '', nextUrl);
    }
  }, []);

  return (
    <aside className="page-outline" aria-label="Markdown outline">
      <nav className="page-outline-nav">
        <p className="page-outline-title">On this page</p>
        <ol className="page-outline-list">
          {headings.map((heading) => (
            <li className={`page-outline-item page-outline-level-${heading.level}`} key={heading.id}>
              <a href={`#${heading.id}`} onClick={(event) => handleOutlineClick(event, heading.id)}>
                {heading.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}

function normalizePageHeadings(headings) {
  const usedHeadingIds = new Map();

  return headings
    .filter((heading) => heading?.text)
    .map((heading) => ({
      level: Math.min(Math.max(Number(heading.level) || 1, 1), 3),
      text: heading.text,
      id: heading.id || createUniqueHeadingId(heading.text, usedHeadingIds),
    }));
}

function FrameworkShell({ state, message }) {
  const isError = state === 'error';

  return (
    <div className="framework-state">
      <div className="framework-state-panel">
        <p className="eyebrow">{isError ? 'Content pipeline' : 'Loading'}</p>
        <h1>{isError ? 'Unable to load Markdown content' : 'Loading Markdown site'}</h1>
        {isError ? <p>{message}</p> : <p>The site is reading its generated content manifest.</p>}
      </div>
    </div>
  );
}

function MissingPage({ path }) {
  return (
    <article className="missing-page">
      <p className="eyebrow">Route</p>
      <h1>Page not found</h1>
      <p>No Markdown file maps to <code>{path}</code>.</p>
    </article>
  );
}
