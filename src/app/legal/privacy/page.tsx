"use client";

import React, { useState } from 'react';
import { Bot, Globe, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const betaBanner = {
  FR: "AgentBox est actuellement en phase beta. Les données et configurations créées pendant cette période pourraient être réinitialisées lors du passage en production. Nous ferons notre possible pour préserver vos données, mais aucune garantie n'est donnée pendant la phase beta.",
  EN: "AgentBox is currently in beta. Data and configurations created during this period may be reset when moving to production. We will do our best to preserve your data, but no guarantees are provided during the beta phase.",
};

type Lang = 'FR' | 'EN';

const content = {
  FR: {
    title: "Politique de Confidentialité",
    lastUpdated: "Dernière mise à jour : 23 février 2026",
    toc: "Sommaire",
    sections: [
      {
        id: "introduction",
        title: "1. Introduction",
        body: `Pixel Drop (« nous », « notre ») s'engage à protéger la vie privée des utilisateurs d'AgentBox. Cette politique décrit quelles données nous collectons, pourquoi, comment nous les utilisons et quels sont vos droits.\n\nPixel Drop est le responsable du traitement des données personnelles collectées via AgentBox.\n\nSiège social : 58 Rue de la Chaussée d'Antin, 75009 Paris, France\nContact DPO : contact@pixel-drop.com`,
      },
      {
        id: "donnees",
        title: "2. Données collectées",
        body: `Nous collectons les données suivantes :\n\n**Données de compte :**\n• Adresse email\n• Nom complet (facultatif)\n• Photo de profil (facultatif)\n• Mot de passe (haché, jamais stocké en clair)\n\n**Données d'utilisation :**\n• Configuration de vos agents (instructions, paramètres)\n• Fichiers uploadés dans votre espace de travail\n• Logs d'activité (connexions, actions dans l'application)\n• Données de performance des agents (nombre de messages, temps de réponse)\n\n**Données techniques :**\n• Adresse IP\n• Type de navigateur et système d'exploitation\n• Pages consultées et actions effectuées\n\n**Ce que nous ne collectons PAS :**\n• Les messages échangés entre vos agents et les utilisateurs finaux ne sont PAS stockés sur nos serveurs. Ils transitent en temps réel et ne sont pas conservés.`,
      },
      {
        id: "base-legale",
        title: "3. Base légale du traitement",
        body: `Nous traitons vos données sur les bases légales suivantes (RGPD, Art. 6) :\n\n• **Exécution du contrat** (Art. 6.1.b) : traitement nécessaire à la fourniture du service AgentBox (gestion de compte, déploiement d'agents, hébergement de fichiers)\n• **Consentement** (Art. 6.1.a) : pour les communications marketing (newsletter, mises à jour produit) — vous pouvez retirer votre consentement à tout moment\n• **Intérêt légitime** (Art. 6.1.f) : pour l'amélioration du service, la détection de fraude et la sécurité de la plateforme`,
      },
      {
        id: "retention",
        title: "4. Durée de conservation",
        body: `Nous conservons vos données selon les durées suivantes :\n\n• **Données de compte** (email, nom, profil) : pendant toute la durée de votre compte + 30 jours après suppression\n• **Logs techniques** (adresses IP, logs d'accès) : 90 jours\n• **Fichiers de workspace** : pendant la durée de votre compte, supprimés sous 30 jours après suppression du compte\n• **Messages des agents** : NON stockés — transit en temps réel uniquement\n• **Clés API** (BYOK) : chiffrées, supprimées immédiatement à la suppression du compte\n\nAprès ces délais, les données sont supprimées de manière irréversible.`,
      },
      {
        id: "tiers",
        title: "5. Partage de données et sous-traitants",
        body: `Nous ne vendons jamais vos données personnelles à des tiers.\n\nNous faisons appel aux sous-traitants suivants pour le fonctionnement du service :\n\n• **Supabase** (base de données et authentification) — Hébergement UE (AWS Frankfurt)\n• **Vercel** (hébergement de l'application web) — CDN mondial, données traitées selon leur DPA\n• **Fournisseurs d'IA** (Anthropic, OpenAI, Google, Mistral) — uniquement lorsque vos agents envoient des requêtes. Aucune donnée personnelle n'est partagée ; seul le contenu des messages est transmis pour générer les réponses.\n\nChaque sous-traitant est lié par un accord de traitement des données (DPA) conforme au RGPD.`,
      },
      {
        id: "droits",
        title: "6. Vos droits (RGPD)",
        body: `Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :\n\n• **Droit d'accès** : obtenir une copie de vos données personnelles\n• **Droit de rectification** : corriger des données inexactes\n• **Droit à l'effacement** : demander la suppression de vos données\n• **Droit à la portabilité** : recevoir vos données dans un format structuré et lisible\n• **Droit d'opposition** : vous opposer au traitement de vos données\n• **Droit à la limitation** : demander la limitation du traitement\n\nPour exercer ces droits, contactez-nous à : contact@pixel-drop.com\n\nNous répondrons dans un délai de 30 jours. Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr).`,
      },
      {
        id: "cookies",
        title: "7. Cookies",
        body: `AgentBox utilise uniquement des cookies strictement nécessaires au fonctionnement du service :\n\n• **Cookie de session** : maintient votre connexion active\n• **Cookie de préférences** : stocke votre choix de langue (FR/EN)\n\nNous n'utilisons aucun cookie de tracking, de publicité ou d'analyse. Aucun outil de suivi tiers (Google Analytics, Facebook Pixel, etc.) n'est intégré à AgentBox.\n\nCes cookies fonctionnels ne nécessitent pas votre consentement au sens de la directive ePrivacy.`,
      },
      {
        id: "securite",
        title: "8. Sécurité",
        body: `Nous mettons en œuvre les mesures de sécurité suivantes :\n\n• **Chiffrement AES-256** pour les données sensibles (clés API, identifiants)\n• **Chiffrement TLS/HTTPS** pour toutes les communications\n• **Environnement sandboxé** : chaque espace de travail est isolé (firejail)\n• **Hachage bcrypt** pour les mots de passe\n• **Authentification OAuth 2.0** via Google\n• **Pas d'accès réseau** depuis les environnements d'exécution des agents\n• **Sauvegardes chiffrées** quotidiennes\n\nEn cas de violation de données, nous vous informerons dans les 72 heures conformément à l'article 33 du RGPD.`,
      },
      {
        id: "transferts",
        title: "9. Transferts internationaux",
        body: `Vos données sont principalement hébergées dans l'Union Européenne (Supabase / AWS Frankfurt).\n\nCertains sous-traitants (Vercel, fournisseurs d'IA) peuvent traiter des données en dehors de l'UE. Dans ce cas, des garanties appropriées sont en place (clauses contractuelles types de la Commission européenne, décisions d'adéquation).`,
      },
      {
        id: "contact",
        title: "10. Contact",
        body: `Pour toute question relative à cette politique ou à vos données personnelles :\n\nPixel Drop — Délégué à la Protection des Données\n58 Rue de la Chaussée d'Antin, 75009 Paris\nEmail : contact@pixel-drop.com`,
      },
    ],
  },
  EN: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: February 23, 2026",
    toc: "Table of Contents",
    sections: [
      {
        id: "introduction",
        title: "1. Introduction",
        body: `Pixel Drop ("we", "our") is committed to protecting the privacy of AgentBox users. This policy describes what data we collect, why, how we use it, and what your rights are.\n\nPixel Drop is the data controller for personal data collected through AgentBox.\n\nHeadquarters: 58 Rue de la Chaussée d'Antin, 75009 Paris, France\nDPO Contact: contact@pixel-drop.com`,
      },
      {
        id: "donnees",
        title: "2. Data collected",
        body: `We collect the following data:\n\n**Account data:**\n• Email address\n• Full name (optional)\n• Profile picture (optional)\n• Password (hashed, never stored in plain text)\n\n**Usage data:**\n• Your agent configurations (instructions, settings)\n• Files uploaded to your workspace\n• Activity logs (logins, actions in the application)\n• Agent performance data (message count, response time)\n\n**Technical data:**\n• IP address\n• Browser type and operating system\n• Pages viewed and actions performed\n\n**What we do NOT collect:**\n• Messages exchanged between your agents and end users are NOT stored on our servers. They transit in real time and are not retained.`,
      },
      {
        id: "base-legale",
        title: "3. Legal basis for processing",
        body: `We process your data on the following legal bases (GDPR, Art. 6):\n\n• **Contract performance** (Art. 6.1.b): processing necessary for providing the AgentBox service (account management, agent deployment, file hosting)\n• **Consent** (Art. 6.1.a): for marketing communications (newsletter, product updates) — you can withdraw your consent at any time\n• **Legitimate interest** (Art. 6.1.f): for service improvement, fraud detection, and platform security`,
      },
      {
        id: "retention",
        title: "4. Data retention",
        body: `We retain your data for the following periods:\n\n• **Account data** (email, name, profile): for the duration of your account + 30 days after deletion\n• **Technical logs** (IP addresses, access logs): 90 days\n• **Workspace files**: for the duration of your account, deleted within 30 days after account deletion\n• **Agent messages**: NOT stored — real-time transit only\n• **API keys** (BYOK): encrypted, deleted immediately upon account deletion\n\nAfter these periods, data is irreversibly deleted.`,
      },
      {
        id: "tiers",
        title: "5. Data sharing and sub-processors",
        body: `We never sell your personal data to third parties.\n\nWe use the following sub-processors for service operation:\n\n• **Supabase** (database and authentication) — EU hosting (AWS Frankfurt)\n• **Vercel** (web application hosting) — Global CDN, data processed under their DPA\n• **AI providers** (Anthropic, OpenAI, Google, Mistral) — only when your agents send requests. No personal data is shared; only message content is transmitted to generate responses.\n\nEach sub-processor is bound by a GDPR-compliant Data Processing Agreement (DPA).`,
      },
      {
        id: "droits",
        title: "6. Your rights (GDPR)",
        body: `Under the General Data Protection Regulation (GDPR), you have the following rights:\n\n• **Right of access**: obtain a copy of your personal data\n• **Right to rectification**: correct inaccurate data\n• **Right to erasure**: request deletion of your data\n• **Right to portability**: receive your data in a structured, machine-readable format\n• **Right to object**: object to the processing of your data\n• **Right to restriction**: request limitation of processing\n\nTo exercise these rights, contact us at: contact@pixel-drop.com\n\nWe will respond within 30 days. If you believe your rights are not being respected, you may file a complaint with the CNIL (www.cnil.fr) or your local supervisory authority.`,
      },
      {
        id: "cookies",
        title: "7. Cookies",
        body: `AgentBox uses only strictly necessary cookies for the operation of the service:\n\n• **Session cookie**: keeps you logged in\n• **Preferences cookie**: stores your language choice (FR/EN)\n\nWe do not use any tracking, advertising, or analytics cookies. No third-party tracking tools (Google Analytics, Facebook Pixel, etc.) are integrated into AgentBox.\n\nThese functional cookies do not require your consent under the ePrivacy Directive.`,
      },
      {
        id: "securite",
        title: "8. Security",
        body: `We implement the following security measures:\n\n• **AES-256 encryption** for sensitive data (API keys, credentials)\n• **TLS/HTTPS encryption** for all communications\n• **Sandboxed environment**: each workspace is isolated (firejail)\n• **Bcrypt hashing** for passwords\n• **OAuth 2.0 authentication** via Google\n• **No network access** from agent execution environments\n• **Daily encrypted backups**\n\nIn the event of a data breach, we will notify you within 72 hours in accordance with GDPR Article 33.`,
      },
      {
        id: "transferts",
        title: "9. International transfers",
        body: `Your data is primarily hosted in the European Union (Supabase / AWS Frankfurt).\n\nSome sub-processors (Vercel, AI providers) may process data outside the EU. In such cases, appropriate safeguards are in place (EU Standard Contractual Clauses, adequacy decisions).`,
      },
      {
        id: "contact",
        title: "10. Contact",
        body: `For any questions regarding this policy or your personal data:\n\nPixel Drop — Data Protection Officer\n58 Rue de la Chaussée d'Antin, 75009 Paris\nEmail: contact@pixel-drop.com`,
      },
    ],
  },
};

