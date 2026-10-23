# SheetJS dependency

`xlsx-0.20.3.tgz` is the official SheetJS Community Edition 0.20.3 archive.

- Source: https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
- Installation guidance: https://docs.sheetjs.com/docs/getting-started/installation/nodejs/
- Recorded SHA-256: `8dc73fc3b00203e72d176e85b50938627c7b086e607c682e8d3c22c02bb99fe8`

The server installs this archive as `xlsx` using `file:vendor/xlsx-0.20.3.tgz`.
This replaces the old npm registry release affected by CVE-2023-30533 and
CVE-2024-22363 while retaining the existing import and report export APIs.

Commit this archive together with `server/package.json` and
`server/package-lock.json`. Render's `npm ci` needs the archive to be present.
Dependency upgrades should use official SheetJS releases and repeat the
spreadsheet compatibility check and production dependency audit.
