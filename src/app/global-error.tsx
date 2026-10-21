"use client";

// The last resort: used only when the root layout itself throws. Next replaces the whole layout
// in that case — <html>, <body> and the stylesheet imported there — so this can't rely on any of
// the app's CSS or components. It carries its own minimal markup and styles, with the same light
// and dark palette as the rest of the app so it doesn't flash a different look.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Trip Planner</title>
        <style>{`
          :root { --bg:#f2f2f7; --label:#000; --secondary:rgba(60,60,67,.6); --accent:#007aff; }
          @media (prefers-color-scheme: dark) {
            :root { --bg:#000; --label:#fff; --secondary:rgba(235,235,245,.6); --accent:#0a84ff; }
          }
          body { margin:0; background:var(--bg); color:var(--label);
                 font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Arial,sans-serif; }
          main { min-height:100dvh; display:flex; flex-direction:column; align-items:center;
                 justify-content:center; gap:24px; padding:0 24px; text-align:center; box-sizing:border-box; }
          h1 { margin:0 0 8px; font-size:1.5rem; font-weight:700; letter-spacing:-.01em; }
          p  { margin:0; color:var(--secondary); font-size:1.0625rem; max-width:20rem; }
          .actions { display:flex; flex-direction:column; gap:12px; width:100%; max-width:20rem; }
          .btn { display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box;
                 min-height:44px; padding:0 16px; border-radius:16px; border:0; font:inherit;
                 font-size:1.0625rem; font-weight:600; text-decoration:none; cursor:pointer; }
          .primary { background:var(--accent); color:#fff; }
          .secondary { background:rgba(120,120,128,.2); color:var(--accent); }
          .ref { font-size:.75rem; }
        `}</style>
      </head>
      <body>
        <main>
          <div>
            <h1>Something went wrong</h1>
            <p>We couldn&rsquo;t load Trip Planner. Your trips are safe &mdash; try again in a moment.</p>
          </div>
          <div className="actions">
            <button type="button" className="btn primary" onClick={reset}>
              Try Again
            </button>
            {/* A plain <a>, not next/link: the router may be the very thing that's broken. */}
            <a href="/trips" className="btn secondary">
              Go to My Trips
            </a>
          </div>
          {error.digest && <p className="ref">Reference: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
