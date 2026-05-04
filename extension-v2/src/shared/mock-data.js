// Mocked data for the user test. Single source of truth for all UI components.
window.BB_MOCK = {
  // Locked category palette — MUST mirror tokens.css --bb-cat-* variables.
  // Used by stacked bar, labels, channel cards, recent watches dropdown.
  // Changing a hue here means updating tokens.css too.
  categoryColors: {
    Conspiracy:     '#DC2626',
    Misinformation: '#B91C1C',
    Politics:       '#D97706',
    News:           '#EA580C',
    Finance:        '#65A30D',
    Tech:           '#DC5C4D',
    Music:          '#2563EB',
    Gaming:         '#059669',
    Sports:         '#0891B2',
    Documentary:    '#7C3AED',
    Education:      '#6D28D9',
    Lifestyle:      '#DB2777',
    Vlogs:          '#B45309',
    Entertainment:  '#C026D3',
    Other:          '#6B7280'
  },

  // Categories considered "F4 risk" — only these get the red delta treatment
  // when their share INCREASES week-over-week. All other deltas are neutral.
  // Source: research findings F4 (category stigmatisation).
  riskCategories: ['Conspiracy', 'Misinformation', 'Politics', 'News'],

  weeklyMirror: {
    dateRange: 'April 20 - 26',
    // Colors below resolved at runtime from categoryColors via colorFor().
    diet: [
      { label: 'Tech',     percent: 72, delta: -12 },
      { label: 'Politics', percent: 18, delta:  +5 },
      { label: 'Music',    percent: 10, delta:  +7 }
    ],
    vsLastWeek: {
      direction: 'broader',
      change: -9,
      label: 'broader than last week'
    },
    newChannels: [
      { name: 'The Daily Show',    tags: [{ text: 'Entertainment' }, { text: 'Politics' }], category: 'Entertainment' },
      { name: 'The best of Music', tags: [{ text: 'Music' }],                                category: 'Music' },
      { name: 'HugoDécrypte',      tags: [{ text: 'Politics' }, { text: 'News' }],          category: 'Politics' },
      { name: 'Cozy Gamers',       tags: [{ text: 'Gaming' }],                              category: 'Gaming' },
      { name: '52 minutes RTS',    tags: [{ text: 'Entertainment' }, { text: 'News' }],     category: 'Entertainment' },
      { name: 'The Humorist',      tags: [{ text: 'Entertainment' }],                       category: 'Entertainment' }
    ]
  },

  similarBanner: {
    text: 'You have been watching similar content for a while. Want to discover something different ?',
    yesLabel: 'Yes, show me',
    noLabel:  'No thanks'
  },

  whyThisVideo: {
    // Generic reason — in real product this would be derived from history.
    defaultReason: 'This Video was recommended because you have been watching similar content recently'
  },

  // Composite "average YouTube user" diet, used as a baseline when the user
  // has no previous-week data to compare against. Numbers are illustrative
  // (loosely informed by Pew/Reuters reports on YouTube consumption).
  avgUserDiet: {
    Tech:          12,
    Politics:       8,
    News:          10,
    Music:         18,
    Gaming:        14,
    Entertainment: 16,
    Education:      6,
    Lifestyle:      8,
    Sports:         5,
    Vlogs:          3
  },

  // Curated channel suggestions per category for "New channels to explore".
  // Used when we want to surface real discovery candidates (channels the user
  // is not currently exposed to in their feed). Channel names + handles are
  // public knowledge; avatars resolve via youtube.com favicons.
  curatedChannels: {
    Politics: [
      { name: 'HugoDécrypte - Actus du jour', handle: '@HugoDecrypteActus' },
      { name: 'Mediapart',                    handle: '@Mediapart' },
      { name: 'Blast, Le souffle de l\'info', handle: '@Blast-Officiel' },
      { name: 'Thinkerview',                  handle: '@thinkerview' },
      { name: 'Last Week Tonight',            handle: '@LastWeekTonight' }
    ],
    News: [
      { name: 'Le Monde',                     handle: '@lemondefr' },
      { name: 'BBC News',                     handle: '@BBCNews' },
      { name: 'France 24',                    handle: '@FRANCE24' },
      { name: 'DW News',                      handle: '@dwnews' },
      { name: 'Reuters',                      handle: '@Reuters' }
    ],
    Tech: [
      { name: 'Marques Brownlee',             handle: '@mkbhd' },
      { name: 'Fireship',                     handle: '@Fireship' },
      { name: 'Underscore_',                  handle: '@Underscore_' },
      { name: 'Micode',                       handle: '@Micode' },
      { name: 'The Verge',                    handle: '@TheVerge' }
    ],
    Music: [
      { name: 'Tiny Desk Concerts (NPR)',     handle: '@nprmusic' },
      { name: 'COLORS',                       handle: '@colors' },
      { name: 'KEXP',                         handle: '@kexp' },
      { name: 'La Blogothèque',               handle: '@blogotheque' },
      { name: 'Boiler Room',                  handle: '@boilerroom' }
    ],
    Gaming: [
      { name: 'GameSpot',                     handle: '@gamespot' },
      { name: 'IGN',                          handle: '@IGN' },
      { name: 'Joueur du Grenier',            handle: '@LeJoueurDuGrenier' },
      { name: 'Karmine Corp',                 handle: '@KarmineCorp' },
      { name: 'NoClip',                       handle: '@NoclipDocs' }
    ],
    Sports: [
      { name: 'Eurosport',                    handle: '@Eurosport' },
      { name: 'Tifo Football',                handle: '@tifofootball' },
      { name: 'NBA',                          handle: '@NBA' },
      { name: 'F1',                           handle: '@Formula1' },
      { name: 'Olympics',                     handle: '@olympics' }
    ],
    Documentary: [
      { name: 'ARTE',                         handle: '@ARTE' },
      { name: 'National Geographic',          handle: '@NatGeo' },
      { name: 'BBC Earth',                    handle: '@bbcearth' },
      { name: 'DW Documentary',               handle: '@DWDocumentary' },
      { name: 'Vice News',                    handle: '@VICENews' }
    ],
    Education: [
      { name: 'Kurzgesagt – In a Nutshell',   handle: '@kurzgesagt' },
      { name: 'Veritasium',                   handle: '@veritasium' },
      { name: '3Blue1Brown',                  handle: '@3blue1brown' },
      { name: 'Science4All',                  handle: '@Science4Allfrancais' },
      { name: 'TED-Ed',                       handle: '@TEDEducation' }
    ],
    Lifestyle: [
      { name: 'Bon Appétit',                  handle: '@bonappetit' },
      { name: 'Yoga With Adriene',            handle: '@yogawithadriene' },
      { name: 'Fun For Louis',                handle: '@FunForLouis' },
      { name: 'Pick Up Limes',                handle: '@PickUpLimes' },
      { name: 'Architectural Digest',         handle: '@Archdigest' }
    ],
    Vlogs: [
      { name: 'Casey Neistat',                handle: '@CaseyNeistat' },
      { name: 'Emma Chamberlain',             handle: '@emmachamberlain' },
      { name: 'Peter McKinnon',               handle: '@PeterMcKinnon' },
      { name: 'Andrew Huang',                 handle: '@andrewhuang' },
      { name: 'Sarah Beth Yoga',              handle: '@SarahBethYoga' }
    ],
    Entertainment: [
      { name: 'Hot Ones',                     handle: '@firstwefeast' },
      { name: 'Saturday Night Live',          handle: '@saturdaynightlive' },
      { name: 'Have a Seat with Chris',       handle: '@HaveaSeatwithChris' },
      { name: 'Jubilee',                      handle: '@jubilee' },
      { name: 'Cyprien',                      handle: '@MonsieurDream' }
    ],
    Finance: [
      { name: 'Coin Bureau',                  handle: '@CoinBureau' },
      { name: 'The Plain Bagel',              handle: '@ThePlainBagel' },
      { name: 'Heresy Financial',             handle: '@HeresyFinancial' },
      { name: 'Ben Felix',                    handle: '@BenFelixCSI' },
      { name: 'CNBC Television',              handle: '@CNBCtelevision' }
    ]
  },

  // Categories ordered by specificity. The classifier uses first-match-wins,
  // so highly distinctive categories (Conspiracy, Misinformation) come before
  // broad ones (Entertainment) — otherwise a "comedy news" video could be
  // mis-categorised as Entertainment when it's actually political.
  categoryKeywords: {
    Conspiracy: [
      'conspiration', 'conspiracy', 'flat earth', 'terre plate', 'illuminati',
      'reptilien', 'qanon', 'great reset', 'nouvel ordre mondial',
      'new world order', 'they don\'t want you to know', 'éveillé',
      'truth they hide', 'reveal the truth', 'reptilians', 'chemtrails',
      '5g danger', 'mind control', 'cabale', 'pizzagate', 'épstein réseau',
      'soros', 'globaliste', 'big pharma cover', 'plandemie'
    ],
    Misinformation: [
      'fake news', 'désinformation', 'plandemic', 'covid hoax', 'vaccin tue',
      'vaccine kills', 'media menteur', 'censure', 'censored truth',
      'shadowban', 'they removed this', 'banned video', 'truth bomb'
    ],
    Politics: [
      'politic', 'politique', 'trump', 'biden', 'macron', 'mélenchon',
      'le pen', 'zemmour', 'election', 'élection', 'gouvernement',
      'government', 'parlement', 'congress', 'senate', 'sénat',
      'hugodécrypte', 'hugo décrypte', 'mediapart', 'le grand soir',
      'thinkerview', 'blast', 'arrêt sur images', 'usul', 'osons causer',
      'opinion publique', 'manipuler', 'propagande', 'campagne',
      'président', 'ministre', 'député', 'sénateur', 'parti', 'congrès',
      'assemblée', 'last week tonight', 'daily show', 'john oliver',
      'tucker carlson', 'rachel maddow', 'opinion column', 'editorial',
      'guerre', 'ukraine', 'gaza', 'israël', 'palestine'
    ],
    News: [
      'breaking', 'breaking news', 'actualité', 'actualités', 'journal télévisé',
      'jt 20h', 'jt 13h', '20h france', '13h france', 'le monde',
      'figaro', 'libération', 'tf1', 'bfm', 'rmc', 'cnn', 'fox news',
      'msnbc', 'bbc news', 'arte info', 'rts info', 'al jazeera',
      'reuters', 'france 24', 'france info', 'rfi', 'euronews', 'sky news',
      'live news', 'press conference', 'conférence de presse', 'briefing',
      'headline'
    ],
    Finance: [
      'finance', 'investing', 'investissement', 'investor', 'investisseur',
      'stocks', 'stock market', 'bourse', 'trading', 'trader', 'market cap',
      'wall street', 'sp500', 's&p 500', 'nasdaq', 'cac 40', 'dow jones',
      'recession', 'récession', 'inflation', 'fed', 'powell', 'crypto',
      'bitcoin', 'btc', 'ethereum', 'eth', 'web3', 'blockchain',
      'nft', 'defi', 'meme coin', 'altcoin', 'shitcoin', 'pump',
      'dump', 'whale', 'bull market', 'bear market', 'hodl',
      'real estate', 'immobilier', 'rental property', 'cashflow',
      'side hustle', 'passive income', 'revenu passif', 'frugal',
      'minimalism finance', 'fire movement'
    ],
    Tech: [
      'tech', ' ai ', 'a.i.', 'gpt', 'claude', 'llm', 'chatgpt', 'openai',
      'anthropic', 'programming', 'programmation', 'developer', 'développeur',
      'coding', 'code', 'react', 'javascript', 'typescript', 'python', 'rust',
      'computer', 'ordinateur', 'software', 'logiciel', 'startup', 'silicon',
      'apple', 'google', 'microsoft', 'meta', 'nvidia', 'mkbhd', 'fireship',
      'ycombinator', 'design', 'engineer', 'ingénieur', 'iphone', 'macbook',
      'linux', 'github', 'docker', 'kubernetes', 'cloud', 'aws', 'azure',
      'app builder', 'electronics', 'gadget', 'review tech', 'unboxing',
      'benchmark', 'gpu', 'cpu', 'm1', 'm2', 'm3', 'm4', 'soc',
      'open source', 'opensource', 'devops', 'cybersecurity', 'cybersécurité',
      'hacking', 'pentest', 'reverse engineering'
    ],
    Music: [
      'music', 'musique', 'song', 'chanson', 'album', 'concert', 'live',
      'performance', 'official video', 'official audio', 'official music',
      'official mv', 'lyric video', 'lyrics video', 'lyrics',
      'paroles', 'remix', 'cover', 'reprise', 'vevo', 'spotify', 'piano',
      'guitar', 'guitare', 'beat', 'edm', 'pop ', 'rap ', 'hip hop', 'hip-hop',
      'rock', 'jazz', 'classical', 'classique', 'soundtrack', 'ost',
      ' mv ', '[mv]', '(mv)', 'feat.', ' ft.', '(feat', '(ft.',
      'orchestra', 'symphony', 'symphonie', 'producer', 'producteur',
      'dj ', 'mix', 'beat tape', 'visualizer', 'visualiseur',
      'instrumental', 'audio only', 'studio session', 'live session',
      'spotify singles', 'tiny desk', 'colors', 'colorshow',
      ' - topic', 'records', 'recordings'
    ],
    Gaming: [
      'gaming', 'gameplay', 'walkthrough', 'speedrun', 'let\'s play',
      'lets play', 'playthrough', 'minecraft', 'fortnite', 'valorant',
      'league of legends', 'lol', 'dota', 'counter-strike', 'cs2', 'csgo',
      'apex legends', 'overwatch', 'rocket league', 'fifa', 'ea sports',
      'gta', 'grand theft auto', 'red dead', 'elden ring', 'dark souls',
      'zelda', 'mario', 'pokemon', 'pokémon', 'nintendo', 'playstation',
      'xbox', 'steam deck', 'gpu benchmark', 'esports', 'esport',
      'tournament', 'twitch', 'speedrun', 'noob', 'pro player',
      'world record', 'wr ', 'kill montage', 'frag movie',
      'hearthstone', 'world of warcraft', 'wow ', 'starcraft',
      'genshin impact', 'baldur\'s gate', 'baldurs gate'
    ],
    Sports: [
      'sport', 'sports', 'football', 'soccer', 'basketball', 'nba',
      'tennis', 'rugby', 'golf', 'mma', 'ufc', 'boxe', 'boxing',
      'formula 1', 'formule 1', 'f1 ', 'motogp', 'natation', 'cyclisme',
      'cycling', 'tour de france', 'olympique', 'olympics', 'champions league',
      'ligue 1', 'premier league', 'la liga', 'bundesliga', 'serie a',
      'world cup', 'coupe du monde', 'roland-garros', 'wimbledon',
      'highlight', 'highlights', 'résumé match', 'match résumé',
      'goal of the', 'but du jour', 'workout', 'entrainement',
      'crossfit', 'gym ', 'fitness motivation', 'bodybuilding'
    ],
    Documentary: [
      'documentaire', 'documentary', 'docu ', 'docu-', 'arte ',
      'national geographic', 'nat geo', 'bbc earth', 'discovery',
      'investigation', 'enquête', 'reportage', 'history channel',
      'planète+', 'planete+', 'fact-based', 'true story', 'biopic',
      'docuserie', 'docuseries', 'film documentaire', 'long form'
    ],
    Education: [
      'tutorial', 'tutoriel', 'how to', 'comment faire', 'learn',
      'apprendre', 'cours', 'course', 'lecture series', 'lesson',
      'leçon', 'mit ocw', 'mit course', 'crash course', 'khan academy',
      'science', 'physics', 'physique', 'chemistry', 'chimie',
      'mathematics', 'maths', 'mathematic', 'math ',
      'biology', 'biologie', 'astronomy', 'astronomie', 'history of',
      'histoire de', 'world history', 'philosophy', 'philosophie',
      'psychology', 'psychologie', 'explained', 'expliqué',
      'understanding', 'comprendre', 'kurzgesagt', 'veritasium',
      'numberphile', 'computerphile', 'science4all', 'micmaths',
      'lumni', 'fil d\'actu', 'edutainment'
    ],
    Lifestyle: [
      'cooking', 'cuisine', 'recette', 'recipe', 'food review',
      'restaurant review', 'mukbang', 'fitness', 'workout', 'yoga',
      'meditation', 'méditation', 'mindfulness', 'travel', 'voyage',
      'roadtrip', 'road trip', 'fashion', 'mode ', 'haul',
      'outfit', 'ootd', 'beauty', 'makeup', 'maquillage', 'skincare',
      'home tour', 'décoration', 'interior design', 'minimalism',
      'organize', 'rangement', 'self help', 'développement personnel',
      'productivity', 'productivité', 'morning routine', 'evening routine',
      'day in my life', 'wellness'
    ],
    Vlogs: [
      'vlog', 'vlogs', 'daily vlog', 'weekly vlog', 'storytime', 'story time',
      'q&a', 'questions answers', 'channel update', 'announcement',
      'behind the scenes', 'making of', 'reaction', 'react ',
      'first impressions', 'tier list', 'unboxing'
    ],
    Entertainment: [
      'comedy', 'comédie', 'humour', 'humor', 'sketch', 'parody', 'parodie',
      'stand up', 'stand-up', 'standup comedy', 'meme', 'memes',
      'tiktok compilation', 'fail compilation', 'try not to laugh',
      'funny moments', 'best of', 'top 10', 'top 5', 'reaction video',
      'movie review', 'film review', 'critique film', 'tv show',
      'série tv', 'serie tv', 'netflix', 'hbo', 'disney', 'marvel',
      'star wars', 'anime', 'manga', 'bande annonce', 'trailer'
    ]
  }
};

