# AgentBox - AI Agent Management Platform

## Vision
Interface SaaS premium pour gérer des agents IA personnels. Chaque agent est un agent OpenClaw (Clawdbot) sous le capot.

## Règle fondamentale
OpenClaw = le moteur. AgentBox = l'interface.
TOUT ce qui est affiché dans l'UI DOIT correspondre à une vraie fonctionnalité OpenClaw.
Pas de feature fantôme, pas de promesse sans backend.

## Stack
- Frontend : Next.js + Tailwind + TypeScript + Lucide React + Framer Motion
- Backend (à venir) : OpenClaw API
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

## Fonctionnalités
- Dashboard "Mes Agents" avec cartes, photos, status, horaires, toggles
- Wizard création agent 4 étapes : Personnalité, Canaux, Skills, Review & Launch
- Templates d'agents prédéfinis
- Activité globale (à venir)
- Paramètres workspace (à venir)

## Mapping OpenClaw
- Agent = entrée dans agents.list de clawdbot.json
- Canaux = channels config de chaque agent
- Skills = skills installés et activés
- Toggle ON/OFF = agent enabled/disabled
- Horaires = heartbeat schedule + quiet hours
- Personnalité = SOUL.md de l'agent
- Instructions spéciales = AGENTS.md / system prompt

## Repo GitHub
- Real-Pixeldrop/agentbox (public)

## Dates
- 22/02/2026 : Création projet, premier proto fonctionnel
