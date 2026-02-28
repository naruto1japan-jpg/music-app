import React from 'react';
import styles from './cosmic-particles.module.css';

export function CosmicParticles() {
  return (
    <div className={styles.container}>
      <div className={styles.particle} style={{ '--i': 1 } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--i': 2 } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--i': 3 } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--i': 4 } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--i': 5 } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--i': 6 } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--i': 7 } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--i': 8 } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--i': 9 } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--i': 10 } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--i': 11 } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--i': 12 } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--i': 13 } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--i': 14 } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--i': 15 } as React.CSSProperties} />
    </div>
  );
}
