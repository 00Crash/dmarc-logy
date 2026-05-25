# Instalace na čistý Ubuntu Server 24.04.4 minimal

Tento postup předpokládá čistou minimální instalaci Ubuntu Server 24.04.4, IP `192.168.0.37` a název `dmarc.ekostavby.local`.

## 1. Přihlášení na server

```bash
ssh sysadmin@192.168.0.37
```

## 2. Aktualizace systému

```bash
sudo apt update
sudo apt upgrade -y
sudo reboot
```

Po restartu se znovu přihlaste.

## 3. Hostname a hosts

```bash
sudo hostnamectl set-hostname dmarc
sudo nano /etc/hosts
```

Doporučený obsah:

```text
127.0.0.1 localhost
127.0.1.1 dmarc
192.168.0.37 dmarc.ekostavby.local dmarc
```

## 4. Základní balíčky

```bash
sudo apt install -y ca-certificates curl gnupg unzip nano ufw openssl
```

## 5. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw --force enable
sudo ufw status
```

Pokud bude aplikace někdy přístupná mimo LAN, použijte HTTPS a povolte také port `443/tcp`.

## 6. Instalace Docker Engine a Compose pluginu

```bash
sudo apt remove -y docker.io docker-compose docker-compose-v2 podman-docker containerd runc || true

sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

. /etc/os-release

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${UBUNTU_CODENAME:-$VERSION_CODENAME} stable" \
| sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl enable --now docker
sudo docker --version
sudo docker compose version
```

Volitelné spuštění Dockeru bez `sudo`:

```bash
sudo usermod -aG docker "$USER"
```

Potom se odhlaste a znovu přihlaste.

## 7. Příprava adresáře aplikace

```bash
sudo mkdir -p /opt/dmarc-logy
sudo chown -R "$USER:$USER" /opt/dmarc-logy
```

## 8. Nahrání ZIPu

Z lokálního počítače:

```bash
scp dmarc-analyzator-v1.0.zip sysadmin@192.168.0.37:/tmp/
```

Na serveru:

```bash
cd /opt/dmarc-logy
unzip /tmp/dmarc-analyzator-v1.0.zip -d /opt/dmarc-logy
```

Ověření struktury:

```bash
find . -maxdepth 2 -type f | sort
```

Musí být vidět zejména:

```text
./docker-compose.yml
./backend/Dockerfile
./frontend/Dockerfile
./nginx/default.conf
./.env.example
```

## 9. Konfigurace `.env`

```bash
cd /opt/dmarc-logy
cp .env.example .env
nano .env
```

Nastavte minimálně:

```env
POSTGRES_PASSWORD=SEM_DOPLNIT_SILNE_HESLO_POSTGRES
DATABASE_URL=postgresql+psycopg://dmarc_logy:SEM_DOPLNIT_SILNE_HESLO_POSTGRES@db:5432/dmarc_logy
IMAP_PASSWORD=SEM_DOPLNIT_HESLO_K_MAILBOXU
SECRET_KEY=SEM_DOPLNIT_NAHODNY_SECRET
AUTH_USERNAME=admin
AUTH_PASSWORD=SEM_DOPLNIT_SILNE_HESLO_PRO_WEB
```

Secret vygenerujte:

```bash
openssl rand -hex 32
```

Zabezpečte `.env`:

```bash
chmod 600 .env
```

## 10. Build a spuštění

```bash
cd /opt/dmarc-logy
sudo docker compose build
sudo docker compose up -d
sudo docker compose ps
```

## 11. Ověření API

```bash
curl http://127.0.0.1/api/health
```

Správná odpověď:

```json
{"status":"ok","service":"dmarc-logy-api"}
```

## 12. Otevření aplikace

```text
http://dmarc.ekostavby.local
```

Nebo:

```text
http://192.168.0.37
```

Přihlaste se údaji z `.env`:

```env
AUTH_USERNAME=admin
AUTH_PASSWORD=...
```

## 13. První test ručním importem

V balíčku je ukázkový report:

```text
samples/sample-dmarc.xml
```

Nahrajte ho přes UI. Po importu zkontrolujte:

- Home
- Zdroje odesílání
- Doporučení
- Historie

## 14. Test IMAP importu

V UI klikněte na `Spustit IMAP import`, nebo použijte:

```bash
curl -X POST http://127.0.0.1/api/imap/run-now --cookie "dmarc_session=..."
```

Praktičtější je spustit import přes UI po přihlášení.

## 15. Kontrola logů

```bash
sudo docker compose logs --tail=100 api
sudo docker compose logs --tail=100 worker
sudo docker compose logs --tail=100 scheduler
sudo docker compose logs --tail=100 frontend
sudo docker compose logs --tail=100 proxy
```

## 16. Lokální DNS

V lokálním DNS/routeru nastavte:

```text
dmarc.ekostavby.local -> 192.168.0.37
```

Dočasně na klientském počítači lze přidat do hosts:

```text
192.168.0.37 dmarc.ekostavby.local
```
