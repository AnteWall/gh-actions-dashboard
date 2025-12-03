# GitHub Actions Dashboard Helm Chart

A Helm chart for deploying the GitHub Actions Dashboard with Convex backend on Kubernetes.

## Prerequisites

- Kubernetes 1.23+
- Helm 3.8+
- PV provisioner support in the underlying infrastructure (for Convex SQLite persistence)

## Installation

### From OCI Registry (Recommended)

The chart is published to GitHub Container Registry (GHCR):

```bash
# Add the OCI registry (no 'helm repo add' needed for OCI)
helm install gh-actions-dashboard oci://ghcr.io/antewall/charts/gh-actions-dashboard \
  --set secrets.githubWebhookSecret="your-webhook-secret"
```

### With Custom Values

```bash
helm install gh-actions-dashboard oci://ghcr.io/antewall/charts/gh-actions-dashboard \
  -f my-values.yaml
```

### From Source

```bash
git clone https://github.com/AnteWall/gh-actions-dashboard.git
cd gh-actions-dashboard

helm install gh-actions-dashboard ./deploy/helm/gh-actions-dashboard \
  --set secrets.githubWebhookSecret="your-webhook-secret"
```

## Configuration

### Quick Start Examples

#### Development with ngrok

```bash
helm install gh-actions-dashboard oci://ghcr.io/antewall/charts/gh-actions-dashboard \
  --set ngrok.enabled=true \
  --set ngrok.domain="your-subdomain.ngrok-free.dev" \
  --set secrets.githubWebhookSecret="your-webhook-secret" \
  --set secrets.ngrokAuthToken="your-ngrok-token"
```

#### Production with Ingress

```bash
helm install gh-actions-dashboard oci://ghcr.io/antewall/charts/gh-actions-dashboard \
  --set ingress.enabled=true \
  --set ingress.className=nginx \
  --set ingress.hosts[0].host=dashboard.example.com \
  --set ingress.hosts[0].paths[0].path=/ \
  --set ingress.hosts[0].paths[0].pathType=Prefix \
  --set secrets.existingSecret=my-existing-secret
```

### Using Existing Secrets

Create a secret with your sensitive values:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: gh-actions-dashboard-secrets
type: Opaque
stringData:
  github-webhook-secret: "your-webhook-secret"
  ngrok-authtoken: "your-ngrok-token"  # optional
  convex-admin-key: "your-admin-key"   # optional
```

Then reference it:

```bash
helm install gh-actions-dashboard oci://ghcr.io/antewall/charts/gh-actions-dashboard \
  --set secrets.existingSecret=gh-actions-dashboard-secrets
```

### All Configuration Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `nameOverride` | Override chart name | `""` |
| `fullnameOverride` | Override full name | `""` |
| `global.imagePullSecrets` | Global image pull secrets | `[]` |

#### Convex Backend

| Parameter | Description | Default |
|-----------|-------------|---------|
| `convex.enabled` | Enable Convex backend | `true` |
| `convex.image.repository` | Convex image | `ghcr.io/get-convex/convex-backend` |
| `convex.image.tag` | Image tag | `latest` |
| `convex.replicas` | Number of replicas (should be 1 for SQLite) | `1` |
| `convex.resources` | Resource requests/limits | `{}` |
| `convex.persistence.enabled` | Enable persistence | `true` |
| `convex.persistence.size` | PVC size | `10Gi` |
| `convex.persistence.storageClass` | Storage class | `""` |
| `convex.config.documentRetentionDelay` | Document retention in seconds | `"172800"` |
| `convex.config.rustLog` | Rust log level | `"info"` |

#### Dashboard

| Parameter | Description | Default |
|-----------|-------------|---------|
| `dashboard.enabled` | Enable dashboard | `true` |
| `dashboard.image.repository` | Dashboard image | `ghcr.io/antewall/gh-actions-dashboard` |
| `dashboard.image.tag` | Image tag | `latest` |
| `dashboard.replicas` | Number of replicas | `1` |
| `dashboard.resources` | Resource requests/limits | `{}` |
| `dashboard.service.type` | Service type | `ClusterIP` |
| `dashboard.service.port` | Service port | `3000` |

#### ngrok (Optional)

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ngrok.enabled` | Enable ngrok tunnel | `false` |
| `ngrok.domain` | Custom ngrok domain | `""` |
| `ngrok.image.repository` | ngrok image | `ngrok/ngrok` |
| `ngrok.image.tag` | Image tag | `latest` |
| `ngrok.service.port` | Web interface port | `4040` |

#### Secrets

| Parameter | Description | Default |
|-----------|-------------|---------|
| `secrets.existingSecret` | Use existing secret | `""` |
| `secrets.githubWebhookSecret` | GitHub webhook secret | `""` |
| `secrets.ngrokAuthToken` | ngrok auth token | `""` |
| `secrets.convexAdminKey` | Convex admin key | `""` |

#### Ingress

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `false` |
| `ingress.className` | Ingress class name | `""` |
| `ingress.annotations` | Ingress annotations | `{}` |
| `ingress.hosts` | Ingress hosts | See values.yaml |
| `ingress.tls` | TLS configuration | `[]` |

## Post-Installation

### Deploy Convex Functions

After installing the chart, you need to deploy the Convex functions:

1. Port-forward the Convex API:
   ```bash
   kubectl port-forward svc/<release-name>-gh-actions-dashboard-convex 3210:3210
   ```

2. Generate an admin key (if not already set):
   ```bash
   kubectl exec -it <convex-pod> -- ./generate_admin_key.sh
   ```

3. Deploy functions from your local machine:
   ```bash
   export CONVEX_SELF_HOSTED_URL=http://localhost:3210
   export CONVEX_SELF_HOSTED_ADMIN_KEY=<your-admin-key>
   npx convex deploy
   ```

### Configure GitHub Webhook

Configure your GitHub repository webhook:

1. Go to Repository → Settings → Webhooks → Add webhook
2. Set:
   - **Payload URL**: Your dashboard URL + `/api/webhooks`
   - **Content type**: `application/json`
   - **Secret**: Your webhook secret
   - **Events**: Select "Workflow runs"

## Upgrading

```bash
helm upgrade gh-actions-dashboard oci://ghcr.io/antewall/charts/gh-actions-dashboard \
  -f my-values.yaml
```

## Uninstalling

```bash
helm uninstall gh-actions-dashboard
```

**Note**: This will not delete the PVC for Convex data. To fully clean up:

```bash
kubectl delete pvc -l app.kubernetes.io/instance=gh-actions-dashboard
```

## Troubleshooting

### View Logs

```bash
# Dashboard logs
kubectl logs -l app.kubernetes.io/component=dashboard -f

# Convex logs
kubectl logs -l app.kubernetes.io/component=convex -f

# ngrok logs (includes tunnel URL)
kubectl logs -l app.kubernetes.io/component=ngrok -f
```

### Check Pod Status

```bash
kubectl get pods -l app.kubernetes.io/instance=gh-actions-dashboard
```

### Convex Health Check

```bash
kubectl exec -it <convex-pod> -- curl -s http://localhost:3210/version
```
