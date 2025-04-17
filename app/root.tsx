import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { HydrationHandler } from "./components/HydrationHandler";

import "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Righteous&display=swap",
  },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <HydrationHandler />

        {/* Fallback UI when JavaScript is disabled */}
        <noscript>
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 text-center">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
              <h1 className="text-2xl font-bold mb-4">JavaScript Required</h1>
              <p className="mb-4">
                This color screensaver application requires JavaScript to be
                enabled in your browser.
              </p>
              <p>
                Please enable JavaScript and reload the page to experience the
                dynamic color changing screensaver.
              </p>
            </div>
          </div>
        </noscript>

        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
