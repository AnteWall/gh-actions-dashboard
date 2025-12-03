# Deployment Guide

This guide explains how to deploy the GitHub Actions Dashboard.

## Deployment Options

- **[Kubernetes (Helm)](#kubernetes-helm)** - Recommended for production
- **[Docker Compose](#docker-compose)** - Simple self-hosted deployment

---

## Kubernetes (Helm)

Deploy to Kubernetes using the official Helm chart from GitHub Container Registry.

### Quick Start

```bash
helm install gh-actions-dashboard oci://ghcr.io/antewall/charts/gh-actions-dashboard \
  --set secrets.githubWebhookSecret="your-webhook-secret"
```

### With ngrok (Development)

```bash
helm install gh-actions-dashboard oci://ghcr.io/antewall/charts/gh-actions-dashboard \
  --set ngrok.enabled=true \
  --set ngrok.domain="your-subdomain.ngrok-free.dev" \
  --set secrets.githubWebhookSecret="your-webhook-secret" \
  --set secrets.ngrokAuthToken="your-ngrok-token"
```

### With Ingress (Production)

```bash
helm install gh-actions-dashboard oci://ghcr.io/antewall/charts/gh-actions-dashboard \
  --set ingress.enabled=true \
  --set ingress.className=nginx \
  --set "ingress.hosts[0].host=dashboard.example.com" \
  --set "ingress.hosts[0].paths[0].path=/" \
  --set "ingress.hosts[0].paths[0].pathType=Prefix" \
  --set secrets.githubWebhookSecret="your-webhook-secret"
```

For full documentation, see the [Helm chart README](./helm/gh-actions-dashboard/README.md).

---

## Docker Compose

This section explains how to deploy using Docker Compose with a self-hosted Convex backend.

## Architecture

The deployment includes two services:

1. **convex-backend** - Self-hosted Convex backend (SQLite storage by default)
2. **dashboard** - The GitHub Actions Dashboard frontend

## Prerequisites

- Docker and Docker Compose installed
- GitHub webhook configured for your repositories

## Quick Start

1. **Copy the environment file and configure it:**

   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**

   ```bash
   # Set a secure webhook secret (use a random string)
   GITHUB_WEBHOOK_SECRET=your-secret-here
   ```

3. **Start all services:**

   ```bash
   docker compose up -d
   ```

4. **Generate a Convex admin key:**

   ```bash
   docker compose exec convex-backend ./generate_admin_key.sh
   ```

   Save this key - you'll need it to deploy Convex functions.

5. **Deploy Convex functions:**

   In your project directory (not the deploy folder), create a `.env.local` file:

   ```bash
   CONVEX_SELF_HOSTED_URL='http://localhost:3210'
   CONVEX_SELF_HOSTED_ADMIN_KEY='<your admin key from step 4>'
   ```

   Then deploy:

   ```bash
   npx convex deploy
   ```

6. **Access the services:**

   - **Dashboard:** [http://localhost:3000](http://localhost:3000)
   - **Convex API:** [http://localhost:3210](http://localhost:3210)

## GitHub Webhook Setup

1. Go to your GitHub repository → **Settings** → **Webhooks**
2. Click **Add webhook**
3. Configure:
   - **Payload URL:** `https://your-server:3000/api/webhooks`
   - **Content type:** `application/json`
   - **Secret:** Same value as `GITHUB_WEBHOOK_SECRET` in your `.env`
   - **Events:** Select "Workflow runs" (or "Let me select individual events" → check "Workflow runs")
4. Save the webhook

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Dashboard | 3000 | GitHub Actions Dashboard UI |
| Convex API | 3210 | Convex backend API |
| Convex HTTP Actions | 3211 | Convex HTTP action endpoints |

## Data Persistence

By default, Convex stores data in SQLite within a Docker volume (`convex-data`). This persists across container restarts.

For production, consider:
- Using an external Postgres or MySQL database
- Setting up volume backups

### Using Postgres

```yaml
services:
  convex-backend:
    environment:
      - POSTGRES_URL=postgresql://user:pass@host:5432
      # - DO_NOT_REQUIRE_SSL=1  # Only for local dev
```

### Using MySQL

```yaml
services:
  convex-backend:
    environment:
      - MYSQL_URL=mysql://user:pass@host:3306
```

## Production Deployment

For production, update the environment variables in `docker-compose.yml`:

```yaml
services:
  convex-backend:
    environment:
      - CONVEX_CLOUD_ORIGIN=https://api.your-domain.com
      - CONVEX_SITE_ORIGIN=https://actions.your-domain.com

  dashboard:
    environment:
      - VITE_CONVEX_URL=https://api.your-domain.com
```

### Using a Reverse Proxy

Set up nginx, Traefik, or Caddy to:
- Forward `https://dashboard.example.com` → `localhost:3000`
- Forward `https://api.example.com` → `localhost:3210`

## Commands

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start all services in background |
| `docker compose down` | Stop and remove containers |
| `docker compose logs -f` | Follow all logs |
| `docker compose logs -f dashboard` | Follow dashboard logs only |
| `docker compose exec convex-backend ./generate_admin_key.sh` | Generate admin key |
| `docker compose up -d --build` | Rebuild and restart |

## Troubleshooting

### Dashboard not receiving webhooks

1. Ensure your server is publicly accessible
2. Check the webhook secret matches in both `.env` and GitHub
3. View webhook deliveries in GitHub: Repository → Settings → Webhooks → Recent Deliveries

### Convex backend not starting

```bash
# Check backend logs
docker compose logs convex-backend

# Verify health
curl http://localhost:3210/version
```

### Reset Convex data

⚠️ **Warning:** This deletes all data!

```bash
docker compose down -v
docker compose up -d
```

Then regenerate the admin key and redeploy functions.

## More Information

- [Convex Self-Hosted Documentation](https://github.com/get-convex/convex-backend/blob/main/self-hosted/README.md)
- [Convex Discord #self-hosted](https://discord.gg/convex)

## Using ngrok for Webhook Tunneling

If you're developing locally and need to receive GitHub webhooks, you can use ngrok to create a public tunnel.

1. **Get an ngrok authtoken** from [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken)

2. **Add to your `.env` file:**

   ```bash
   NGROK_AUTHTOKEN=your-ngrok-authtoken-here
   ```

3. **Uncomment the ngrok service** in `docker-compose.yml`:

   ```yaml
   ngrok:
     image: ngrok/ngrok:latest
     command: http dashboard:3000 --log stdout
     environment:
       - NGROK_AUTHTOKEN=${NGROK_AUTHTOKEN}
     ports:
       - "4040:4040"
     depends_on:
       - dashboard
     restart: unless-stopped
   ```

4. **Start the services:**

   ```bash
   docker compose up -d
   ```

5. **Get your public URL:**

   - Visit [http://localhost:4040](http://localhost:4040) for ngrok's web interface
   - Or check the logs: `docker compose logs ngrok`

6. **Configure GitHub webhook** with the ngrok URL:
   - Payload URL: `https://<random>.ngrok-free.app/api/webhooks`
