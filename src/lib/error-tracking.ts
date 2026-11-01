import type { ErrorEvent } from "@sentry/nextjs";

/** Keep useful stacks and error categories without transmitting newsroom forms or SQL parameter values. */
export function scrubErrorEvent(event: ErrorEvent): ErrorEvent {
  delete event.user;
  delete event.extra;
  delete event.breadcrumbs;
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.query_string;
    if (event.request.url) event.request.url = event.request.url.split(/[?#]/)[0];
  }
  const scrub = (value: string) => /Failed query:|\bparams:/i.test(value)
    ? "Database query failed (query and parameters withheld)"
    : value.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email]");
  if (event.message) event.message = scrub(event.message);
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = scrub(exception.value);
    for (const frame of exception.stacktrace?.frames ?? []) delete frame.vars;
  }
  return event;
}
