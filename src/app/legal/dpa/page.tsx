"use client";

import React, { useState } from 'react';
import { Bot, Globe } from 'lucide-react';
import Link from 'next/link';

type Lang = 'FR' | 'EN';

const content = {
  FR: {
    title: "Accord de Traitement des Données (DPA)",
    lastUpdated: "Dernière mise à jour : 23 février 2026",
    toc: "Sommaire",
    sections: [
      {
        id: "objet",
        title: "1. Objet et durée",
        body: `Le présent Accord de Traitement des Données (« DPA ») est conclu entre :\n\n• **Le Responsable du traitement** (« Vous », le client AgentBox)\n• **Le Sous-traitant** : Pixel Drop, 58 Rue de la Chaussée d'Antin, 75009 Paris, France\n\nCe DPA complète les Conditions Générales d'Utilisation d'AgentBox et définit les obligations des parties concernant le traitement des données personnelles, conformément au Règlement (UE) 2016/679 (RGPD), en particulier son article 28.\n\nCe DPA est en vigueur pendant toute la durée de votre utilisation d'AgentBox et prend fin à la suppression de votre compte et à l'effacement complet de vos données.`,
      },
      {
        id: "nature",
        title: "2. Nature et finalité du traitement",
        body: `Pixel Drop traite les données personnelles pour le compte du client dans le cadre de la fourniture du service AgentBox :\n\n• **Finalité** : permettre la création, la configuration et le fonctionnement d'agents IA ; le routage de messages entre les utilisateurs et les agents IA ; le stockage des configurations et fichiers de l'espace de travail\n• **Type de traitement** : collecte, enregistrement, stockage, consultation, utilisation, transmission par API, suppression\n• **Pas de conservation des messages** : les messages échangés entre les agents et les utilisateurs finaux transitent en temps réel et ne sont pas stockés par Pixel Drop`,
      },
      {
        id: "donnees",
        title: "3. Types de données personnelles",
        body: `Les catégories de données personnelles traitées incluent :\n\n• Données d'identification (email, nom)\n• Données d'authentification (mot de passe haché, tokens OAuth)\n• Données de configuration (paramètres des agents, instructions)\n• Fichiers uploadés dans l'espace de travail\n• Données techniques (adresses IP, logs d'accès)\n• Clés API fournies par le client (chiffrées)\n• Métadonnées d'utilisation (statistiques de performance des agents)`,
      },
      {
        id: "personnes",
        title: "4. Catégories de personnes concernées",
        body: `Les personnes dont les données sont traitées :\n\n• **Utilisateurs du client** : personnes disposant d'un compte AgentBox\n• **Utilisateurs finaux** : personnes interagissant avec les agents IA déployés par le client (données en transit uniquement, non stockées)`,
      },
      {
        id: "obligations",
        title: "5. Obligations du sous-traitant",
        body: `Pixel Drop s'engage à :\n\n• Traiter les données uniquement sur instruction documentée du responsable du traitement\n• Garantir la confidentialité des données — tout le personnel ayant accès aux données est soumis à une obligation de confidentialité\n• Mettre en œuvre les mesures de sécurité décrites à l'article 6\n• Ne pas faire appel à un autre sous-traitant sans autorisation préalable (voir article 7)\n• Assister le responsable du traitement dans l'exercice des droits des personnes concernées\n• Assister le responsable du traitement dans ses obligations relatives à la sécurité, la notification de violations, les analyses d'impact (articles 32 à 36 du RGPD)\n• Supprimer ou restituer toutes les données à la fin du contrat (voir article 9)\n• Mettre à disposition les informations nécessaires pour démontrer la conformité et permettre les audits`,
      },
      {
        id: "securite",
        title: "6. Mesures de sécurité",
        body: `Conformément à l'article 32 du RGPD, Pixel Drop met en œuvre les mesures techniques et organisationnelles suivantes :\n\n**Mesures techniques :**\n• Chiffrement AES-256 pour les données sensibles au repos\n• Chiffrement TLS 1.3 pour les données en transit\n• Hachage bcrypt pour les mots de passe\n• Environnements sandboxés (firejail) pour chaque espace de travail\n• Pas d'accès réseau depuis les environnements d'exécution\n• Sauvegardes quotidiennes chiffrées\n• Authentification à deux facteurs disponible (OAuth 2.0)\n\n**Mesures organisationnelles :**\n• Accès aux données limité au personnel strictement nécessaire\n• Formation du personnel à la protection des données\n• Procédure documentée de réponse aux incidents\n• Revue régulière des accès et des permissions`,
      },
      {
        id: "sous-traitance",
        title: "7. Sous-traitance ultérieure",
        body: `Pixel Drop fait appel aux sous-traitants ultérieurs suivants :\n\n| Sous-traitant | Service | Localisation | Données traitées |\n|---|---|---|---|\n| Supabase (AWS) | Base de données, authentification | UE (Frankfurt) | Données de compte, configurations |\n| Vercel | Hébergement web, CDN | Mondial (US/EU) | Pages web, assets statiques |\n| Anthropic | API IA (Claude) | États-Unis | Contenu des messages (transit) |\n| OpenAI | API IA (GPT) | États-Unis | Contenu des messages (transit) |\n| Google | API IA (Gemini), OAuth | États-Unis/UE | Contenu des messages (transit), auth |\n\nEn utilisant AgentBox, vous autorisez le recours à ces sous-traitants. Nous vous informerons de tout changement de sous-traitant avec un préavis de 30 jours. Vous pouvez vous opposer à un nouveau sous-traitant ; en cas de désaccord, vous pourrez résilier votre compte.\n\nChaque sous-traitant ultérieur est lié par un accord offrant un niveau de protection équivalent à ce DPA.`,
      },
      {
        id: "violation",
        title: "8. Notification de violation de données",
        body: `Conformément à l'article 33 du RGPD :\n\n• Pixel Drop notifiera le responsable du traitement de toute violation de données personnelles **dans les 72 heures** suivant sa découverte\n• La notification inclura : la nature de la violation, les catégories et le nombre approximatif de personnes concernées, les conséquences probables, les mesures prises ou proposées pour remédier à la violation\n• Pixel Drop assistera le responsable du traitement dans la notification aux personnes concernées si nécessaire (article 34 du RGPD)\n• Pixel Drop documentera toute violation, y compris les faits, les effets et les mesures correctives`,
      },
      {
        id: "fin",
        title: "9. Fin du contrat — Suppression et restitution",
        body: `À la fin de la relation contractuelle (suppression du compte, résiliation) :\n\n• **Restitution** : sur demande, Pixel Drop fournira une exportation de vos données dans un format structuré (JSON) avant suppression\n• **Suppression** : toutes les données personnelles seront supprimées dans les délais suivants :\n  — Données de compte : 30 jours après la suppression du compte\n  — Fichiers de workspace : 30 jours\n  — Logs techniques : 90 jours\n  — Clés API : suppression immédiate\n  — Sauvegardes : suppression lors du prochain cycle de rotation (max 30 jours)\n\n• Pixel Drop fournira une confirmation écrite de la suppression sur demande`,
      },
      {
        id: "conformite",
        title: "10. Conformité RGPD",
        body: `Ce DPA est conforme aux exigences suivantes du RGPD :\n\n• **Article 28** : obligations du sous-traitant et contenu du contrat de sous-traitance\n• **Article 32** : sécurité du traitement (mesures techniques et organisationnelles)\n• **Article 33** : notification des violations de données à l'autorité de contrôle\n• **Article 34** : communication des violations aux personnes concernées\n• **Articles 44-49** : transferts internationaux (clauses contractuelles types)\n\nPour les transferts de données vers des pays tiers, Pixel Drop s'appuie sur les clauses contractuelles types adoptées par la Commission européenne (décision 2021/914).`,
      },
      {
        id: "contact",
        title: "11. Contact",
        body: `Pour toute question relative à ce DPA :\n\nPixel Drop — Délégué à la Protection des Données\n58 Rue de la Chaussée d'Antin, 75009 Paris\nEmail : contact@pixel-drop.com`,
      },
    ],
  },
  EN: {
    title: "Data Processing Agreement (DPA)",
    lastUpdated: "Last updated: February 23, 2026",
    toc: "Table of Contents",
    sections: [
      {
        id: "objet",
        title: "1. Purpose and duration",
        body: `This Data Processing Agreement ("DPA") is entered into between:\n\n• **The Data Controller** ("You", the AgentBox customer)\n• **The Data Processor**: Pixel Drop, 58 Rue de la Chaussée d'Antin, 75009 Paris, France\n\nThis DPA supplements the AgentBox Terms of Service and defines the obligations of the parties regarding the processing of personal data, in accordance with Regulation (EU) 2016/679 (GDPR), in particular Article 28.\n\nThis DPA is effective for the entire duration of your use of AgentBox and terminates upon the deletion of your account and the complete erasure of your data.`,
      },
      {
        id: "nature",
        title: "2. Nature and purpose of processing",
        body: `Pixel Drop processes personal data on behalf of the customer for the provision of the AgentBox service:\n\n• **Purpose**: enabling the creation, configuration, and operation of AI agents; routing messages between users and AI agents; storing workspace configurations and files\n• **Type of processing**: collection, recording, storage, consultation, use, transmission via API, deletion\n• **No message retention**: messages exchanged between agents and end users transit in real time and are not stored by Pixel Drop`,
      },
      {
        id: "donnees",
        title: "3. Types of personal data",
        body: `Categories of personal data processed include:\n\n• Identification data (email, name)\n• Authentication data (hashed password, OAuth tokens)\n• Configuration data (agent settings, instructions)\n• Files uploaded to the workspace\n• Technical data (IP addresses, access logs)\n• API keys provided by the customer (encrypted)\n• Usage metadata (agent performance statistics)`,
      },
      {
        id: "personnes",
        title: "4. Categories of data subjects",
        body: `Persons whose data is processed:\n\n• **Customer users**: persons with an AgentBox account\n• **End users**: persons interacting with AI agents deployed by the customer (transit data only, not stored)`,
      },
      {
        id: "obligations",
        title: "5. Processor obligations",
        body: `Pixel Drop commits to:\n\n• Process data only on documented instructions from the data controller\n• Ensure data confidentiality — all personnel with data access are bound by confidentiality obligations\n• Implement the security measures described in section 6\n• Not engage another processor without prior authorization (see section 7)\n• Assist the data controller in fulfilling data subject rights\n• Assist the data controller with security obligations, breach notifications, and impact assessments (GDPR Articles 32–36)\n• Delete or return all data at the end of the contract (see section 9)\n• Make available all information necessary to demonstrate compliance and allow audits`,
      },
      {
        id: "securite",
        title: "6. Security measures",
        body: `In accordance with GDPR Article 32, Pixel Drop implements the following technical and organizational measures:\n\n**Technical measures:**\n• AES-256 encryption for sensitive data at rest\n• TLS 1.3 encryption for data in transit\n• Bcrypt hashing for passwords\n• Sandboxed environments (firejail) for each workspace\n• No network access from execution environments\n• Daily encrypted backups\n• Two-factor authentication available (OAuth 2.0)\n\n**Organizational measures:**\n• Data access limited to strictly necessary personnel\n• Staff training on data protection\n• Documented incident response procedures\n• Regular review of access and permissions`,
      },
      {
        id: "sous-traitance",
        title: "7. Sub-processing",
        body: `Pixel Drop engages the following sub-processors:\n\n| Sub-processor | Service | Location | Data processed |\n|---|---|---|---|\n| Supabase (AWS) | Database, authentication | EU (Frankfurt) | Account data, configurations |\n| Vercel | Web hosting, CDN | Global (US/EU) | Web pages, static assets |\n| Anthropic | AI API (Claude) | United States | Message content (transit) |\n| OpenAI | AI API (GPT) | United States | Message content (transit) |\n| Google | AI API (Gemini), OAuth | US/EU | Message content (transit), auth |\n\nBy using AgentBox, you authorize the use of these sub-processors. We will inform you of any sub-processor changes with 30 days notice. You may object to a new sub-processor; in case of disagreement, you may terminate your account.\n\nEach sub-processor is bound by an agreement providing an equivalent level of protection to this DPA.`,
      },
      {
        id: "violation",
        title: "8. Data breach notification",
        body: `In accordance with GDPR Article 33:\n\n• Pixel Drop will notify the data controller of any personal data breach **within 72 hours** of becoming aware of it\n• The notification will include: the nature of the breach, the categories and approximate number of data subjects affected, the likely consequences, and the measures taken or proposed to address the breach\n• Pixel Drop will assist the data controller in notifying data subjects if required (GDPR Article 34)\n• Pixel Drop will document any breach, including the facts, effects, and corrective measures`,
      },
      {
        id: "fin",
        title: "9. End of contract — Deletion and return",
        body: `Upon termination of the contractual relationship (account deletion, termination):\n\n• **Return**: upon request, Pixel Drop will provide an export of your data in a structured format (JSON) before deletion\n• **Deletion**: all personal data will be deleted within the following timeframes:\n  — Account data: 30 days after account deletion\n  — Workspace files: 30 days\n  — Technical logs: 90 days\n  — API keys: immediate deletion\n  — Backups: deletion at the next rotation cycle (max 30 days)\n\n• Pixel Drop will provide written confirmation of deletion upon request`,
      },
      {
        id: "conformite",
        title: "10. GDPR compliance",
        body: `This DPA complies with the following GDPR requirements:\n\n• **Article 28**: processor obligations and processing contract content\n• **Article 32**: security of processing (technical and organizational measures)\n• **Article 33**: notification of data breaches to supervisory authority\n• **Article 34**: communication of breaches to data subjects\n• **Articles 44–49**: international transfers (Standard Contractual Clauses)\n\nFor data transfers to third countries, Pixel Drop relies on the Standard Contractual Clauses adopted by the European Commission (Decision 2021/914).`,
      },
      {
        id: "contact",
        title: "11. Contact",
        body: `For any questions regarding this DPA:\n\nPixel Drop — Data Protection Officer\n58 Rue de la Chaussée d'Antin, 75009 Paris\nEmail: contact@pixel-drop.com`,
      },
    ],
  },
};

export default function DpaPage() {
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
          <Link href="/legal/terms" className="hover:text-slate-400 transition-colors">{lang === 'FR' ? 'CGU' : 'ToS'}</Link>
          <Link href="/legal/privacy" className="hover:text-slate-400 transition-colors">{lang === 'FR' ? 'Politique de confidentialité' : 'Privacy Policy'}</Link>
          <Link href="/legal/dpa" className="hover:text-slate-400 transition-colors">DPA</Link>
        </div>
      </main>
    </div>
  );
}
