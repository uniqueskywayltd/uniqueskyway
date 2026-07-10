# Namecheap VPS — first-time server setup

Use this after provisioning a **Namecheap VPS** (Ubuntu 22.04+ recommended).  
Shared/cPanel hosting is **not** supported for this Next.js app.

## 1. Server requirements

| Item | Minimum |
|------|---------|
| Plan | Namecheap VPS Pulsar (2 GB RAM) or higher |
| OS | Ubuntu 22.04 LTS |
| Node.js | 20.x LTS |
| RAM | 2 GB (4 GB recommended) |
| Disk | 20 GB+ |

## 2. Initial packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx ufw

# Node 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 process manager
sudo npm install -g pm2
```

## 3. Directory layout

```bash
sudo mkdir -p /var/www/uniqueskyway/{shared/logs,shared/scripts,releases,deploy}
sudo chown -R $USER:$USER /var/www/uniqueskyway
```

## 4. Environment file

From your **local machine**, export Vercel secrets checklist:

```bash
bash scripts/export-vercel-env-checklist.sh
```

Copy values from Vercel dashboard into:

```bash
nano /var/www/uniqueskyway/shared/.env.production
# Use deploy/env.production.template as reference
chmod 600 /var/www/uniqueskyway/shared/.env.production
```

## 5. Nginx + SSL

```bash
sudo cp /var/www/uniqueskyway/deploy/nginx-uniqueskyway.conf /etc/nginx/sites-available/uniqueskyway
sudo ln -sf /etc/nginx/sites-available/uniqueskyway /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

sudo certbot --nginx -d uniqueskyway.com -d www.uniqueskyway.com
sudo systemctl reload nginx
```

## 6. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 7. Deploy app (from your laptop)

```bash
cd platform
DEPLOY_HOST=root@YOUR_VPS_IP DEPLOY_PATH=/var/www/uniqueskyway npm run deploy:namecheap
```

## 8. Cron jobs (replaces Vercel Cron)

```bash
chmod +x /var/www/uniqueskyway/shared/scripts/cron-hit.sh
crontab -e
# Paste contents of deploy/crontab.example (adjust paths if needed)
```

Test manually:

```bash
set -a && source /var/www/uniqueskyway/shared/.env.production && set +a
bash /var/www/uniqueskyway/shared/scripts/cron-hit.sh /api/cron/roi
```

## 9. PM2 startup on reboot

```bash
pm2 startup
# Run the command it prints, then:
pm2 save
```

## 10. Smoke test

```bash
curl -s https://uniqueskyway.com/api/health | head
npm run deploy:smoke -- https://uniqueskyway.com
```

## Alternative: systemd instead of PM2

```bash
sudo cp deploy/uniqueskyway.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now uniqueskyway
```
