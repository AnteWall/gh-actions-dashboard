{{/*
Expand the name of the chart.
*/}}
{{- define "gh-actions-dashboard.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "gh-actions-dashboard.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "gh-actions-dashboard.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "gh-actions-dashboard.labels" -}}
helm.sh/chart: {{ include "gh-actions-dashboard.chart" . }}
{{ include "gh-actions-dashboard.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "gh-actions-dashboard.selectorLabels" -}}
app.kubernetes.io/name: {{ include "gh-actions-dashboard.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Convex component labels
*/}}
{{- define "gh-actions-dashboard.convex.labels" -}}
{{ include "gh-actions-dashboard.labels" . }}
app.kubernetes.io/component: convex
{{- end }}

{{/*
Convex selector labels
*/}}
{{- define "gh-actions-dashboard.convex.selectorLabels" -}}
{{ include "gh-actions-dashboard.selectorLabels" . }}
app.kubernetes.io/component: convex
{{- end }}

{{/*
Dashboard component labels
*/}}
{{- define "gh-actions-dashboard.dashboard.labels" -}}
{{ include "gh-actions-dashboard.labels" . }}
app.kubernetes.io/component: dashboard
{{- end }}

{{/*
Dashboard selector labels
*/}}
{{- define "gh-actions-dashboard.dashboard.selectorLabels" -}}
{{ include "gh-actions-dashboard.selectorLabels" . }}
app.kubernetes.io/component: dashboard
{{- end }}

{{/*
ngrok component labels
*/}}
{{- define "gh-actions-dashboard.ngrok.labels" -}}
{{ include "gh-actions-dashboard.labels" . }}
app.kubernetes.io/component: ngrok
{{- end }}

{{/*
ngrok selector labels
*/}}
{{- define "gh-actions-dashboard.ngrok.selectorLabels" -}}
{{ include "gh-actions-dashboard.selectorLabels" . }}
app.kubernetes.io/component: ngrok
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "gh-actions-dashboard.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "gh-actions-dashboard.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Convex fullname
*/}}
{{- define "gh-actions-dashboard.convex.fullname" -}}
{{- printf "%s-convex" (include "gh-actions-dashboard.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Dashboard fullname
*/}}
{{- define "gh-actions-dashboard.dashboard.fullname" -}}
{{- printf "%s-dashboard" (include "gh-actions-dashboard.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
ngrok fullname
*/}}
{{- define "gh-actions-dashboard.ngrok.fullname" -}}
{{- printf "%s-ngrok" (include "gh-actions-dashboard.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Secret name
*/}}
{{- define "gh-actions-dashboard.secretName" -}}
{{- if .Values.secrets.existingSecret }}
{{- .Values.secrets.existingSecret }}
{{- else }}
{{- include "gh-actions-dashboard.fullname" . }}
{{- end }}
{{- end }}

{{/*
Convex internal URL
*/}}
{{- define "gh-actions-dashboard.convex.internalUrl" -}}
{{- printf "http://%s:%d" (include "gh-actions-dashboard.convex.fullname" .) (int .Values.convex.service.apiPort) }}
{{- end }}

{{/*
Convex HTTP Actions internal URL
*/}}
{{- define "gh-actions-dashboard.convex.httpActionsUrl" -}}
{{- printf "http://%s:%d" (include "gh-actions-dashboard.convex.fullname" .) (int .Values.convex.service.httpActionsPort) }}
{{- end }}

{{/*
Image pull secrets
*/}}
{{- define "gh-actions-dashboard.imagePullSecrets" -}}
{{- with .Values.global.imagePullSecrets }}
imagePullSecrets:
{{- toYaml . | nindent 2 }}
{{- end }}
{{- end }}
