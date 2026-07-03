# Hosting Design: Digital Ocean Droplet via GitHub Actions

**Date:** 2026-07-03
**Status:** Approved

## Goal

Serve the 1817Calculator static site from a Digital Ocean Droplet IP address, with automatic deployment triggered on every GitHub Release.

## Architecture

```
GitHub Release published
        │
        ▼
GitHub Actions workflow
  1. npm ci
  2. npm run build  →  dist/
  3. rsync dist/   ──SSH──▶  /var/www/1817calculator/  on Droplet
                                        │
                                        ▼
                                   nginx (port 80)
                                   serves static files
```

## Components

### 1. Deploy SSH Key Pair

A dedicated ed25519 key pair is generated for deployment:

- **Private key** → stored as GitHub Actions secret `DROPLET_SSH_KEY`
- **Public key** → appended to `~/.ssh/authorized_keys` on the Droplet
- **Droplet IP** → stored as GitHub Actions secret `DROPLET_HOST`

Secrets are set in the repo under Settings → Secrets and variables → Actions.

### 2. GitHub Actions Workflow

File: `.github/workflows/deploy.yml`

Trigger: `on: release: types: [published]`

Steps:
1. Checkout repo
2. Setup Node 20
3. `npm ci`
4. `npm run build` → produces `dist/`
5. Write `DROPLET_SSH_KEY` secret to a temp file, set permissions to 600
6. `rsync -az --delete dist/ root@$DROPLET_HOST:/var/www/1817calculator/`

The `--delete` flag ensures the server always mirrors `dist/` exactly — stale files from previous builds are removed.

### 3. nginx Server Block

File on Droplet: `/etc/nginx/sites-available/1817calculator`

```nginx
server {
    listen 80 default_server;
    root /var/www/1817calculator;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Setup steps on the Droplet:
- Create `/var/www/1817calculator` with appropriate permissions
- Symlink into `/etc/nginx/sites-enabled/`
- Remove or disable the default nginx site so the calculator loads at the bare IP
- Reload nginx

## Future Work

- Add a domain name and TLS via Let's Encrypt/Certbot (straightforward to extend the nginx config and workflow once a domain is pointed at the Droplet)
