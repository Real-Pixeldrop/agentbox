# AgentBox - AI Agent Management Platform

## Vision
Interface SaaS premium pour gérer des agents IA personnels. Chaque agent est un agent OpenClaw (Clawdbot) sous le capot.

## Règle fondamentale
OpenClaw = le moteur. AgentBox = l'interface.
TOUT ce qui est affiché dans l'UI DOIT correspondre à une vraie fonctionnalité OpenClaw.
Pas de feature fantôme, pas de promesse sans backend.
JAMAIS mentionner "OpenClaw" dans l'interface utilisateur. Les noms de fichiers (SOUL.md, MEMORY.md, TOOLS.md) sont OK.

## Stack
- Frontend : Next.js + Tailwind + TypeScript + Lucide React + Framer Motion
- Backend (à venir) : OpenClaw API REST
- Design : Dark theme premium, style Linear.app
- Design system : Stitch (Google) - projet ID 14308046150957446961

## Canaux supportés (vrais canaux OpenClaw)
- iMessage
- WhatsApp
- Telegram
- Discord
- Slack
- Signal
- Google Chat
- Email (IMAP/SMTP)

## Fonctionnalités (v3 - 23/02/2026)
- Home page style Lindy ("How can I help?", input central, suggestions rapides)
- Dashboard "Mes Agents" avec cartes, photos, status, couts/tokens, toggles, favoris
- Wizard création agent 3 étapes : Personnalité (SOUL), Skills, Review & Launch
- Clic agent = conversation (chat style iMessage) + onglet Channels
- Configuration canaux APRES création (chaque canal a son mini-setup)
- Templates d'agents (11 templates, 5 catégories)
- Page Teams (groupes d'agents, drag-and-drop)
- Page Activity (timeline avec filtres par type et agent)
- Page Settings (profil, billing, API keys, langue, notifications)
- Notifications (cloche avec badge + dropdown)
- i18n FR/EN (toggle dans sidebar + settings)
- Sidebar enrichie (favoris, teams, agents récents, profil)

## Mapping OpenClaw
- Agent = entrée dans agents.list de clawdbot.json
- Canaux = channels config de chaque agent
- Skills = skills installés et activés
- Toggle ON/OFF = agent enabled/disabled
- Horaires = heartbeat schedule + quiet hours
- Personnalité = SOUL.md de l'agent
- Instructions spéciales = AGENTS.md / system prompt

## Positionnement vs Lindy (analyse Trustpilot 23/02/2026)

### Faiblesses Lindy (2.4/5 Trustpilot)
1. Facturation toxique : charges sans consentement, impossible d'annuler, overcharges 350-550$
2. Support inexistant : pas de contact, emails ignorés, support = bot IA qui consomme des crédits
3. Produit pas fiable : lent (heures sans réponse), crashe, ne comprend pas les emails, IP bloquées
4. Crédits opaques : 5000 crédits consommés en 10 min, aucun avertissement

### Avantages AgentBox (notre positionnement)
1. TRANSPARENCE : couts en temps réel visibles dans l'UI (tokens + $ + barre de progression + alertes à 50/80/100%)
2. FIABILITÉ : mieux vaut 5 skills parfaites que 50 qui crashent. Chaque feature testée avant release
3. FACTURATION HONNÊTE : pas de surprise, annulation en 1 clic, jamais de charge sans confirmation
4. SUPPORT HUMAIN : email + chat, jamais un bot pour les problèmes de facturation
5. FREE TIER GÉNÉREUX : laisser tester VRAIMENT avant de payer, pas de piège "free trial auto-facturé"
6. OPEN SOURCE (moteur) : confiance, auditabilité, communauté

### Pricing envisagé
- Free : 1 agent, 100 messages/jour
- Pro 29-49€/mois : agents illimités, tous les canaux
- Enterprise : sur devis
- Modèle API : BYOK (Bring Your Own Key) ou tokens managés

## Repo GitHub
- Real-Pixeldrop/agentbox (public)

## Dates
- 22/02/2026 : Création projet, premier proto fonctionnel (dashboard + wizard + design premium)
- 23/02/2026 : v3 complète (home, i18n, teams, activity, settings, conversation, notifications, channels post-création)
- 23/02/2026 : Analyse concurrentielle Lindy, positionnement fiabilité/transparence
