/**
 * Individual Destination Detail Data Source
 * MongoDB-ready document schema for Sonbhadra Tourism destinations.
 * 
 * Supports full editorial fidelity:
 * 1. Hero & Media Gallery (5-6 scrollable images)
 * 2. Location Stories (Historical, Cultural, Nature with [VERIFY] flags)
 * 3. Local Creators (Profile, media focus, verified badge, recent posts)
 * 4. Quick Facts & Logistics (Best season, timings, fees, difficulty, transit)
 * 5. Map & Coordinates (Terrain, landmarks, safety notes)
 * 6. Community Tips & Eco-Guidelines (Etiquette, Leave-No-Trace, warnings)
 * 7. Related Destinations
 */

export const DESTINATION_DETAILS = {
  'rihand-dam': {
    slug: 'rihand-dam',
    name: 'Govind Ballabh Pant Sagar (Rihand Dam)',
    shortName: 'Rihand Dam',
    tagline: 'Asia’s colossal inland sea powering the energy capital of India',
    category: 'Engineering Marvel & Inland Reservoir',
    categoryBadge: 'Lakes & Dams',
    location: 'Pipri, Sonbhadra District, Uttar Pradesh',
    coordinates: { lat: 24.2052, lng: 83.0234, label: 'Pipri, Sonbhadra' },
    summary: 'Constructed across the Rihand River between 1954 and 1962, Govind Ballabh Pant Sagar is one of the largest man-made reservoirs in India. Spanning over 450 square kilometers on the Uttar Pradesh-Madhya Pradesh border, the sapphire expanse contrasts dramatically with the rugged Vindhyan and Singrauli hills.',
    
    // 1. Destination Hero Media Gallery (5-6 images)
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85',
        fallback: '../../../public/assets/images/destinations/rihand-dam.webp',
        alt: 'Vast Govind Ballabh Pant Sagar reservoir expanse at Rihand Dam',
        caption: 'Asia’s colossal inland sea stretching across the horizon at sunset',
        type: 'featured'
      },
      {
        url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=85',
        fallback: '../../../public/assets/images/destinations/rihand-dam.webp',
        alt: 'Tranquil sapphire waters framed by rolling Vindhyan hillocks',
        caption: 'Scenic reservoir perimeter bordered by Pipri and Singrauli hills',
        type: 'landscape'
      },
      {
        url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85',
        alt: 'Massive concrete dam structure and hydroelectric infrastructure',
        caption: 'The monumental 91-meter-high concrete gravity dam engineering marvel',
        type: 'infrastructure'
      },
      {
        url: 'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1600&q=85',
        alt: 'Roaring white water torrents during monsoon spillway gate release',
        caption: 'Spectacular monsoon water release surging through the overflow gates',
        type: 'action'
      },
      {
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85',
        alt: 'Golden twilight reflections across the endless inland sea',
        caption: 'Sunset hues turning the expansive reservoir into molten gold',
        type: 'sunset'
      }
    ],

    // 2. Stories of this Location (Editorial, with [VERIFY] flags)
    stories: [
      {
        id: 'engineering-feat',
        title: 'The Modern Temple of the Vindhyas',
        subtitle: 'How 1950s engineering created India’s inland ocean',
        tag: 'Engineering Heritage',
        readTime: '4 min read',
        quote: 'A colossal concrete gravity barrier that transformed a remote tribal forest river into the lifeblood of thermal power.',
        content: [
          'In 1954, Prime Minister Jawaharlal Nehru laid the foundation stone of what would become the prime catalyst of India’s heavy industrial revolution. Concrete poured day and night through the late fifties to tame the ferocious monsoon currents of the Rihand River, a key southern tributary of the mighty Son.',
          'Standing 91.44 meters high and stretching 934 meters across the crest, the dam holds an astounding 10.6 billion cubic meters of water. <span class="badge-verify" title="Historical oral citation needing archival gazetteer check">[VERIFY]</span> Legend among local engineers recalls that over 3,000 local craftsmen and technicians worked without heavy computer modeling, relying entirely on slide rules and manual geodetic surveys.',
          'Today, the lake supplies critical cooling water to colossal super thermal power complexes across the Singrauli-Sonbhadra belt, earning Sonbhadra its moniker: "The Energy Capital of India".'
        ]
      },
      {
        id: 'ecological-renaissance',
        title: 'Birds of the Inland Archipelago',
        subtitle: 'Migratory flyways over submerged ancient valleys',
        tag: 'Wildlife & Nature',
        readTime: '3 min read',
        quote: 'Every winter, bar-headed geese and Siberian pintails cross the Himalayan heights to rest upon Pipri’s quiet waters.',
        content: [
          'Beneath the calm mirror of Govind Ballabh Pant Sagar lie the submerged memories of dense sal forests and riverine ravines. Over the decades, nature has reclaimed this artificial reservoir, shaping it into an indispensable wetland sanctuary.',
          'Between November and February, the shoreline and isolated reservoir islands host flocks of cormorants, river terns, and migratory waterfowl traveling southward along the Central Asian Flyway. <span class="badge-verify" title="Bird census number requires recent forest department verification">[VERIFY: Annual census estimates over 40 avian species]</span>.',
          'Local fishermen in wooden dinghies navigate the tranquil waters at dawn, casting nets under the watchful gaze of river raptors, creating an ethereal harmony between human livelihood and natural ecology.'
        ]
      }
    ],

    // 3. Local Creators
    creators: [
      {
        id: 'sonbhadra-drone-tales',
        name: 'Sonbhadra Drone Tales',
        handle: '@sonbhadradrone',
        hometown: 'Renukoot, Sonbhadra',
        avatar: '../../../public/assets/images/creators/sonbhadra-drone-tales.webp',
        isVerified: true,
        primaryFocus: 'Cinematic Drone & Golden Hour Reels',
        bio: 'Documenting the vast scale of Rihand Dam reservoir, misty morning gorges, and the industrial-natural juxtaposition across Sonbhadra.',
        profileUrl: '../index.html#creators',
        social: {
          instagram: 'https://instagram.com/[PLACEHOLDER]',
          youtube: 'https://youtube.com/[PLACEHOLDER]'
        },
        recentPosts: [
          {
            title: 'Spillway Mist at Dawn 4K',
            thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=75',
            type: 'Aerial Reel',
            views: '24.8K views'
          },
          {
            title: 'Sunset over 450 sq km Lake',
            thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=75',
            type: 'Photography',
            views: '12.4K views'
          }
        ]
      }
    ],

    // 4. Quick Facts & Logistics
    quickFacts: {
      bestSeason: 'October to March (Pleasant breeze, dramatic sunsets)',
      timings: '06:00 AM – 06:00 PM (Dam crest access subject to CISF/UPP security permits)',
      entryFee: 'Free entry to public viewpoints; Dam Crest access requires prior permission',
      difficulty: 'Easy (Paved approach roads, wheelchair-accessible promenade)',
      nearestRailway: 'Renukoot Railway Station (RNQ) — 8 km',
      nearestAirport: 'Varanasi International Airport (LBS) — ~160 km',
      howToReach: 'Direct state highway buses and private cabs connect Varanasi and Robertsganj to Renukoot/Pipri. The drive from Robertsganj takes approximately 2.5 hours along scenic Vindhyan ghat roads.'
    },

    // 5. Location on Map & Surroundings
    mapDetails: {
      lat: 24.2052,
      lng: 83.0234,
      mapQuery: 'Govind Ballabh Pant Sagar, Pipri, Uttar Pradesh',
      terrain: 'Plateau reservoir edge flanked by rocky ridges and thermal greenbelts.',
      landmarks: [
        'Renukoot Birla Temple (10 km)',
        'Obra Thermal Reservoir (45 km)',
        'Pipri Forest Rest House Vantage Point (2 km)'
      ],
      safetyNotes: 'Steep water drop-offs near the dam crest. Swimming or diving into the reservoir is strictly prohibited due to deep underwater currents.'
    },

    // 6. Community Tips & Guidelines
    communityGuidelines: {
      etiquette: [
        'Respect security protocols around sensitive power and dam installations.',
        'Obey photography restrictions near the hydroelectric power plant gates.',
        'Support local boatmen and roadside tea vendors in Pipri market.'
      ],
      ecoRules: [
        'Zero plastic tolerance: Carry all water bottles and wrappers back with you.',
        'Do not dump food or plastic waste into the reservoir waters.',
        'Keep sound levels gentle to avoid disturbing wintering wetland birds.'
      ],
      safetyWarnings: [
        'Do not cross designated guard railings along the cliffside viewpoints.',
        'Monsoon water discharge triggers sudden high currents — heed siren warnings.',
        'Wear comfortable non-slip walking shoes on rocky shoreline trails.'
      ]
    },

    // 7. Related Destinations
    relatedSlugs: ['obra-dam', 'agori-fort', 'lakhaniya-dari']
  },

  'lakhaniya-dari': {
    slug: 'lakhaniya-dari',
    name: 'Lakhaniya Dari Falls',
    shortName: 'Lakhaniya Dari',
    tagline: 'Cascading waters enveloped by virgin Vindhyan gorges',
    category: 'Monsoon Waterfall & Jungle Trek',
    categoryBadge: 'Waterfalls & Trekking',
    location: 'Near Ahraura / Robertsganj, Sonbhadra District, Uttar Pradesh',
    coordinates: { lat: 25.0125, lng: 83.0289, label: 'Lakhaniya Dari, Sonbhadra' },
    summary: 'Hidden in a primordial sandstone canyon south of Varanasi, Lakhaniya Dari is a breathtaking multi-tiered natural cascade. Fed by mountain streams coursing through virgin Vindhyan forests, it plunges into natural emerald plunge pools surrounded by towering rock faces.',

    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1600&q=85',
        fallback: '../../../public/assets/images/destinations/lakhaniya-dari.webp',
        alt: 'Main cascade of Lakhaniya Dari roaring into the emerald canyon pool',
        caption: 'The main cascade tumbling 150 feet into the deep plunge pool',
        type: 'featured'
      },
      {
        url: 'https://images.unsplash.com/photo-1498855926480-d98e83099315?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?auto=format&fit=crop&w=1600&q=85',
        alt: 'Rock boulder trail along the crystal mountain river stream',
        caption: 'Boulder-strewn stream bed leading hikers towards the upper falls',
        type: 'trek'
      },
      {
        url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=85',
        fallback: '../../../public/assets/images/destinations/sonbhadra-forests.webp',
        alt: 'Dense canopy of sal and mahua trees shielding the gorge',
        caption: 'Lush monsoon canopy overlooking the secluded Vindhyan canyon rim',
        type: 'nature'
      },
      {
        url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1600&q=85',
        alt: 'Emerald plunge pool surrounded by sheer sandstone walls',
        caption: 'Cool spray and natural emerald waters at the base of the waterfall',
        type: 'landscape'
      },
      {
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=85',
        alt: 'Ancient sandstone strata carved by millenia of running water',
        caption: 'Primeval rock amphitheatre and sandstone gorge formations',
        type: 'geology'
      }
    ],

    stories: [
      {
        id: 'hidden-canyon',
        title: 'The Gorge of Whispering Waters',
        subtitle: 'Walking through ancient boulder beds into the canyon core',
        tag: 'Trekker Expedition',
        readTime: '4 min read',
        quote: 'Deep inside the canyon, cell reception dies and the only sound is the primeval music of mountain water striking sandstone.',
        content: [
          'Before reaching the main waterfall, trekkers must navigate a 1.5-kilometer riverbed trail strewn with colossal moss-covered sandstone boulders. The journey requires crossing ankle-deep mountain streams and slipping beneath cool jungle canopies.',
          'Local tribal folklore speaks of ancient forest spirits guarding the upper pools. <span class="badge-verify" title="Oral tradition collected by local guides">[VERIFY: Tribal myths describe perennial spring guardians]</span>. The cool microclimate inside the ravine remains 5°C cooler than the open plains.',
          'During the peak monsoon months of July and August, the modest mountain trickle swells into an awe-inspiring thunderous curtain of white water that shakes the canyon walls.'
        ]
      },
      {
        id: 'forest-ecology',
        title: 'Sanctuary of the Vindhyan Forest',
        subtitle: 'Medicinal flora and birdlife inside the deep ravine',
        tag: 'Flora & Fauna',
        readTime: '3 min read',
        quote: 'Wild medicinal herbs, mahua blooms, and swooping kingfishers flourish along the undisturbed water course.',
        content: [
          'The micro-habitat created by Lakhaniya Dari’s perennial mist nurtures rare ferns, wild orchids, and medicinal forest flora cherished by local Baiga and Gond healers.',
          'Birdwatchers regularly spot crested serpent eagles circling the gorge thermal currents and blue rock thrushes darting across the vertical cliffs.',
          'Visitors are encouraged to explore with certified local youth guides from Ahraura who know every safe boulder and seasonal current.'
        ]
      }
    ],

    creators: [
      {
        id: 'creator5776',
        name: 'Creator Ashish',
        handle: '@creator5776',
        hometown: 'Renukoot, Sonbhadra',
        avatar: 'https://res.cloudinary.com/gchwcnsd/image/upload/v1790800165/ooyeedl5idujsw9nppgd.png',
        isVerified: true,
        primaryFocus: 'Trail & Trekking Specialist / High-Altitude Viewpoints',
        bio: 'Passionate local explorer documenting the high-altitude viewpoints, industrial heritage, and tranquil waters of Renukoot and Govind Sagar.',
        profileUrl: '../index.html#creators',
        social: {
          instagram: 'https://instagram.com/[PLACEHOLDER]',
          youtube: 'https://youtube.com/[PLACEHOLDER]'
        },
        recentPosts: [
          {
            title: 'Extreme Monsoon Trek to Lakhaniya',
            thumbnail: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=600&q=75',
            type: 'Trek Vlog',
            views: '38.2K views'
          },
          {
            title: 'Hidden Upper Cascade Trail Guide',
            thumbnail: 'https://images.unsplash.com/photo-1498855926480-d98e83099315?auto=format&fit=crop&w=600&q=75',
            type: 'Guide',
            views: '19.1K views'
          }
        ]
      }
    ],

    quickFacts: {
      bestSeason: 'July to February (Peak flow in Monsoon, crystal clear pools in Winter)',
      timings: '07:00 AM – 05:00 PM (Entry prohibited after 4:00 PM for forest safety)',
      entryFee: '₹20 – ₹50 nominal forest entry ticket <span class="badge-verify">[VERIFY: Seasonal Forest Dept revisions]</span>',
      difficulty: 'Moderate Trek (Uneven boulders, slippery rocks, water wading)',
      nearestRailway: 'Chunar Railway Station (25 km) or Pt. Deen Dayal Upadhyaya Jn. (50 km)',
      nearestAirport: 'Varanasi International Airport (LBS) — ~65 km',
      howToReach: 'Accessible via Varanasi-Shaktinagar Highway (SH-5A) up to Ahraura. From Ahraura town, private autos or personal vehicles navigate 14 km of country roads directly to the forest trailhead.'
    },

    mapDetails: {
      lat: 25.0125,
      lng: 83.0289,
      mapQuery: 'Lakhaniya Dari Waterfall, Sonbhadra, Uttar Pradesh',
      terrain: 'Rugged sandstone gorge with slippery boulder riverbed and forest trails.',
      landmarks: [
        'Ahraura Dam & Forest Watchtower (8 km)',
        'Siddhanath Dari Waterfalls (18 km)',
        'Chunar Historic Fort (28 km)'
      ],
      safetyNotes: 'Flash floods can occur during heavy monsoon cloudbursts upstream. Deep plunge pools have deceptive undercurrents; do NOT venture into deep water beyond waist level.'
    },

    communityGuidelines: {
      etiquette: [
        'Always hire a local youth guide from the village trailhead for safe navigation.',
        'Dress modestly and wear gripped trekking sandals or trail shoes.',
        'Depart the canyon well before sunset as twilight drops rapidly under forest canopies.'
      ],
      ecoRules: [
        'Strict No-Plastic Zone: Do not leave disposable cups, bottles, or food packets.',
        'No soap, shampoo, or chemical detergents in natural streams.',
        'Do not carve names or graffiti into the ancient sandstone walls.'
      ],
      safetyWarnings: [
        'Algae-coated river boulders are extremely slippery; step carefully.',
        'Never jump or dive from cliff ledges into unknown water depths.',
        'Avoid isolated canyon corners during heavy thunderstorms.'
      ]
    },

    relatedSlugs: ['mukha-falls', 'vijaygarh-fort', 'agori-fort']
  },

  'vijaygarh-fort': {
    slug: 'vijaygarh-fort',
    name: 'Vijaygarh Fort',
    shortName: 'Vijaygarh Fort',
    tagline: '5th-century citadel perched on a rugged Vindhyan plateau',
    category: 'Ancient Citadel & Rock Inscriptions',
    categoryBadge: 'Ancient Heritage',
    location: 'Mau Kalan, Sonbhadra District, Uttar Pradesh',
    coordinates: { lat: 24.5824, lng: 83.0841, label: 'Vijaygarh Fort, Sonbhadra' },
    summary: 'Perched over 400 meters above the plains on an isolated, fortress-like table mountain, Vijaygarh Fort dates back to the 5th century. Immortalized in Devaki Nandan Khatri’s legendary Hindi fantasy epic "Chandrakanta", it houses ancient rock carvings, perennial mountaintop ponds, and medieval stone gateways.',

    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1585130401366-fe05a8d813c4?auto=format&fit=crop&w=1600&q=85',
        fallback: '../../../public/assets/images/destinations/vijaygarh-fort.webp',
        alt: 'Massive sandstone ramparts of Vijaygarh Fort against the sky',
        caption: 'Imposing 5th-century sandstone battlements on the northern ridge',
        type: 'featured'
      },
      {
        url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=85',
        fallback: '../../../public/assets/images/destinations/vijaygarh-fort.webp',
        alt: 'Ancient stone steps climbing 400 meters up the mountain plateau',
        caption: 'Steep stone stairway carved directly into the sheer mountain spur',
        type: 'heritage'
      },
      {
        url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=85',
        alt: 'Ancient mountaintop reservoir Mira Sagar and Ram Sagar',
        caption: 'Perennial mountaintop cave reservoirs that have never dried in recorded history',
        type: 'architecture'
      },
      {
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=85',
        alt: 'Commanding 360-degree vista spanning the Son valley basin',
        caption: 'Breathtaking panoramic horizon over the Son river valley from the battlements',
        type: 'view'
      },
      {
        url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=85',
        alt: 'Gupta-era rock carvings and ancient inscriptions in cave shelters',
        caption: 'Inscribed stone arches and relics celebrated in the novel Chandrakanta',
        type: 'history'
      }
    ],

    stories: [
      {
        id: 'chandrakanta-legend',
        title: 'The Real Fortress of Chandrakanta',
        subtitle: 'How an ancient fort sparked the birth of modern Hindi fantasy',
        tag: 'Literary & Medieval Lore',
        readTime: '4 min read',
        quote: 'Every stone of Vijaygarh inspired the secret passages, tilism, and rival kingdoms of Babu Devaki Nandan Khatri’s masterpiece.',
        content: [
          'In late 19th-century India, Babu Devaki Nandan Khatri was so captivated by the labyrinthine bastions and hidden caverns of Vijaygarh and Naugarh that he penned "Chandrakanta" (1888) — the first modern fantasy best-seller in Hindi literature.',
          'Local legends speak of secret escape tunnels ("surang") winding miles beneath the plateau down to Agori Fort on the Son river. <span class="badge-verify" title="Archaeological Survey of India exploration needed to confirm tunnel reach">[VERIFY: Subterranean passages exist but full length is unexplored]</span>.',
          'The hill fort was successively held by ancient Gupta rulers, the Kol kings, Chandela monarchs, and the Rajas of Benares, each leaving distinct stone epigraphs.'
        ]
      },
      {
        id: 'perennial-reservoirs',
        title: 'The Miracle of Ram Sagar and Mira Sagar',
        subtitle: 'Ancient hydrologic engineering at 400 meters elevation',
        tag: 'Ancient Engineering',
        readTime: '3 min read',
        quote: 'Even in the scorching 48°C peak of Vindhyan summers, the twin mountaintop reservoirs have never run dry in recorded history.',
        content: [
          'One of the fort’s greatest enigmas is Ram Sagar and Mira Sagar — deep stone cisterns cut directly into the bedrock at the highest point of the mountain.',
          'Fed by natural fissure aquifers and ingenious rainwater channeling systems designed over 1,500 years ago, the water remains remarkably cold and clear year-round.',
          'At the edge of the plateau stands the revered tomb of Hazrat Saiyyad Zain-ul-Abidin Miran Sahib and the ancient temple of Maa Vijayeshwari, celebrating shared cultural reverence across centuries.'
        ]
      }
    ],

    creators: [
      {
        id: 'vindhya-heritage-walks',
        name: 'Vindhya Heritage Explorer',
        handle: '@vindhyaheritage',
        hometown: 'Robertsganj, Sonbhadra',
        avatar: '../../../public/assets/images/creators/vindhya-heritage.webp',
        isVerified: true,
        primaryFocus: 'Archaeological Research & Historical Documentaries',
        bio: 'Preserving ancient oral histories, medieval fort architecture, and millennia-old rock shelters hidden across Sonbhadra’s plateau.',
        profileUrl: '../index.html#creators',
        social: {
          instagram: 'https://instagram.com/[PLACEHOLDER]',
          youtube: 'https://youtube.com/[PLACEHOLDER]'
        },
        recentPosts: [
          {
            title: 'Secrets of the Chandrakanta Tilism',
            thumbnail: 'https://images.unsplash.com/photo-1585130401366-fe05a8d813c4?auto=format&fit=crop&w=600&q=75',
            type: 'Heritage Doc',
            views: '45.1K views'
          },
          {
            title: 'Climbing the 1000 Steps of Vijaygarh',
            thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=75',
            type: 'Field Guide',
            views: '22.8K views'
          }
        ]
      }
    ],

    quickFacts: {
      bestSeason: 'October to March (Crisp mountain air and clear panoramic visibility)',
      timings: '06:00 AM – 05:00 PM (Descend before nightfall; no electrical lighting on hill)',
      entryFee: 'Free entry (Managed by Archaeological Survey of India & local trusts)',
      difficulty: 'Moderate to Strenuous Climb (~800 to 1,000 stone steps; ~1.5 hours climb)',
      nearestRailway: 'Robertsganj (Sonbhadra Station - SBDR) — 20 km',
      nearestAirport: 'Varanasi International Airport (LBS) — ~110 km',
      howToReach: 'Drive from Robertsganj via Mau Kalan village road. Base parking is available at the foot of the hill, from where the stone stairway ascent commences.'
    },

    mapDetails: {
      lat: 24.5824,
      lng: 83.0841,
      mapQuery: 'Vijaygarh Fort, Sonbhadra, Uttar Pradesh',
      terrain: 'Steep hillock tableland with ancient stone steps, rocky plateaus, and scrub forest.',
      landmarks: [
        'Ram Sagar & Mira Sagar Cisterns (Fort Summit)',
        'Maa Vijayeshwari Temple & Miran Sahib Dargah (Summit)',
        'Salkhan Fossil Park (28 km)'
      ],
      safetyNotes: 'Steep drop-offs without safety railings along several fort perimeters. Carry at least 2 liters of drinking water as climb is physically demanding.'
    },

    communityGuidelines: {
      etiquette: [
        'Respect both religious shrines (temple and dargah) located peacefully on the citadel.',
        'Remove footwear where requested at sacred sanctums.',
        'Engage with elderly village elders at the base for forgotten folklore.'
      ],
      ecoRules: [
        'Pack out all plastics; there is no municipal garbage collection atop the mountain.',
        'Never deface historic masonry or historic rock art.',
        'Avoid making loud noises near nesting raptor colonies in the cliffs.'
      ],
      safetyWarnings: [
        'Climb during daylight hours; descent in darkness is hazardous.',
        'Monkeys inhabit the summit — keep food bags zipped inside backpacks.',
        'Stay back from unguarded cliff rims during gusty ridge winds.'
      ]
    },

    relatedSlugs: ['agori-fort', 'salkhan-fossil-park', 'lakhaniya-dari']
  },

  'agori-fort': {
    slug: 'agori-fort',
    name: 'Agori Fort (Son & Renu Sangam)',
    shortName: 'Agori Fort',
    tagline: 'River-island fortress flanked by the sacred twin rivers',
    category: 'River Fortress & Historical Ruins',
    categoryBadge: 'River Confluences & Fortresses',
    location: 'Chopan, Sonbhadra District, Uttar Pradesh',
    coordinates: { lat: 24.5028, lng: 83.0583, label: 'Agori Fort, Chopan, Sonbhadra' },
    summary: 'Dating back to ancient and medieval eras, Agori Fort is strategically encircled by the waters of the Son and Renu rivers. Accessible by wooden riverboats, this romantic stone ruin guards centuries of tribal, Kharwar, and Chandel dynasties.',

    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1600&q=85',
        fallback: '../../../public/assets/images/destinations/agori-fort.webp',
        alt: 'Ancient stone walls of Agori Fort overlooking the Son river',
        caption: 'Weathered fortress bastions guarding the sacred river promontory',
        type: 'featured'
      },
      {
        url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=85',
        alt: 'Traditional wooden country boat crossing Son and Renu confluence',
        caption: 'Local boat ferry carrying travelers across the river to the island fortress',
        type: 'lifestyle'
      },
      {
        url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=85',
        fallback: '../../../public/assets/images/destinations/agori-fort.webp',
        alt: 'Arched gateway and crumbling stone palaces inside Agori',
        caption: 'Carved stone arches framing historical palace ruins and courtyards',
        type: 'architecture'
      },
      {
        url: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85',
        alt: 'Sunset reflection across the Son and Renu river confluence',
        caption: 'Evening crimson glow reflecting on the sacred Son and Renu confluence',
        type: 'sunset'
      },
      {
        url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1600&q=85',
        alt: 'Medieval temple sanctum nestled within the inner bastion',
        caption: 'Ancient stone temple sanctum echoing folklore of Veer Lorik and Manjari',
        type: 'heritage'
      }
    ],

    stories: [
      {
        id: 'river-sangam',
        title: 'The Fortress of Two Rivers',
        subtitle: 'Strategic gateway between the northern plains and central Deccan',
        tag: 'Dynastic History',
        readTime: '4 min read',
        quote: 'Encircled on three sides by water, Agori was virtually impregnable to medieval cavalry invasions.',
        content: [
          'Constructed upon a rocky promontory where the Renu (Rihand) river discharges into the wide channel of the sacred Son, Agori was a critical defensive fortress for Kharwar rulers and the Chandel kings of Agori-Barhar.',
          'Local historians note that the fort was the residence of Raja Balwant Singh and figured prominently in medieval regional skirmishes before falling into romantic disuse. <span class="badge-verify" title="Dates of Kharwar reign require cross-checking with district gazetteer">[VERIFY: Inscriptions cite Kharwar rule around the 12th–14th century]</span>.',
          'Today, crossing the broad expanse of water in a hand-rowed wooden boat to reach the quiet stone gates feels like entering an abandoned realm from a forgotten century.'
        ]
      },
      {
        id: 'folk-tales',
        title: 'The Tale of Lorik and Manjari',
        subtitle: 'Bhojpuri folklore echoed in the stone bastion winds',
        tag: 'Bhojpuri Folklore',
        readTime: '3 min read',
        quote: 'The surrounding ravines are tied to the epic legend of Veer Lorik, the legendary hero of folklore.',
        content: [
          'Across Sonbhadra and eastern Uttar Pradesh, the epic of Veer Lorik is sung by wandering folk bards. Agori Fort was according to local legend ruled by King Molagat, the antagonist in the Lorik-Manjari legend.',
          'Just a few kilometers away sits the famed Veer Lorik Stone ("Lorika"), split cleanly in half as evidence of Lorik’s legendary sword blow. <span class="badge-verify" title="Folk mythology versus historical archaeology">[VERIFY: Cultural folk tradition]</span>.',
          'The evening light over the river turns the ancient bastions into silhouettes against crimson skies, accompanied by the gentle dipping of boat oars.'
        ]
      }
    ],

    creators: [
      {
        id: 'sonbhadra-drone-tales',
        name: 'Sonbhadra Drone Tales',
        handle: '@sonbhadradrone',
        hometown: 'Renukoot, Sonbhadra',
        avatar: '../../../public/assets/images/creators/sonbhadra-drone-tales.webp',
        isVerified: true,
        primaryFocus: 'Aerial & River Confluence Cinematography',
        bio: 'Cinematographer documenting the vast scale of Rihand Dam reservoir, misty morning gorges, and golden-hour sandstone ramparts.',
        profileUrl: '../index.html#creators',
        social: {
          instagram: 'https://instagram.com/[PLACEHOLDER]',
          youtube: 'https://youtube.com/[PLACEHOLDER]'
        },
        recentPosts: [
          {
            title: 'Agori Fort Island from 500ft',
            thumbnail: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=75',
            type: 'Aerial 4K',
            views: '31.5K views'
          }
        ]
      }
    ],

    quickFacts: {
      bestSeason: 'October to March (River water is tranquil, temperature is pleasant)',
      timings: '08:00 AM – 05:00 PM (Boat service stops at sunset)',
      entryFee: 'No entry fee for fort; Boat ferry charges ₹30 – ₹60 per person round trip',
      difficulty: 'Easy to Moderate (Short boat ride followed by walking over unpaved stone ruins)',
      nearestRailway: 'Chopan Railway Station (CPU) — 10 km',
      nearestAirport: 'Varanasi International Airport (LBS) — ~135 km',
      howToReach: 'Take NH-39 to Chopan, then drive 8 km towards the riverbank crossing point. Local boatmen ferry visitors across the Son river to the fort base.'
    },

    mapDetails: {
      lat: 24.5028,
      lng: 83.0583,
      mapQuery: 'Agori Fort, Chopan, Sonbhadra, Uttar Pradesh',
      terrain: 'River island promontory, stone ruins, and sandy river banks.',
      landmarks: [
        'Veer Lorik Stone (12 km)',
        'Chopan River Ghats (10 km)',
        'Salkhan Fossil Park (22 km)'
      ],
      safetyNotes: 'Life jackets should be worn during the boat crossing. Exercise caution when exploring dilapidated stone walls and roofless chambers.'
    },

    communityGuidelines: {
      etiquette: [
        'Pay fair wages to local boatmen whose livelihood depends on travelers.',
        'Do not remove ancient carved stones or bricks from the ruins.',
        'Be respectful of local fishermen along the riverbanks.'
      ],
      ecoRules: [
        'Do not discard plastic or trash into the Son and Renu rivers.',
        'Leave wildlife undisturbed along the island shores.',
        'Camp only in designated areas with local village permission.'
      ],
      safetyWarnings: [
        'Do not swim across the river; currents at the confluence can be deceivingly swift.',
        'Avoid climbing unstable crumbling walls.',
        'Return across the river well before twilight.'
      ]
    },

    relatedSlugs: ['vijaygarh-fort', 'rihand-dam', 'chopan-ghats']
  },

  'mukha-falls': {
    slug: 'mukha-falls',
    name: 'Mukha Waterfalls',
    shortName: 'Mukha Falls',
    tagline: 'Dramatic canyon plunge amid prehistoric sandstone escarpments',
    category: 'Canyon Waterfall & Prehistoric Rock Shelters',
    categoryBadge: 'Waterfalls & Canyons',
    location: 'Ghorawal Region, Sonbhadra District, Uttar Pradesh',
    coordinates: { lat: 24.7167, lng: 82.7833, label: 'Mukha Falls, Ghorawal, Sonbhadra' },
    summary: 'Surging from the Belan river basin near Ghorawal, Mukha Waterfalls drops dramatically into a massive horseshoe-shaped sandstone canyon. Revered for its untouched raw wilderness, the surrounding cliffs shelter ancient cave art and mesolithic rock shelters.',

    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1600&q=85',
        fallback: '../../../public/assets/images/destinations/mukha-falls.webp',
        alt: 'Mukha Waterfalls cascading dramatically over horseshoe canyon',
        caption: 'The thunderous main fall plunging into the prehistoric horseshoe canyon',
        type: 'featured'
      },
      {
        url: 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1498855926480-d98e83099315?auto=format&fit=crop&w=1600&q=85',
        alt: 'Crystal mountain river winding between massive sandstone boulders',
        caption: 'The pristine stream bed of Belan river framed by towering golden cliffs',
        type: 'nature'
      },
      {
        url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=85',
        fallback: '../../../public/assets/images/destinations/salkhan-fossils.webp',
        alt: 'Prehistoric rock art shelters and petroglyphs near the falls',
        caption: 'Ancient ochre petroglyphs and mesolithic rock shelters along the gorge',
        type: 'archaeology'
      },
      {
        url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=85',
        fallback: '../../../public/assets/images/destinations/sonbhadra-forests.webp',
        alt: 'Rugged Vindhyan plateau savanna stretching to the horizon',
        caption: 'Expansive Vindhyan plateau wilderness surrounding the Ghorawal escarpment',
        type: 'landscape'
      },
      {
        url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1600&q=85',
        alt: 'Monsoon mist and rainbow glowing over the waterfall plunge',
        caption: 'Prismatic monsoon mist dancing over the canyon depths in morning light',
        type: 'nature'
      }
    ],

    stories: [
      {
        id: 'prehistoric-canyon',
        title: 'Where the Stone Age Whispers',
        subtitle: 'Millennia of human civilization along the Belan River basin',
        tag: 'Prehistoric Archaeology',
        readTime: '4 min read',
        quote: 'The Belan river valley surrounding Mukha is recognized by archaeologists worldwide as one of humanity’s oldest continuous habitation corridors.',
        content: [
          'Long before recorded history, hunter-gatherer societies sought shelter in the sandstone overhangs flanking the Mukha gorge. Excavations across the Belan valley revealed Stone Age tools spanning Lower Paleolithic to Neolithic eras.',
          'Natural ochre paintings depicting deer, hunting scenes, and community symbols still adorn the walls of nearby rock shelters. <span class="badge-verify" title="Archaeological Survey of India rock shelter documentation">[VERIFY: Carbon dating dates oldest Belan valley artifacts back over 20,000 years]</span>.',
          'Standing at the canyon edge today, the timeless roar of water plunging into the void links visitors directly with the primordial world our ancestors experienced.'
        ]
      },
      {
        id: 'monsoon-drama',
        title: 'The Canyon Roar of Ghorawal',
        subtitle: 'The dramatic transformation during the Indian summer monsoon',
        tag: 'Monsoon Wonder',
        readTime: '3 min read',
        quote: 'During August, the Belan river floods its red sandstone shelf, producing a roaring horseshoe cascade that rivals celebrated global falls.',
        content: [
          'In dry months, Mukha is an intimate scenic picnic spot with crystal waters trickling over terraced sandstone benches. But with the first monsoon downpours, it transforms into an awe-inspiring natural amphitheater.',
          'Mist rises hundreds of feet into the air, creating permanent rainbows across the canyon while cool mountain gusts blow through the gorge.',
          'Eco-travelers prize Mukha for its wild seclusion — far away from commercial tourist commercialization.'
        ]
      }
    ],

    creators: [
      {
        id: 'creator5776',
        name: 'Creator Ashish',
        handle: '@creator5776',
        hometown: 'Renukoot, Sonbhadra',
        avatar: 'https://res.cloudinary.com/gchwcnsd/image/upload/v1790800165/ooyeedl5idujsw9nppgd.png',
        isVerified: true,
        primaryFocus: 'Wild Waterfall Trails & Canyon Navigation',
        bio: 'Passionate local explorer documenting the high-altitude viewpoints, industrial heritage, and tranquil waters of Renukoot and Govind Sagar.',
        profileUrl: '../index.html#creators',
        social: {
          instagram: 'https://instagram.com/[PLACEHOLDER]',
          youtube: 'https://youtube.com/[PLACEHOLDER]'
        },
        recentPosts: [
          {
            title: 'Hidden Mukha Falls Canyon Trek',
            thumbnail: 'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=600&q=75',
            type: 'Expedition',
            views: '29.3K views'
          }
        ]
      }
    ],

    quickFacts: {
      bestSeason: 'August to January (Magnificent water flow and lush green canyon surrounds)',
      timings: '07:00 AM – 05:00 PM (Return before dusk due to remote forest roads)',
      entryFee: 'Nominal parking / local village development fee (₹20 – ₹50)',
      difficulty: 'Easy to Moderate (Short walk from vehicle parking to viewpoint; steep trek down to canyon floor)',
      nearestRailway: 'Robertsganj Railway Station (SBDR) — 45 km',
      nearestAirport: 'Varanasi International Airport (LBS) — ~95 km',
      howToReach: 'Drive from Robertsganj towards Ghorawal along rural scenic roads. From Ghorawal town, a 12 km rural link road leads through tribal villages to the canyon ridge parking.'
    },

    mapDetails: {
      lat: 24.7167,
      lng: 82.7833,
      mapQuery: 'Mukha Falls, Ghorawal, Sonbhadra, Uttar Pradesh',
      terrain: 'Sandstone canyon, rocky ledges, open savanna forest, and water pools.',
      landmarks: [
        'Belan River Archaeological Sites (15 km)',
        'Ghorawal Town & Traditional Market (12 km)',
        'Kaimur Wildlife Sanctuary Boundary (20 km)'
      ],
      safetyNotes: 'No guardrails along the sheer canyon cliff drop-offs. Keep children closely supervised. Avoid walking near slippery rim edges.'
    },

    communityGuidelines: {
      etiquette: [
        'Respect tribal village culture and customs along the route to the falls.',
        'Obtain permission before photographing village residents.',
        'Carry packed food and plenty of water as there are minimal commercial stalls.'
      ],
      ecoRules: [
        'Leave No Trace: Carry back every piece of trash and plastic packaging.',
        'Never touch or scratch ancient cave petroglyphs or rock surfaces.',
        'Do not light campfires near dry scrub vegetation.'
      ],
      safetyWarnings: [
        'Never attempt to dive into the plunge pool from high cliffs.',
        'Be alert for sudden water level rises after upstream rains.',
        'Wear footwear with strong rubber grip for sandstone rocks.'
      ]
    },

    relatedSlugs: ['lakhaniya-dari', 'vijaygarh-fort', 'kaimur-sanctuary']
  },

  'salkhan-fossils': {
    slug: 'salkhan-fossils',
    name: 'Salkhan Fossil Park (Stromatolites)',
    shortName: 'Salkhan Fossils',
    tagline: '1.4-billion-year-old petrified evidence of primordial life on Earth',
    category: 'Prehistoric Geology & Natural Heritage',
    categoryBadge: 'Prehistoric Geology',
    location: 'Salkhan Village, Sonbhadra District, Uttar Pradesh',
    coordinates: { lat: 24.5833, lng: 83.0833, label: 'Salkhan Fossil Park, Sonbhadra' },
    summary: 'Older than the dinosaurs and pre-dating complex multicellular organisms, the Salkhan Fossil Park preserves stromatolites formed by cyanobacteria over 1.4 billion years ago. A site of global geological heritage, these fossilized circular rings are embedded directly into ancient Vindhyan sandstone beds.',

    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=85',
        fallback: '../../../public/assets/images/destinations/salkhan-fossils.webp',
        alt: '1.4-billion-year-old Stromatolite fossils at Salkhan',
        caption: 'Petrified Precambrian algal fossils dating back 1.4 billion years',
        type: 'featured'
      },
      {
        url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85',
        alt: 'Concentric rings and layered stromatolite structures in sandstone',
        caption: 'Distinctive concentric ring patterns created by ancient cyanobacteria',
        type: 'geology'
      },
      {
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=85',
        alt: 'Geological trail through the open-air fossil park',
        caption: 'Walking path traversing the ancient Precambrian sedimentary rock terrace',
        type: 'nature'
      },
      {
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85',
        fallback: '../../../public/assets/images/destinations/salkhan-fossils.webp',
        alt: 'Prehistoric sandstone outcrops and scrub hills of Salkhan',
        caption: 'Rugged terrain preserving Earth’s earliest macroscopic life evidence',
        type: 'landscape'
      },
      {
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?auto=format&fit=crop&w=1600&q=85',
        alt: 'Golden hour sunset casting warm shadows on ancient fossil beds',
        caption: 'Sunset illuminating rock surfaces that formed before complex life existed',
        type: 'sunset'
      }
    ],

    stories: [
      {
        id: 'primordial-life',
        title: 'Before the Dinosaurs: Life 1.4 Billion Years Ago',
        subtitle: 'How microbial mats shaped the oxygen of our planet',
        tag: 'Precambrian Science',
        readTime: '4 min read',
        quote: 'These fossilized rings are tangible relics from the era when single-celled life was inventing the atmosphere we breathe today.',
        content: [
          'Spread across 25 hectares near the Robertsganj plateau, the stromatolites of Salkhan were formed during the Mesoproterozoic era, approximately 1,400 million years ago.',
          'Colonies of photosynthetic cyanobacteria trapped layers of fine sediment in shallow warm marine bays, gradually mineralizing into tree-ring-like concentric cylindrical stone pillars.',
          'Geologists worldwide consider Salkhan to rival or exceed the famous fossil parks of America and Australia in density and preservation state.'
        ]
      }
    ],

    creators: [
      {
        id: 'vindhya-heritage-walks',
        name: 'Vindhya Heritage Explorer',
        handle: '@vindhyaheritage',
        hometown: 'Robertsganj, Sonbhadra',
        avatar: '../../../public/assets/images/creators/vindhya-heritage.webp',
        isVerified: true,
        primaryFocus: 'Prehistoric Geology & Heritage Preservation',
        bio: 'Preserving ancient oral histories, medieval fort architecture, and millennia-old rock shelters hidden across Sonbhadra’s plateau.',
        profileUrl: '../index.html#creators',
        social: {
          instagram: 'https://instagram.com/[PLACEHOLDER]',
          youtube: 'https://youtube.com/[PLACEHOLDER]'
        },
        recentPosts: [
          {
            title: 'Touching 1.4 Billion Years of History',
            thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=75',
            type: 'Geology Vlog',
            views: '35.4K views'
          }
        ]
      }
    ],

    quickFacts: {
      bestSeason: 'October to March (Pleasant weather for open-rock walking)',
      timings: '08:00 AM – 05:30 PM daily',
      entryFee: 'Nominal Forest Dept ticket (₹10 – ₹20 per visitor)',
      difficulty: 'Easy (Gradual stone steps and flat earthen pathways)',
      nearestRailway: 'Robertsganj Railway Station (RBGJ) — 16 km',
      nearestAirport: 'Varanasi International Airport (LBS) — ~115 km',
      howToReach: 'Located just 1.5 km off State Highway 5A near Salkhan village, easily accessible by auto or taxi from Robertsganj.'
    },

    mapDetails: {
      lat: 24.5833,
      lng: 83.0833,
      mapQuery: 'Salkhan Fossil Park, Sonbhadra, Uttar Pradesh',
      terrain: 'Sandstone ridges, dry deciduous scrub forest, exposed rock terraces.',
      landmarks: [
        'Veer Lorik Stone (14 km)',
        'Vijaygarh Fort (18 km)',
        'Robertsganj Market (16 km)'
      ],
      safetyNotes: 'Rocks can become very hot during midday summer sun. Carry a hat, sunglasses, and water.'
    },

    communityGuidelines: {
      etiquette: [
        'Do not chip, hammer, or take pieces of fossil stone as souvenirs.',
        'Follow designated walkways and avoid scraping rock surfaces with hard objects.',
        'Respect this rare global geological treasure.'
      ],
      ecoRules: [
        'Strictly zero plastic littering in the reserve.',
        'Keep noise levels low to respect local flora and birdlife.'
      ],
      safetyWarnings: [
        'Watch your footing over unpaved rock fissures.',
        'Do not climb unstable boulder stacks.'
      ]
    },

    relatedSlugs: ['vijaygarh-fort', 'agori-fort', 'lakhaniya-dari']
  },

  'salkhan-fossil-park': {
    slug: 'salkhan-fossil-park',
    name: 'Salkhan Fossil Park (Stromatolites)',
    shortName: 'Salkhan Fossils',
    tagline: '1.4-billion-year-old petrified evidence of primordial life on Earth',
    category: 'Prehistoric Geology & Natural Heritage',
    categoryBadge: 'Prehistoric Geology',
    location: 'Salkhan Village, Sonbhadra District, Uttar Pradesh',
    coordinates: { lat: 24.5833, lng: 83.0833, label: 'Salkhan Fossil Park, Sonbhadra' },
    summary: 'Older than the dinosaurs and pre-dating complex multicellular organisms, the Salkhan Fossil Park preserves stromatolites formed by cyanobacteria over 1.4 billion years ago. A site of global geological heritage, these fossilized circular rings are embedded directly into ancient Vindhyan sandstone beds.',

    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=85',
        fallback: '../../../public/assets/images/destinations/salkhan-fossils.webp',
        alt: '1.4-billion-year-old Stromatolite fossils at Salkhan',
        caption: 'Petrified Precambrian algal fossils dating back 1.4 billion years',
        type: 'featured'
      },
      {
        url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85',
        alt: 'Concentric rings and layered stromatolite structures in sandstone',
        caption: 'Distinctive concentric ring patterns created by ancient cyanobacteria',
        type: 'geology'
      },
      {
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=85',
        alt: 'Geological trail through the open-air fossil park',
        caption: 'Walking path traversing the ancient Precambrian sedimentary rock terrace',
        type: 'nature'
      },
      {
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85',
        fallback: '../../../public/assets/images/destinations/salkhan-fossils.webp',
        alt: 'Prehistoric sandstone outcrops and scrub hills of Salkhan',
        caption: 'Rugged terrain preserving Earth’s earliest macroscopic life evidence',
        type: 'landscape'
      },
      {
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85',
        fallback: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?auto=format&fit=crop&w=1600&q=85',
        alt: 'Golden hour sunset casting warm shadows on ancient fossil beds',
        caption: 'Sunset illuminating rock surfaces that formed before complex life existed',
        type: 'sunset'
      }
    ],

    stories: [
      {
        id: 'primordial-life',
        title: 'Before the Dinosaurs: Life 1.4 Billion Years Ago',
        subtitle: 'How microbial mats shaped the oxygen of our planet',
        tag: 'Precambrian Science',
        readTime: '4 min read',
        quote: 'These fossilized rings are tangible relics from the era when single-celled life was inventing the atmosphere we breathe today.',
        content: [
          'Spread across 25 hectares near the Robertsganj plateau, the stromatolites of Salkhan were formed during the Mesoproterozoic era, approximately 1,400 million years ago.',
          'Colonies of photosynthetic cyanobacteria trapped layers of fine sediment in shallow warm marine bays, gradually mineralizing into tree-ring-like concentric cylindrical stone pillars.',
          'Geologists worldwide consider Salkhan to rival or exceed the famous fossil parks of America and Australia in density and preservation state.'
        ]
      }
    ],

    creators: [
      {
        id: 'vindhya-heritage-walks',
        name: 'Vindhya Heritage Explorer',
        handle: '@vindhyaheritage',
        hometown: 'Robertsganj, Sonbhadra',
        avatar: '../../../public/assets/images/creators/vindhya-heritage.webp',
        isVerified: true,
        primaryFocus: 'Prehistoric Geology & Heritage Preservation',
        bio: 'Preserving ancient oral histories, medieval fort architecture, and millennia-old rock shelters hidden across Sonbhadra’s plateau.',
        profileUrl: '../index.html#creators',
        social: {
          instagram: 'https://instagram.com/[PLACEHOLDER]',
          youtube: 'https://youtube.com/[PLACEHOLDER]'
        },
        recentPosts: [
          {
            title: 'Touching 1.4 Billion Years of History',
            thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=75',
            type: 'Geology Vlog',
            views: '35.4K views'
          }
        ]
      }
    ],

    quickFacts: {
      bestSeason: 'October to March (Pleasant weather for open-rock walking)',
      timings: '08:00 AM – 05:30 PM daily',
      entryFee: 'Nominal Forest Dept ticket (₹10 – ₹20 per visitor)',
      difficulty: 'Easy (Gradual stone steps and flat earthen pathways)',
      nearestRailway: 'Robertsganj Railway Station (RBGJ) — 16 km',
      nearestAirport: 'Varanasi International Airport (LBS) — ~115 km',
      howToReach: 'Located just 1.5 km off State Highway 5A near Salkhan village, easily accessible by auto or taxi from Robertsganj.'
    },

    mapDetails: {
      lat: 24.5833,
      lng: 83.0833,
      mapQuery: 'Salkhan Fossil Park, Sonbhadra, Uttar Pradesh',
      terrain: 'Sandstone ridges, dry deciduous scrub forest, exposed rock terraces.',
      landmarks: [
        'Veer Lorik Stone (14 km)',
        'Vijaygarh Fort (18 km)',
        'Robertsganj Market (16 km)'
      ],
      safetyNotes: 'Rocks can become very hot during midday summer sun. Carry a hat, sunglasses, and water.'
    },

    communityGuidelines: {
      etiquette: [
        'Do not chip, hammer, or take pieces of fossil stone as souvenirs.',
        'Follow designated walkways and avoid scraping rock surfaces with hard objects.',
        'Respect this rare global geological treasure.'
      ],
      ecoRules: [
        'Strictly zero plastic littering in the reserve.',
        'Keep noise levels low to respect local flora and birdlife.'
      ],
      safetyWarnings: [
        'Watch your footing over unpaved rock fissures.',
        'Do not climb unstable boulder stacks.'
      ]
    },

    relatedSlugs: ['vijaygarh-fort', 'agori-fort', 'lakhaniya-dari']
  }
};
