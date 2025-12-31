import React from 'react';
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import type { Route } from "./+types/root";
import { Toaster } from "./components/ui/toaster/toaster";
import colorSchemeApi from "@dazl/color-scheme/client?url";
import { MusicProvider } from "./contexts/music-context";

import "./styles/reset.css";
import "./styles/global.css";
import "./styles/tokens/keyframes.css";
import "./styles/tokens/animations.css";
import "./styles/tokens/colors.css";
import "./styles/tokens/decorations.css";
import "./styles/tokens/spacings.css";
import "./styles/tokens/typography.css";
import "./styles/theme.css";
import { useColorScheme } from "@dazl/color-scheme/react";
import favicon from "/favicon.svg";
import { usePerformanceOptimizer } from "./hooks/use-performance-optimizer";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "icon",
    href: favicon,
    type: "image/svg+xml",
  },
  {
    rel: "manifest",
    href: "/manifest.json",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { rootCssClass, resolvedScheme } = useColorScheme();
  return (
    <html lang="en" suppressHydrationWarning className={rootCssClass} style={{ colorScheme: resolvedScheme }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#8b5cf6" />
        <meta name="description" content="YouTube Music Player with background playback and offline support" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <Meta />
        <script src={colorSchemeApi}></script>
        <Links />
      </head>
      <body>
        {children}
        <div id="dropdown-portal" />
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // Initialize performance optimizer for device-specific optimizations
  const { deviceInfo, settings } = usePerformanceOptimizer();

  // Register service worker for always-online experience
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register the service worker
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('[App] Service Worker registered successfully');
          
          // Check for updates every 30 seconds when app is active
          const updateInterval = setInterval(() => {
            registration.update();
          }, 30000);

          // Check for updates immediately
          registration.update();

          // Listen for new service worker waiting to activate
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[App] New service worker available');
                  // Automatically activate the new service worker
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });

          // Cleanup on unmount
          return () => clearInterval(updateInterval);
        })
        .catch((error) => {
          console.warn('[App] Service Worker registration failed:', error);
        });

      // Handle service worker controller change (new version activated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[App] New service worker activated, reloading...');
          window.location.reload();
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'ONLINE') {
          console.log('[App] Connection restored');
        }
        if (event.data && event.data.type === 'OFFLINE') {
          console.log('[App] Connection lost - running in offline mode');
        }
      });

      // Monitor online/offline status
      window.addEventListener('online', () => {
        console.log('[App] Network online');
      });

      window.addEventListener('offline', () => {
        console.log('[App] Network offline - app will continue to work');
      });
    }
  }, []);

  // Log performance info
  React.useEffect(() => {
    console.log('Performance Optimization Active:', {
      device: `${deviceInfo.manufacturer} ${deviceInfo.model}`,
      refreshRate: `${deviceInfo.refreshRate}Hz`,
      gpuTier: deviceInfo.gpuTier,
      maxFPS: settings.maxFPS,
      animationDuration: settings.animationDuration,
    });
  }, [deviceInfo, settings]);

  return (
    <MusicProvider>
      <Outlet />
    </MusicProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
