# Bezpečnostní doporučení

## Minimální produkční nastavení

- Silné heslo v `AUTH_PASSWORD`.
- Silné heslo v `POSTGRES_PASSWORD`.
- Náhodný `SECRET_KEY` z `openssl rand -hex 32`.
- Soubor `.env` s právy `600`.
- Aplikaci nevystavovat do internetu bez HTTPS.
- Pro veřejný přístup použít reverzní proxy s TLS a omezením přístupu.
- Pravidelně zálohovat PostgreSQL databázi.
- Pravidelně aktualizovat Ubuntu a Docker image.

## Oprávnění

```bash
cd /opt/dmarc-logy
chmod 600 .env
```

## Síť

Doporučené firewall minimum pro LAN provoz:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw enable
```

Pokud aplikace poběží mimo LAN, používejte HTTPS a zvažte VPN.

## Citlivost dat

DMARC reporty mohou prozrazovat:

- infrastrukturu mailserverů,
- používané externí služby,
- objemy e-mailů,
- chybné konfigurace SPF/DKIM,
- pokusy o spoofing.

Proto nepublikujte UI ani exporty veřejně.

## Přihlašování

Aplikace používá jednoduché přihlášení přes `.env`. Je vhodné pro interní self-hosted provoz v LAN. Pro více uživatelů nebo veřejný provoz doplňte SSO, reverse proxy autentizaci nebo jiný silnější mechanismus.
