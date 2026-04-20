export interface ExplainCard {
  id:    string
  title: string
  cards: { heading: string; body: string }[]
}

export const EXPLAINS: ExplainCard[] = [
  {
    id:    'anglophone-crisis',
    title: 'The Anglophone Crisis',
    cards: [
      { heading: 'What is it?',       body: "A conflict between Cameroon's French-speaking government and its English-speaking Northwest and Southwest regions, which were once British Southern Cameroons." },
      { heading: 'How did it start?', body: 'In 2016, lawyers and teachers protested the imposition of French in Anglophone courts and schools. The government responded with force, triggering armed resistance.' },
      { heading: 'Where are we now?', body: 'Since 2017, over 6,000 people have been killed and 700,000 displaced. Separatists seek an independent state called Ambazonia. Peace talks have repeatedly stalled.' },
    ],
  },
  {
    id:    'paul-biya',
    title: 'Who is Paul Biya?',
    cards: [
      { heading: 'The basics',              body: "Paul Biya has ruled Cameroon since 1982 — over 43 years. At 91, he is one of the world's longest-serving heads of state." },
      { heading: 'His power base',          body: 'Biya controls Cameroon through the CPDM party, which dominates parliament, the judiciary, and civil service. Opposition is routinely suppressed.' },
      { heading: 'The succession question', body: 'Biya has no confirmed successor. His prolonged absences from Cameroon fuel constant speculation about his health and who will succeed him.' },
    ],
  },
  {
    id:    'fecafoot',
    title: "FECAFOOT Explained",
    cards: [
      { heading: "What is FECAFOOT?", body: "The Fédération Camerounaise de Football — Cameroon's national football federation, responsible for the Indomitable Lions and all domestic football." },
      { heading: "The Eto'o era",     body: "Samuel Eto'o was elected president in 2021. His tenure has been marked by financial controversy, governance disputes, and clashes with the Ministry of Sports." },
      { heading: 'Why does it matter?', body: 'FECAFOOT controls millions in FIFA and CAF grants. Corruption allegations have led to FIFA investigations and threatened Cameroon\'s international football standing.' },
    ],
  },
  {
    id:    'bir',
    title: 'What is the BIR?',
    cards: [
      { heading: 'Definition',          body: "The Bataillon d'Intervention Rapide (BIR) is Cameroon's elite rapid reaction force, trained by Israel and the US, reporting directly to the presidency." },
      { heading: 'Role in the crisis',  body: 'The BIR has been deployed extensively in the Anglophone regions. Human rights groups have documented extrajudicial killings, village burnings, and torture by BIR units.' },
      { heading: 'International standing', body: 'Despite documented abuses, Western nations continue training and equipping the BIR, citing counterterrorism cooperation against Boko Haram in the Far North.' },
    ],
  },
  {
    id:    'cpdm',
    title: 'The CPDM Party',
    cards: [
      { heading: 'What is the CPDM?',   body: "The Cameroon People's Democratic Movement — the ruling party that has held power since 1985. It functions as a party-state, controlling most institutions." },
      { heading: 'How it maintains power', body: 'Through patronage networks, control of state media, electoral manipulation, and suppression of opposition. Dissenters face arrest, exile, or worse.' },
      { heading: 'After Biya',          body: 'No clear successor exists within the CPDM. The post-Biya transition is the most destabilising political question in Cameroon today.' },
    ],
  },
]
