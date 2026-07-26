/**
 * Kill-switch service worker for the ORIGIN ROOT.
 *
 * `self` used to be served from "/" and registered a service worker at scope
 * "/" with a navigate fallback. A root-scoped worker like that intercepts every
 * navigation on the origin, so once you had opened Self, visiting /sharp/ was
 * served Self's cached shell instead — the two apps fought over one scope.
 *
 * Both apps now live under their own base (/self/, /sharp/) with their own
 * scopes. But devices that already installed the old root worker keep it, and a
 * service worker is only replaced when the browser fetches a DIFFERENT script
 * at the same URL. So this file has to exist here: it takes over, drops the
 * stale root caches, unregisters itself, and reloads any open window.
 *
 * Do not delete this file. Removing it would 404 and leave old installs
 * permanently controlled by the worker this replaces.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // caches is ORIGIN-wide, so scope the purge to the old root precache and
      // leave /self/ and /sharp/ caches intact.
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.includes('/self/') && !k.includes('/sharp/')).map((k) => caches.delete(k))
      );
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: 'window' });
      for (const client of windows) client.navigate(client.url);
    })()
  );
});
