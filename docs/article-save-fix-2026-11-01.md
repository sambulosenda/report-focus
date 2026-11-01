# Article save and publish repair — 1 November 2026

At 20:58:46 UTC the production log recorded `Failed to find Server Action` for an older deployment's action ID. The user reported failure when publishing from the newsroom. Photo uploads already used a stable endpoint, but saving and publishing still depended on build-specific Server Action IDs.

The ArticleEditor now submits draft, review, publish, unpublish and archive requests to `/api/newsroom/articles`. The endpoint verifies origin and session, bounds multipart input to 2 MiB, and invokes the existing validation, ownership and role checks. New article saves return an editor URL as JSON instead of throwing a navigation redirect; existing saves refresh server-rendered status. The old server action remains compatible with its existing callers.

Network failures, expired sessions and non-JSON proxy errors return messages in the editor. Requests are never automatically retried because a lost response could follow a successful database write. Error messages ask the writer to keep the editor open and check the article list before retrying. A tab opened before this release must be refreshed once to load the new client; unsaved text must be copied first.

Validation:
- Fresh TypeScript check and targeted ESLint passed.
- Five client and upload tests passed, covering stable transport, validation, sessions, proxy/network failures and upload limits.
- An isolated Next.js server with a temporary migrated database verified draft creation, editor publication, live updates without duplicate rows, rejection of writer publication, summary validation, and 401/403 checks. No live test articles were published; temporary data was removed.
