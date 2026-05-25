# Provoz, zálohy a aktualizace

## Stav služeb

```bash
cd /opt/dmarc-logy
sudo docker compose ps
```

## Logy

```bash
sudo docker compose logs --tail=100 api
sudo docker compose logs --tail=100 worker
sudo docker compose logs --tail=100 scheduler
sudo docker compose logs --tail=100 frontend
sudo docker compose logs --tail=100 proxy
```

Živé logy:

```bash
sudo docker compose logs -f
```

## Restart

```bash
sudo docker compose restart
```

## Zastavení

```bash
sudo docker compose down
```

## Spuštění

```bash
sudo docker compose up -d
```

## Záloha databáze

```bash
mkdir -p /opt/backups/dmarc-logy
cd /opt/dmarc-logy
sudo docker compose exec -T db pg_dump -U dmarc_logy dmarc_logy > /opt/backups/dmarc-logy/dmarc_logy_$(date +%F_%H%M).sql
```

## Záloha konfigurace a dat

```bash
mkdir -p /opt/backups/dmarc-logy
sudo tar czf /opt/backups/dmarc-logy/dmarc_logy_config_data_$(date +%F_%H%M).tar.gz \
  /opt/dmarc-logy/.env \
  /opt/dmarc-logy/docker-compose.yml \
  /opt/dmarc-logy/nginx \
  /opt/dmarc-logy/data
```

## Obnova databáze

```bash
cd /opt/dmarc-logy
sudo docker compose up -d db
cat /opt/backups/dmarc-logy/dmarc_logy_YYYY-MM-DD_HHMM.sql | sudo docker compose exec -T db psql -U dmarc_logy -d dmarc_logy
```

## Aktualizace aplikace

```bash
cd /opt/dmarc-logy
sudo docker compose down
cp -a . ../dmarc-logy-backup-$(date +%F-%H%M)
unzip -o /tmp/dmarc-analyzator-v1.0.zip -d /opt/dmarc-logy
sudo docker compose build --no-cache
sudo docker compose up -d
sudo docker compose ps
```

## Kontrola volného místa

```bash
df -h
sudo docker system df
```

## Úklid starých Docker image po ověřené aktualizaci

```bash
sudo docker image prune -f
```

Nepoužívejte `docker system prune --volumes`, pokud si nejste jistí, protože může odstranit nepoužívané volumes.
