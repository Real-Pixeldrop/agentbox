<<<<<<< HEAD
# AgentBox - État actuel (23/02/2026 13h00)

## Infrastructure

### VPS Hostinger (76.13.61.223)
- **OS**: Ubuntu 24.04, 8GB RAM, 96GB disk (4.3GB used)
- **Clawdbot gateway**: port 18789, systemd service `clawdbot-gateway.service`
- **AgentBox API**: port 18790, systemd service `agentbox-api.service`
- **Nginx**: reverse proxy, SSL Let's Encrypt
- **Domaine**: gateway.pixel-drop.com
  - `/` → WebSocket gateway (port 18789)
  - `/api/*` → AgentBox API (port 18790)
  - `/files/*` → AgentBox Files API (port 18790)
- **Token gateway**: FiqqVnVF--ZU7Ubej663Xzjh4uuu0YMqwF12-z_xWSM
- **OAuth Anthropic**: copié du Mac Mini

### AgentBox API (Node.js, port 18790)
- **Service**: `/etc/systemd/system/agentbox-api.service`
- **Code**: `/home/agentbox/api/server.js`
- **Config**: `/home/agentbox/api/.env`
- **Endpoints**:
  - `GET /api/health` - Health check (no auth)
  - `GET /api/workspace` - Workspace info (size, file count, quota)
  - `GET /api/files?path=xxx` - List dir or read file
  - `PUT /api/files` - Write file (body: {path, content})
  - `DELETE /api/files` - Delete file (body: {path})
  - `POST /api/sandbox/run` - Execute code (body: {language, code})
  - `GET /api/credentials` - List credentials (masked values)
  - `PUT /api/credentials` - Set credential (body: {key, value, type})
  - `DELETE /api/credentials` - Delete credential (body: {key})
  - `GET /api/credentials/get?key=xxx` - Get decrypted value (gateway-only)
  - `POST /api/download-url` - Generate signed download URL
  - `GET /api/download?token=xxx` - Download file with signed token
- **Auth**: Supabase JWT (from frontend) or Gateway token + X-User-Id (internal)

### Multi-tenant Workspace
- **Base path**: `/home/agentbox/users/{user_id}/`
- **Structure per user**:
  - `files/` - User uploads
  - `code/` - Code projects
  - `output/` - Agent-generated files
  - `.credentials/credentials.json` - Encrypted credentials (AES-256-CBC)
  - `README.md` - Auto-generated
- **Quota**: 500MB per user
- **Encryption key**: `/home/agentbox/.encryption_key` (generated on first deploy)

### Coding Sandbox
- **Firejail** installed for lightweight sandboxing
- **Docker** installed for heavier sandboxing (images: python:3.12-slim, node:22-slim)
- **Supported languages**: Python, JavaScript/Node.js, Bash
- **Limits**: 1GB RAM, 30s timeout, no network access
- **Output**: Generated files auto-detected and download URLs provided

### Frontend (Vercel)
- **URL**: https://agentbox-deploy.vercel.app
- **Repo**: Real-Pixeldrop/agentbox, branche production
- **Deploy**: via Mac Air SSH

### Supabase
- **URL**: https://dzjpcbyozghefwzurgta.supabase.co
- **Tables**:
  - `profiles` - User profiles (auto-created on signup)
  - `agents` - User agents with gateway mapping
  - `teams` - Agent teams
  - `team_members` - Team-agent join table
  - `user_settings` - Email credentials, GitHub, workspace info, preferences (NEW)
  - `user_api_keys` - BYOK API keys per user (NEW)
- **RLS**: All tables have row-level security (user can only access own data)

## Frontend - Page Settings (Enhanced)

### New sections (Beta):
1. **Email (IMAP/SMTP)** - Full email credentials form (host, port, user, password for both IMAP and SMTP)
2. **GitHub** - Token and username configuration
3. **API Keys** - BYOK system (Anthropic, OpenAI, Google, Mistral, Groq, Perplexity)
4. **Workspace Browser** - File explorer with:
   - Workspace stats (file count, size, quota usage)
   - Breadcrumb navigation
   - Directory browsing
   - File download via signed URLs
