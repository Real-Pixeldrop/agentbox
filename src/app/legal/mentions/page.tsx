"use client";

import React, { useState } from 'react';
import { Bot, Globe, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

type Lang = 'FR' | 'EN';

const content = {
  FR: {
    title: "Mentions Légales",
    lastUpdated: "Dernière mise à jour : 23 février 2026",
    betaDisclaimer: "AgentBox est actuellement en phase beta. Les données et configurations créées pendant cette période pourraient être réinitialisées lors du passage en production. Nous ferons notre possible pour préserver vos données, mais aucune garantie n'est donnée pendant la phase beta.",
    sections: [
      {
        id: "editeur",
        title: "1. Éditeur du site",
        body: `Le site AgentBox est édité par :\n\nPixel Drop — Akli Goudjil\nStatut : Entrepreneur individuel\nAdresse : 58 Rue de la Chaussée d'Antin, 75009 Paris, France\nEmail : contact@pixel-drop.com\nTéléphone : 01 83 64 17 41\nSite web : https://www.pixel-drop.com`,
      },
      {
        id: "publication",
        title: "2. Directeur de la publication",
        body: `Le directeur de la publication est Akli Goudjil.\n\nContact : contact@pixel-drop.com`,
      },
      {
        id: "hebergement",
        title: "3. Hébergement",
        body: `Le site est hébergé par :\n\nVercel Inc.\n440 N Barranca Ave #4133, Covina, CA 91723, États-Unis\nhttps://vercel.com\n\nLes données sont stockées par :\n\nSupabase Inc.\nhttps://supabase.com`,
      },
      {
        id: "propriete",
        title: "4. Propriété intellectuelle",
        body: `AgentBox est un produit développé par Pixel Drop.\n\nL'ensemble du contenu du site AgentBox (textes, graphismes, images, logos, icônes, logiciels, code source) est la propriété exclusive de Pixel Drop ou de ses partenaires et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.\n\nToute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans l'autorisation écrite préalable de Pixel Drop.`,
      },
      {
        id: "donnees",
        title: "5. Protection des données personnelles",
        body: `Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez de droits sur vos données personnelles.\n\nPour toute question relative à vos données personnelles, vous pouvez contacter notre Délégué à la Protection des Données (DPO) :\n\nEmail : contact@pixel-drop.com\n\nPour plus d'informations, consultez notre Politique de Confidentialité.`,
      },
      {
        id: "cookies",
        title: "6. Cookies",
        body: `AgentBox utilise uniquement des cookies strictement nécessaires au fonctionnement du service (session, préférences de langue). Aucun cookie de tracking ou publicitaire n'est utilisé.\n\nPour plus d'informations, consultez notre Politique de Confidentialité.`,
      },
      {
        id: "contact",
        title: "7. Contact",
        body: `Pour toute question relative aux présentes mentions légales :\n\nPixel Drop\n58 Rue de la Chaussée d'Antin, 75009 Paris\nEmail : contact@pixel-drop.com\nTéléphone : 01 83 64 17 41`,
      },
    ],
  },
  EN: {
    title: "Legal Notice",
    lastUpdated: "Last updated: February 23, 2026",
    betaDisclaimer: "AgentBox is currently in beta. Data and configurations created during this period may be reset when moving to production. We will do our best to preserve your data, but no guarantees are made during the beta phase.",
    sections: [
      {
        id: "editeur",
        title: "1. Website publisher",
        body: `The AgentBox website is published by:\n\nPixel Drop — Akli Goudjil\nStatus: Sole proprietor (Entrepreneur individuel)\nAddress: 58 Rue de la Chaussée d'Antin, 75009 Paris, France\nEmail: contact@pixel-drop.com\nPhone: +33 1 83 64 17 41\nWebsite: https://www.pixel-drop.com`,
      },
      {
        id: "publication",
        title: "2. Publication director",
        body: `The publication director is Akli Goudjil.\n\nContact: contact@pixel-drop.com`,
      },
      {
        id: "hebergement",
        title: "3. Hosting",
        body: `The website is hosted by:\n\nVercel Inc.\n440 N Barranca Ave #4133, Covina, CA 91723, USA\nhttps://vercel.com\n\nData is stored by:\n\nSupabase Inc.\nhttps://supabase.com`,
      },
      {
        id: "propriete",
        title: "4. Intellectual property",
        body: `AgentBox is a product developed by Pixel Drop.\n\nAll content on the AgentBox website (text, graphics, images, logos, icons, software, source code) is the exclusive property of Pixel Drop or its partners and is protected by French and international intellectual property laws.\n\nAny reproduction, representation, modification, publication, or adaptation of all or part of the website elements, by any means or process, is prohibited without the prior written authorization of Pixel Drop.`,
      },
      {
        id: "donnees",
        title: "5. Personal data protection",
        body: `In accordance with the General Data Protection Regulation (GDPR) and the French Data Protection Act, you have rights over your personal data.\n\nFor any questions regarding your personal data, you can contact our Data Protection Officer (DPO):\n\nEmail: contact@pixel-drop.com\n\nFor more information, please refer to our Privacy Policy.`,
      },
      {
        id: "cookies",
        title: "6. Cookies",
        body: `AgentBox only uses cookies strictly necessary for the operation of the service (session, language preferences). No tracking or advertising cookies are used.\n\nFor more information, please refer to our Privacy Policy.`,
      },
      {
        id: "contact",
        title: "7. Contact",
        body: `For any questions regarding this legal notice:\n\nPixel Drop\n58 Rue de la Chaussée d'Antin, 75009 Paris\nEmail: contact@pixel-drop.com\nPhone: +33 1 83 64 17 41`,
      },
    ],
  },
};

export default function MentionsPage() {
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

        {/* Beta Disclaimer */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-200/90">{t.betaDisclaimer}</p>
          </div>
        </div>

        {/* Table of contents */}
        <nav className="mb-12 p-5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <h2 className="text-sm font-semibold text-white mb-3">{lang === 'FR' ? 'Sommaire' : 'Table of Contents'}</h2>
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
          <Link href="/legal/terms" className="hover:text-slate-400 transition-colors">{lang === 'FR' ? 'CGU' : 'ToS'}</Link>
          <Link href="/legal/privacy" className="hover:text-slate-400 transition-colors">{lang === 'FR' ? 'Politique de confidentialité' : 'Privacy Policy'}</Link>
          <Link href="/legal/dpa" className="hover:text-slate-400 transition-colors">DPA</Link>
          <Link href="/legal/mentions" className="hover:text-slate-400 transition-colors">{lang === 'FR' ? 'Mentions légales' : 'Legal Notice'}</Link>
        </div>
      </main>
    </div>
  );
}
