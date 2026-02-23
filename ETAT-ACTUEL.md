# AgentBox - État actuel (23/02/2026 03h00)

## Infrastructure
- **VPS Hostinger** : 76.13.61.223 (root pwd: ~/.config/agentbox/vps_root_password)
  - Clawdbot gateway port 18789, Nginx reverse proxy, SSL Let's Encrypt
  - Domaine : gateway.pixel-drop.com (wss://)
  - Token gateway : FiqqVnVF--ZU7Ubej663Xzjh4uuu0YMqwF12-z_xWSM
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