5. **Security** - Visual info about encryption, isolation, sandboxing

### Existing sections kept:
- Danger Zone (emergency stop)
- Profile (avatar, name, sign out)
- Billing (placeholder)
- Language (FR/EN)
- Notifications

### New client library:
- `src/lib/agentbox-api.ts` - API client for all VPS endpoints

## Architecture Summary

```
[User Browser] → [Vercel Frontend]
     ↓
[Supabase Auth] → JWT token
     ↓
[gateway.pixel-drop.com]
     ├── /api/* → AgentBox API (port 18790) — files, sandbox, credentials
     └── ws:// → Clawdbot Gateway (port 18789) — chat, agent control
            ↓
     [/home/agentbox/users/{user_id}/] — isolated workspace per user
```
=======
# AgentBox - État actuel (23/02/2026 03h00)

## Infrastructure
- **VPS Hostinger** : 76.13.61.223 (root pwd: ~/.config/agentbox/vps_root_password)
  - Clawdbot gateway port 18789, Nginx reverse proxy, SSL Let's Encrypt
  - Domaine : gateway.pixel-drop.com (wss://)
  - Token gateway : REDACTED_GATEWAY_TOKEN
  - OAuth Anthropic copié du Mac Mini
  - systemd service : clawdbot-gateway.service

- **Frontend Vercel** : https://agentbox-deploy.vercel.app
  - Repo : Real-Pixeldrop/agentbox, branche production
  - Deploy via Mac Air SSH : ssh akli@192.168.1.64, cd ~/Desktop/agentbox-deploy
  - Commande deploy : `npx vercel --prod --yes`
  - Env vars configurées sur Vercel (production only)

- **Supabase** : https://dzjpcbyozghefwzurgta.supabase.co
  - Anon key : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6anBjYnlvemdoZWZ3enVyZ3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MDM0MDAsImV4cCI6MjA4NzM3OTQwMH0.OtyEVayspVGjx2oT3DeluHftktot87L_0q8OcIcpVA4
  - Google OAuth configuré (client web 314994476238-ebq07p52ltj5ro4qc1orefa16bqh4iqm)
  - Site URL : https://agentbox-deploy.vercel.app
  - Tables : profiles, agents (avec RLS)
  - Akli s'est connecté via browser clawd (session active)

- **Google OAuth** : projet prospection-n8n-479922
  - Client web : 314994476238-[REDACTED].apps.googleusercontent.com
  - Secret : [REDACTED]
  - Audience : Externe, En production
  - Redirect URI : https://dzjpcbyozghefwzurgta.supabase.co/auth/v1/callback

## Branche production - dernier commit
- 974a21a : fix: move auth guard after all hooks (React hooks rules)

## Fichiers clés
- src/app/page.tsx : page principale avec auth guard
- src/app/layout.tsx : wraps AuthProvider > I18nProvider > GatewayProvider
- src/components/AuthPage.tsx : page login (dark, style Asriel, Google OAuth, FR/EN toggle)
- src/components/AuthContext.tsx : contexte auth Supabase
- src/lib/supabase.ts : client Supabase
- src/lib/GatewayContext.tsx : WebSocket gateway
- src/lib/i18n/ : traductions FR (défaut) et EN

## Bugs/TODO identifiés par Akli (03h01)
1. Auth guard ne marche pas - il est directement connecté au lieu de voir login
2. Données démo visibles - doit être vierge, skeleton loading, peut-être 1 agent exemple
3. Pas de bouton déconnexion
4. Inscription : formulaire basique (nom, prénom)
5. "Comment puis-je vous aider?" - le ? passe à la ligne, doit rester sur la même ligne
6. Paramètres gateway visibles - à cacher pour les users
7. "Déconnecté" visible - status gateway pas pour les users
8. "Ajouter équipe" doit fonctionner
9. Équipes doivent avoir une mini description
10. Menu 3 points sur cartes agents : assigner à équipe, supprimer, etc.
11. Pouvoir supprimer des équipes (sans supprimer les agents)
12. Tout doit être dynamique (pas de mock data)
>>>>>>> 42d93b34626a14577d1c19af28f26c774df72f28
