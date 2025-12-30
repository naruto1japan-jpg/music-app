import { Home, Search, Settings } from "lucide-react";
import { Link, useLocation } from "react-router";
import styles from "./header.module.css";

export function Header() {
  const location = useLocation();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <Home className={styles.logoIcon} size={28} />
          <h1 className={styles.logoText}>Harmony Flow</h1>
        </Link>
        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink} data-active={location.pathname === "/"}>
            <Home className={styles.navIcon} />
            <span className={styles.navLinkText}>Home</span>
          </Link>
          <Link to="/search" className={styles.navLink} data-active={location.pathname === "/search"}>
            <Search className={styles.navIcon} />
            <span className={styles.navLinkText}>Search</span>
          </Link>
          <Link to="/admin" className={styles.navLink} data-active={location.pathname === "/admin"}>
            <Settings className={styles.navIcon} />
            <span className={styles.navLinkText}>Admin Panel</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
