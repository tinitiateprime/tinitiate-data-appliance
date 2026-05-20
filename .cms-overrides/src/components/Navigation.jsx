import { Link, useLocation } from 'react-router-dom';
import { routesMatch } from '../lib/menu.js';

export default function Navigation({ items = [] }) {
  return (
    <nav className="site-nav" aria-label="Content navigation">
      <p className="side-menu-title">Contents</p>
      <NavigationList items={items} />
    </nav>
  );
}

function NavigationList({ items }) {
  return (
    <ul className="nav-list">
      {items.map((item) => (
        <NavigationItem item={item} key={item.key} />
      ))}
    </ul>
  );
}

function NavigationSubList({ items }) {
  return (
    <ul className="nav-sublist">
      {items.map((item) => (
        <NavigationItem item={item} key={item.key} />
      ))}
    </ul>
  );
}

function NavigationItem({ item }) {
  const location = useLocation();

  if (item.type === 'folder') {
    return (
      <li className="nav-item">
        <span className="nav-link nav-folder-label">{item.title}</span>
        <NavigationSubList items={item.children} />
      </li>
    );
  }

  const active = routesMatch(item.route, location.pathname);

  return (
    <li className="nav-item">
      <Link className={`nav-link ${active ? 'active' : ''}`} to={item.route} aria-current={active ? 'page' : undefined}>
        {item.title}
      </Link>
    </li>
  );
}
