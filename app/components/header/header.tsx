import { Home, Search, Settings, Music2 } from "lucide-react";
import { Link, useLocation } from "react-router";
import styles from "./header.module.css";

export function Header() {
  const location = useLocation();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Music2 size={32} className={styles.logoIcon} />
        <span className={styles.logoText}>Harmony Flow</span>
      </div>
      
      <nav className={styles.nav}>
        <Link to="/" className={styles.navLink} data-active={location.pathname === "/"}>
          <Home className={styles.navIcon} size={24} />
          <span>Home</span>
        </Link>
        <Link to="/search" className={styles.navLink} data-active={location.pathname === "/search"}>
          <Search className={styles.navIcon} size={24} />
          <span>Search</span>
        </Link>
        <Link to="/admin" className={styles.navLink} data-active={location.pathname === "/admin"}>
          <Settings className={styles.navIcon} size={24} />
          <span>Admin</span>
        </Link>
      </nav>
    </aside>
  );
}
