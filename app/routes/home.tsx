import React from "react";
import type { Route } from "./+types/home";
import { Header } from "~/components/header/header";
import { MiniPlayer } from "~/components/mini-player/mini-player";
import { useMusic } from "~/contexts/music-context";
import styles from "./home.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Harmony Flow - Discover Your Sound" },
    {
      name: "description",
      content: "Discover, browse, and play music online with Harmony Flow",
    },
  ];
}

export default function Home() {
  const { backgroundGradient } = useMusic();

  React.useEffect(() => {
    document.documentElement.style.setProperty('--dynamic-background', backgroundGradient);
  }, [backgroundGradient]);

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.hero}>
        <h2 className={styles.heroTitle}>Discover Your Sound</h2>
        <p className={styles.heroSubtitle}>Explore millions of tracks and find your perfect rhythm</p>
      </div>
      <MiniPlayer />
    </div>
  );
}
