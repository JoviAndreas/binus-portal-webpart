# binus-portal-webpart

Three SPFx 1.23 webparts for `binusianorg.sharepoint.com`:

- **BINUS Hero** — branded hero banner matching binus.ac.id look.
- **BINUS App Launcher** — categorised, searchable launcher reading the existing `Application Link` SharePoint list. Dedupes, normalises HTTPS, drops dead Yammer links.
- **BINUS Homepage** — composite that bundles hero + quick-links + launcher.

## Stack

- SPFx 1.23 · React 17 · TypeScript 4.7 · Node 18 LTS

## Build & deploy

```bash
nvm use 18
npm ci
npm run packagesppkg            # builds sharepoint/solution/binus-portal-webpart.sppkg
npm run deploy                  # build + m365 spo app add + deploy (tenant catalog)
```

Tenant catalog: `https://binusianorg.sharepoint.com/sites/appcatalog`.
