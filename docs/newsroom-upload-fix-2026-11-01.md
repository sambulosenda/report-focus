# Newsroom upload repair — 1 November 2026

Production logs showed repeated `Failed to find Server Action` errors after the 17:16 UTC deployment, including at 20:12 UTC. An already-open newsroom tab can retain an action identifier from an older build. This is consistent with the reported upload failure; the exact user request could not be correlated from the available logs.

Both the article editor (hero and body photos) and media library now upload multipart data to `/api/newsroom/upload`. The URL stays stable across builds. The endpoint checks origin, the authenticated session and journalist permissions, limits buffered request data to 9 MiB even without Content-Length, and retains the existing 8 MiB image limit and storage/database behavior. Responses are not cached. The browser handles expired sessions, non-JSON proxy failures and a 90-second timeout without navigating away from unsaved article text.

Existing server actions remain available for old clients as long as their build identifier is still recognized. A tab opened before this release needs one refresh to load the new upload client; copy unsaved article text first. Article save/publish actions are outside this change.

Validation:
- TypeScript check and targeted ESLint passed.
- Three automated tests cover multipart files over 1 MiB, oversized bodies without Content-Length, and upload responses including 401/413/502.
- An isolated Next.js server with a temporary database accepted a writer-authenticated 2 MiB image, saved the bytes, and inserted one media record. Cross-origin requests returned 403 and signed-out requests returned 401. Temporary test data was removed.

Reference: https://nextjs.org/docs/messages/failed-to-find-server-action