// Resolve a category to its locked hex color. Returns Other-grey if unknown.
window.BB_MOCK.colorFor = function (category) {
  const map = window.BB_MOCK.categoryColors;
  return (category && map[category]) || map.Other;
};

// True if a delta INCREASE for this category should be flagged as risk (red).
// All other deltas (including decreases) are neutral.
window.BB_MOCK.isRiskCategory = function (category) {
  return (window.BB_MOCK.riskCategories || []).indexOf(category) !== -1;
};

// Pick a contextual "why" reason based on the video title (mocked heuristic).
window.BB_MOCK.whyForTitle = function (title) {
  if (!title) return window.BB_MOCK.whyThisVideo.defaultReason;
  const t = title.toLowerCase();
  if (t.includes('minecraft')) return 'This Video was recommended because you have been watching Minecraft related videos for 3 weeks';
  if (t.includes('arte') || t.includes('documentaire')) return 'This Video was recommended because you have been watching documentaries for 2 weeks';
  if (t.includes('politic') || t.includes('news') || t.includes('trump')) return 'This Video was recommended because you have been engaging with political content recently';
  if (t.includes('music') || t.includes('song')) return 'This Video was recommended because you have been listening to similar music';
  return window.BB_MOCK.whyThisVideo.defaultReason;
};
