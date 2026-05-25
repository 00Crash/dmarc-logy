# DMARC analyzátor · v1.0

Produkční self-hosted DMARC analyzátor pro interní provoz na Ubuntu Serveru 24.04.4.

## Cílové nasazení

- URL: `http://dmarc.ekostavby.local`
- IP: `192.168.0.37`
- OS: Ubuntu Server 24.04.4 minimal
- IMAP server: `mail.ekostavbylouny.cz`
- IMAP port: `993`
- SSL/TLS: ano
- Mailbox/user: `dmarc@ekostavbylouny.info`
- DMARC reporty chodí na: `dmarc@ekostavbylouny.info`

## Stack

- Nginx reverse proxy
- Next.js frontend
- FastAPI backend
- PostgreSQL
- Redis
- Celery worker
- Celery scheduler pro IMAP import
- Docker Compose

## Hlavní funkce

- Přihlášení přes údaje v `.env`
- Ruční upload `.xml`, `.zip`, `.gz`
- Automatický IMAP import
- Parser DMARC aggregate reportů
- Přehled celkem zpráv, DMARC pass rate, zdroje, reporty, období a importy
- Zdroje odesílání po kombinaci `source IP + Header From doména`
- Filtry `Header From` a `Stav zdroje`
- SPF/DKIM/DMARC přehledy u zdrojů
- Kompaktní doporučení oprav
- Historie: vývoj v čase a importované reporty
- Docker log rotation

## Dokumentace v balíčku

- `INSTALL_UBUNTU_24.04.4.md` - čistá instalace krok za krokem
- `DMARC_PRODUCTION_ROLLOUT.md` - doporučený postup nasazení DMARC politiky
- `OPERATIONS.md` - provoz, zálohy, aktualizace a diagnostika
- `SECURITY.md` - bezpečnostní doporučení
- `CHANGELOG.md` - změny verzí

## Rychlý start

```bash
cd /opt/dmarc-logy
cp .env.example .env
nano .env
sudo docker compose build
sudo docker compose up -d
```

Otevřete:

```text
http://dmarc.ekostavby.local
```

nebo:

```text
http://192.168.0.37
```
