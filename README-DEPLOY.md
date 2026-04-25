# LontaraSign — Panduan Deploy ke VPS

## Prasyarat VPS
- Ubuntu 22.04 / Debian 12
- Docker Engine + Docker Compose v2 ([install](https://docs.docker.com/engine/install/ubuntu/))
- Domain/subdomain yang sudah diarahkan ke IP VPS (untuk HTTPS otomatis Caddy)
- Port 80 & 443 terbuka di firewall

---

## 1. Setup Awal VPS (sekali saja)

```bash
# SSH ke VPS
ssh user@YOUR_VPS_IP

# Buat direktori app
sudo mkdir -p /opt/lontarasign
sudo chown $USER:$USER /opt/lontarasign

# Clone repo
git clone https://github.com/YOUR_USERNAME/lontarasign.git /opt/lontarasign
cd /opt/lontarasign

# Buat .env dari template
cp .env.example .env
nano .env   # ← isi semua nilai sebenarnya

# Generate SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
# ↑ copy hasilnya ke SECRET_KEY di .env

# Buat deploy.sh executable
chmod +x deploy.sh
```

---

## 2. Edit Caddyfile

```bash
nano /opt/lontarasign/Caddyfile
# Ganti "your-domain.com" dengan domain kamu
```

---

## 3. Deploy Pertama Kali

```bash
cd /opt/lontarasign
docker compose -f docker-compose.prod.yml up -d --build

# Tunggu semua container running
docker compose -f docker-compose.prod.yml ps

# Migrasi password ke bcrypt (SEKALI saja, setelah deploy pertama)
docker compose -f docker-compose.prod.yml exec backend \
  python -m app.scripts.migrate_passwords_bcrypt
```

---

## 4. Deploy Berikutnya (setelah push ke GitHub)

```bash
# Di VPS
cd /opt/lontarasign
./deploy.sh
```

Atau dari lokal via Claude Code:
```
"deploy ke VPS"
→ Claude Code: ssh user@VPS_IP "cd /opt/lontarasign && ./deploy.sh"
```

---

## 5. Rollback

```bash
# Lihat tag/commit tersedia
git log --oneline -10

# Rollback ke commit tertentu
git checkout <commit-hash>
./deploy.sh

# Kembali ke latest
git checkout main
./deploy.sh
```

---

## 6. Cek Logs

```bash
# Semua service
docker compose -f docker-compose.prod.yml logs -f

# Per service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

---

## 7. Variabel Wajib di .env (prod)

| Key | Keterangan |
|-----|-----------|
| `MYSQL_ROOT_PASSWORD` | Password root MySQL — buat yang kuat |
| `MYSQL_PASSWORD` | Password DB user |
| `SECRET_KEY` | Min 64 karakter random |
| `APP_BASE_URL` | `https://your-domain.com` |
| `ALLOWED_ORIGINS` | `https://your-domain.com` |
| `AI_API_KEY` | OpenRouter API key |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |

---

## Struktur File Prod

```
lontarasign/
├── docker-compose.prod.yml   ← gunakan ini di VPS
├── docker-compose.yml        ← untuk local dev
├── Caddyfile                 ← reverse proxy + HTTPS
├── deploy.sh                 ← script deploy
├── .env                      ← secrets (JANGAN commit!)
├── .env.example              ← template (aman di-commit)
├── backend/
│   └── Dockerfile            ← sama untuk dev & prod
└── frontend/
    ├── Dockerfile            ← dev (Vite HMR)
    └── Dockerfile.prod       ← prod (nginx static)
```
