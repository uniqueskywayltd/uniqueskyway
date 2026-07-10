# Paste these commands into cPanel → Terminal (after clicking "I understand and want to proceed")

# 1. Fix the Git repository — pull Unique Sky Way from GitHub
cd ~/uniqueskyway.com
git remote -v
git remote set-url origin https://github.com/uniqueskywayltd/uniqueskyway.git || git remote add origin https://github.com/uniqueskywayltd/uniqueskyway.git
git fetch origin
git checkout -B main origin/main || git pull origin main

# 2. Install production dependencies (after git pull succeeds)
npm install --omit=dev

# 3. Verify startup file exists
ls -la server.cpanel.js package.json .cpanel.yml

echo "Done — now upload .next from your computer with: npm run deploy:cpanel"