export default function PrivacyPage() {
  const [lang, setLang] = useState<Lang>('FR');
  const t = content[lang];

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-slate-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0C]/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">AgentBox</span>
          </Link>
          <button
            onClick={() => setLang(lang === 'FR' ? 'EN' : 'FR')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === 'FR' ? 'EN' : 'FR'}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
        <p className="text-sm text-slate-500 mb-8">{t.lastUpdated}</p>

        {/* Beta banner */}
        <div className="mb-10 p-4 bg-amber-500/[0.08] border border-amber-500/20 rounded-xl flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200/90 leading-relaxed">{betaBanner[lang]}</p>
        </div>

        {/* Table of contents */}
        <nav className="mb-12 p-5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <h2 className="text-sm font-semibold text-white mb-3">{t.toc}</h2>
          <ul className="space-y-1.5">
            {t.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
        <div className="space-y-10">
          {t.sections.map((s) => (
            <section key={s.id} id={s.id}>
              <h2 className="text-xl font-semibold text-white mb-4">{s.title}</h2>
              <div className="text-slate-300 leading-relaxed whitespace-pre-line text-[15px]">
                {s.body.split(/(\*\*.*?\*\*)/).map((part, i) =>
                  part.startsWith('**') && part.endsWith('**') ? (
                    <strong key={i} className="text-white font-medium">{part.slice(2, -2)}</strong>
                  ) : (
                    <React.Fragment key={i}>{part}</React.Fragment>
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-wrap gap-6 text-xs text-slate-600">
          <Link href="/legal/mentions" className="hover:text-slate-400 transition-colors">{lang === 'FR' ? 'Mentions légales' : 'Legal Notice'}</Link>
          <Link href="/legal/terms" className="hover:text-slate-400 transition-colors">{lang === 'FR' ? 'CGU' : 'ToS'}</Link>
          <Link href="/legal/privacy" className="hover:text-slate-400 transition-colors">{lang === 'FR' ? 'Politique de confidentialité' : 'Privacy Policy'}</Link>
          <Link href="/legal/dpa" className="hover:text-slate-400 transition-colors">DPA</Link>
        </div>
      </main>
    </div>
  );
}
