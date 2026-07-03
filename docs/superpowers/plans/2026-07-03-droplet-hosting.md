# Droplet Hosting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the 1817Calculator static site from a Digital Ocean Droplet, auto-deploying on every GitHub Release via GitHub Actions + rsync over SSH.

**Architecture:** GitHub Actions builds `dist/` on release publish, then rsyncs it to `/var/www/1817calculator/` on the Droplet over SSH. nginx serves those static files on port 80.

**Tech Stack:** GitHub Actions, rsync, SSH (ed25519), nginx, Vite (already configured)

## Global Constraints

- Deploy user on Droplet: `root`
- Web root on Droplet: `/var/www/1817calculator`
- nginx config path: `/etc/nginx/sites-available/1817calculator`
- GitHub secrets: `DROPLET_SSH_KEY` (private key contents), `DROPLET_HOST` (Droplet IP)
- Node version in CI: 20
- All local shell commands run in Git Bash or PowerShell on Windows unless marked `[Droplet]`

---

### Task 1: Generate deploy SSH key pair and configure access

**Files:**
- No files created locally — key lives at `~/.ssh/1817calculator_deploy` (outside the repo)

**Interfaces:**
- Produces: working SSH access from GitHub Actions to the Droplet using `DROPLET_SSH_KEY` and `DROPLET_HOST` secrets

- [ ] **Step 1: Generate an ed25519 key pair (run locally in Git Bash)**

```bash
ssh-keygen -t ed25519 -C "1817calculator-deploy" -f ~/.ssh/1817calculator_deploy -N ""
```

Expected output: two files created — `~/.ssh/1817calculator_deploy` (private) and `~/.ssh/1817calculator_deploy.pub` (public).

- [ ] **Step 2: Add the public key to the Droplet's authorized_keys**

Replace `<DROPLET_IP>` with your actual IP (find it in the Digital Ocean control panel).

```bash
cat ~/.ssh/1817calculator_deploy.pub | ssh root@<DROPLET_IP> "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

You'll be prompted for the root password (or your existing key will be used). Expected: no error output.

- [ ] **Step 3: Verify SSH access using the new key**

```bash
ssh -i ~/.ssh/1817calculator_deploy root@<DROPLET_IP> "echo 'SSH OK'"
```

Expected output: `SSH OK` — no password prompt, no errors.

- [ ] **Step 4: Store the private key as a GitHub Actions secret**

```bash
gh secret set DROPLET_SSH_KEY < ~/.ssh/1817calculator_deploy
```

Expected output: `✓ Set secret DROPLET_SSH_KEY for Talbatross/1817Calculator`

- [ ] **Step 5: Store the Droplet IP as a GitHub Actions secret**

Replace `<DROPLET_IP>` with your actual IP:

```bash
gh secret set DROPLET_HOST --body "<DROPLET_IP>"
```

Expected output: `✓ Set secret DROPLET_HOST for Talbatross/1817Calculator`

- [ ] **Step 6: Verify both secrets exist**

```bash
gh secret list
```

Expected: `DROPLET_HOST` and `DROPLET_SSH_KEY` both appear in the list.

---

### Task 2: Configure nginx on the Droplet

**Files:**
- Create `[Droplet]`: `/etc/nginx/sites-available/1817calculator`
- Create `[Droplet]`: `/var/www/1817calculator/` (directory)
- Symlink `[Droplet]`: `/etc/nginx/sites-enabled/1817calculator` → `../sites-available/1817calculator`
- Remove `[Droplet]`: `/etc/nginx/sites-enabled/default`

**Interfaces:**
- Consumes: nothing (nginx is already running from Task 1 context)
- Produces: nginx serving port 80, root at `/var/www/1817calculator`

- [ ] **Step 1: SSH into the Droplet**

```bash
ssh root@<DROPLET_IP>
```

All remaining steps in this task run on the Droplet.

- [ ] **Step 2: Create the web root directory**

```bash
mkdir -p /var/www/1817calculator
```

- [ ] **Step 3: Write the nginx server block**

```bash
cat > /etc/nginx/sites-available/1817calculator << 'EOF'
server {
    listen 80 default_server;
    root /var/www/1817calculator;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
```

- [ ] **Step 4: Enable the site and remove the default**

```bash
ln -s /etc/nginx/sites-available/1817calculator /etc/nginx/sites-enabled/1817calculator
rm -f /etc/nginx/sites-enabled/default
```

- [ ] **Step 5: Test nginx config is valid**

```bash
nginx -t
```

Expected output:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

- [ ] **Step 6: Reload nginx**

```bash
systemctl reload nginx
```

- [ ] **Step 7: Verify nginx responds on port 80**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost/
```

Expected: `404` (the web root is empty — that's correct; a deploy will populate it). If you get `200`, the default page is still active; double-check Step 4.

- [ ] **Step 8: Exit the Droplet**

```bash
exit
```

---

### Task 3: Write the GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `DROPLET_SSH_KEY` and `DROPLET_HOST` secrets (Task 1), nginx serving `/var/www/1817calculator` (Task 2)
- Produces: automatic deployment to the Droplet on every GitHub Release

- [ ] **Step 1: Create the workflows directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Write the deploy workflow**

Create `.github/workflows/deploy.yml` with this exact content:

```yaml
name: Deploy

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - run: npm run build

      - name: Deploy to Droplet
        env:
          DROPLET_SSH_KEY: ${{ secrets.DROPLET_SSH_KEY }}
          DROPLET_HOST: ${{ secrets.DROPLET_HOST }}
        run: |
          echo "$DROPLET_SSH_KEY" > /tmp/deploy_key
          chmod 600 /tmp/deploy_key
          mkdir -p ~/.ssh
          ssh-keyscan -H "$DROPLET_HOST" >> ~/.ssh/known_hosts
          rsync -az --delete \
            -e "ssh -i /tmp/deploy_key" \
            dist/ root@"$DROPLET_HOST":/var/www/1817calculator/
```

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Actions deploy workflow"
git push origin main
```

- [ ] **Step 4: Publish a GitHub Release to trigger the workflow**

```bash
gh release create v0.1.0 --title "v0.1.0" --notes "Initial release"
```

- [ ] **Step 5: Watch the workflow run**

```bash
gh run watch
```

Select the `Deploy` run. Expected: all steps pass and the run shows green.

- [ ] **Step 6: Verify the app loads**

Open `http://<DROPLET_IP>/` in a browser.

Expected: the 1817 Calculator loads — revenue input, share buttons, and payout cards visible. If you see a 404, check that the rsync step completed and that `/var/www/1817calculator/index.html` exists on the Droplet:

```bash
ssh root@<DROPLET_IP> "ls /var/www/1817calculator/"
```
