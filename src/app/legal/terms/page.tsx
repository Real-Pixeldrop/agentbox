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
    title: "Conditions Générales d'Utilisation",
    lastUpdated: "Dernière mise à jour : 23 février 2026",
    toc: "Sommaire",
    sections: [
      {
        id: "description",
        title: "1. Description du service",
        body: `AgentBox est une plateforme de gestion d'agents IA éditée par Pixel Drop, société par actions simplifiée immatriculée en France, dont le siège social est situé au 58 Rue de la Chaussée d'Antin, 75009 Paris.\n\nLa plateforme permet aux utilisateurs de créer, configurer et déployer des agents d'intelligence artificielle sur différents canaux de communication (WhatsApp, Email, Slack, etc.), de suivre leurs conversations et de gérer leur performance depuis un tableau de bord centralisé.`,
      },
      {
        id: "inscription",
        title: "2. Inscription et comptes",
        body: `Pour utiliser AgentBox, vous devez créer un compte en fournissant une adresse email valide et un mot de passe, ou en vous connectant via Google OAuth.\n\nVous êtes responsable de la confidentialité de vos identifiants de connexion. Toute activité réalisée sous votre compte est de votre responsabilité. Vous devez nous informer immédiatement de toute utilisation non autorisée de votre compte.\n\nVous vous engagez à fournir des informations exactes et à jour lors de votre inscription.`,
      },
      {
        id: "utilisation",
        title: "3. Utilisation acceptable",
        body: `En utilisant AgentBox, vous vous engagez à :\n\n• Ne pas utiliser le service à des fins illégales ou frauduleuses\n• Ne pas tenter de compromettre la sécurité de la plateforme\n• Ne pas envoyer de spam ou de contenu abusif via vos agents\n• Ne pas usurper l'identité d'un tiers\n• Ne pas utiliser vos agents pour collecter des données personnelles sans consentement\n• Respecter les conditions d'utilisation des services tiers connectés à vos agents\n• Ne pas surcharger intentionnellement l'infrastructure\n\nNous nous réservons le droit de suspendre ou résilier tout compte en violation de ces règles, sans préavis.`,
      },
      {
        id: "propriete",
        title: "4. Propriété intellectuelle",
        body: `La plateforme AgentBox, son code source, son design, ses marques et logos sont la propriété exclusive de Pixel Drop. Aucune licence n'est accordée sur ces éléments au-delà du droit d'utilisation du service.\n\nLes contenus que vous créez (configurations d'agents, instructions, fichiers uploadés) restent votre propriété. En les hébergeant sur AgentBox, vous nous accordez une licence limitée et nécessaire au fonctionnement du service (stockage, traitement, affichage).`,
      },
      {
        id: "ia",
        title: "5. Agents IA et limitation de responsabilité",
        body: `Les agents IA déployés via AgentBox utilisent des modèles de langage tiers (Anthropic, OpenAI, Google, etc.). Ces modèles peuvent produire des réponses inexactes, incomplètes ou inappropriées.\n\nPixel Drop ne garantit pas l'exactitude, la pertinence ou la fiabilité des réponses générées par les agents IA. Vous êtes seul responsable de la supervision de vos agents et de la vérification de leurs réponses.\n\nPixel Drop ne saurait être tenu responsable :\n\n• Des erreurs ou inexactitudes dans les réponses des agents\n• Des dommages directs ou indirects résultant de l'utilisation des agents\n• Des interruptions de service dues à des tiers (fournisseurs d'IA, hébergeurs)\n• De toute perte de données non causée par notre négligence\n\nDans tous les cas, la responsabilité totale de Pixel Drop est limitée au montant que vous avez payé pour le service au cours des 12 derniers mois.`,
      },
      {
        id: "resiliation",
        title: "6. Résiliation et suppression de compte",
        body: `Vous pouvez résilier votre compte à tout moment depuis les paramètres de l'application ou en contactant contact@pixel-drop.com.\n\nÀ la résiliation :\n• Vos agents seront immédiatement désactivés\n• Vos données de compte seront conservées 30 jours puis supprimées définitivement\n• Les logs techniques associés seront supprimés sous 90 jours\n\nPixel Drop peut résilier votre compte en cas de violation des présentes conditions, avec notification préalable sauf en cas d'urgence (activité illégale, risque de sécurité).`,
      },
      {
        id: "modifications",
        title: "7. Modifications des conditions",
        body: `Nous pouvons modifier ces conditions à tout moment. Les modifications significatives seront notifiées par email ou via l'application au moins 30 jours avant leur entrée en vigueur.\n\nVotre utilisation continue du service après l'entrée en vigueur des modifications vaut acceptation. Si vous n'acceptez pas les nouvelles conditions, vous devez cesser d'utiliser le service et supprimer votre compte.`,
      },
      {
        id: "droit",
        title: "8. Droit applicable et juridiction",
        body: `Les présentes conditions sont régies par le droit français.\n\nEn cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux compétents de Paris auront juridiction exclusive.\n\nSi une clause est jugée invalide, les autres clauses restent en vigueur.`,
      },
      {
        id: "contact",
        title: "9. Contact",
        body: `Pour toute question relative à ces conditions :\n\nPixel Drop\n58 Rue de la Chaussée d'Antin, 75009 Paris\nEmail : contact@pixel-drop.com`,
      },
    ],
  },
  EN: {
    title: "Terms of Service",
    lastUpdated: "Last updated: February 23, 2026",
    toc: "Table of Contents",
    sections: [
      {
        id: "description",
        title: "1. Service description",
        body: `AgentBox is an AI agent management platform published by Pixel Drop, a simplified joint-stock company registered in France, headquartered at 58 Rue de la Chaussée d'Antin, 75009 Paris.\n\nThe platform allows users to create, configure, and deploy artificial intelligence agents across various communication channels (WhatsApp, Email, Slack, etc.), monitor their conversations, and manage their performance from a centralized dashboard.`,
      },
      {
        id: "inscription",
        title: "2. Registration and accounts",
        body: `To use AgentBox, you must create an account by providing a valid email address and password, or by signing in via Google OAuth.\n\nYou are responsible for the confidentiality of your login credentials. All activity carried out under your account is your responsibility. You must notify us immediately of any unauthorized use of your account.\n\nYou agree to provide accurate and up-to-date information during registration.`,
      },
      {
        id: "utilisation",
        title: "3. Acceptable use",
        body: `By using AgentBox, you agree to:\n\n• Not use the service for illegal or fraudulent purposes\n• Not attempt to compromise the platform's security\n• Not send spam or abusive content through your agents\n• Not impersonate any third party\n• Not use your agents to collect personal data without consent\n• Comply with the terms of service of third-party services connected to your agents\n• Not intentionally overload the infrastructure\n\nWe reserve the right to suspend or terminate any account in violation of these rules, without prior notice.`,
      },
      {
        id: "propriete",
        title: "4. Intellectual property",
        body: `The AgentBox platform, its source code, design, trademarks, and logos are the exclusive property of Pixel Drop. No license is granted on these elements beyond the right to use the service.\n\nContent you create (agent configurations, instructions, uploaded files) remains your property. By hosting them on AgentBox, you grant us a limited license necessary for the operation of the service (storage, processing, display).`,
      },
      {
        id: "ia",
        title: "5. AI agents and limitation of liability",
        body: `AI agents deployed via AgentBox use third-party language models (Anthropic, OpenAI, Google, etc.). These models may produce inaccurate, incomplete, or inappropriate responses.\n\nPixel Drop does not guarantee the accuracy, relevance, or reliability of responses generated by AI agents. You are solely responsible for supervising your agents and verifying their responses.\n\nPixel Drop shall not be liable for:\n\n• Errors or inaccuracies in agent responses\n• Direct or indirect damages resulting from the use of agents\n• Service interruptions caused by third parties (AI providers, hosting services)\n• Any data loss not caused by our negligence\n\nIn all cases, Pixel Drop's total liability is limited to the amount you have paid for the service in the last 12 months.`,
      },
      {
        id: "resiliation",
        title: "6. Termination and account deletion",
        body: `You may terminate your account at any time from the application settings or by contacting contact@pixel-drop.com.\n\nUpon termination:\n• Your agents will be immediately deactivated\n• Your account data will be retained for 30 days then permanently deleted\n• Associated technical logs will be deleted within 90 days\n\nPixel Drop may terminate your account in case of violation of these terms, with prior notification except in emergencies (illegal activity, security risk).`,
      },
      {
        id: "modifications",
        title: "7. Changes to terms",
        body: `We may modify these terms at any time. Significant changes will be notified by email or through the application at least 30 days before they take effect.\n\nYour continued use of the service after the changes take effect constitutes acceptance. If you do not accept the new terms, you must stop using the service and delete your account.`,
      },
      {
        id: "droit",
        title: "8. Governing law and jurisdiction",
        body: `These terms are governed by French law.\n\nIn case of dispute, the parties agree to seek an amicable solution. Failing that, the competent courts of Paris shall have exclusive jurisdiction.\n\nIf any clause is deemed invalid, the remaining clauses shall remain in force.`,
      },
      {
        id: "contact",
        title: "9. Contact",
        body: `For any questions regarding these terms:\n\nPixel Drop\n58 Rue de la Chaussée d'Antin, 75009 Paris\nEmail: contact@pixel-drop.com`,
      },
    ],
  },
};

export default function TermsPage() {
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
                {s.body}
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
