import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { DB_NAME } from '../constants.js';
import { Destination } from '../models/destination.model.js';

export const CATALOG = [
  {
    slug: 'lakhaniya-dari',
    name: 'Lakhaniya Dari Falls',
    category: 'Waterfalls & Trekking',
    categorySlug: 'waterfalls',
    tagline: 'Cascading waters enveloped by virgin Vindhyan forests',
    summary: 'A breathtaking multi-tiered natural cascade nestled in deep forested gorges. Renowned for its untouched nature trails, boulder streams, and monsoon tranquility.',
    coverImage: '/public/assets/images/destinations/lakhaniya-dari.webp',
    location: 'Near Ahraura / Robertsganj, Sonbhadra',
    isPublished: true
  },
  {
    slug: 'rihand-dam',
    name: 'Govind Ballabh Pant Sagar (Rihand Dam)',
    category: 'Lakes & Engineering Wonders',
    categorySlug: 'dams',
    tagline: 'One of Asia’s largest artificial water bodies',
    summary: 'A majestic reservoir surrounded by rolling green hillocks and tranquil blue waters, offering expansive horizons and breathtaking golden hour panoramas.',
    coverImage: '/public/assets/images/destinations/rihand-dam.webp',
    location: 'Pipri, Sonbhadra',
    isPublished: true
  },
  {
    slug: 'vijaygarh-fort',
    name: 'Vijaygarh Fort',
    category: 'Ancient Heritage & Rock Art',
    categorySlug: 'heritage',
    tagline: '5th-century citadel perched on a rugged ridge',
    summary: 'An ancient hill fortress rich in medieval lore, perennial cave reservoirs, rock carvings, and commanding 360-degree vistas over the Son valley.',
    coverImage: '/public/assets/images/destinations/vijaygarh-fort.webp',
    location: 'Mau Kalan, Sonbhadra',
    isPublished: true
  },
  {
    slug: 'agori-fort',
    name: 'Agori Fort (Son & Renu Sangam)',
    category: 'River Confluences & Fortresses',
    categorySlug: 'heritage',
    tagline: 'River island fortress flanked by twin rivers',
    summary: 'Encircled by the shimmering waters of the Son and Renu rivers, this historic fort requires a picturesque riverboat crossing to explore its stone bastions.',
    coverImage: '/public/assets/images/destinations/agori-fort.webp',
    location: 'Chopan, Sonbhadra',
    isPublished: true
  },
  {
    slug: 'mukha-falls',
    name: 'Mukha Waterfalls',
    category: 'Waterfalls & Canyons',
    categorySlug: 'waterfalls',
    tagline: 'Dramatic canyon plunge amid prehistoric sandstone',
    summary: 'A thunderous waterfall dropping into dramatic sandstone gorges where ancient cave shelters and prehistoric rock paintings dot the escarpment.',
    coverImage: '/public/assets/images/destinations/mukha-falls.webp',
    location: 'Ghorawal Region, Sonbhadra',
    isPublished: true
  },
  {
    slug: 'salkhan-fossils',
    name: 'Salkhan Fossil Park',
    category: 'Prehistoric Geology',
    categorySlug: 'geology',
    tagline: '1.4-billion-year-old Stromatolite fossils',
    summary: 'A globally significant geological marvel containing petrified algal tree rings that date back over a billion years — older than the dinosaurs.',
    coverImage: '/public/assets/images/destinations/salkhan-fossils.webp',
    location: 'Salkhan, Sonbhadra',
    isPublished: true
  },
  {
    slug: 'obra-dam',
    name: 'Obra Dam',
    category: 'Lakes & Engineering Wonders',
    categorySlug: 'dams',
    tagline: 'Hydroelectric marvel nestled in lush Vindhyan hills',
    summary: 'A serene hydroelectric dam surrounded by verdant forests. The monsoon spillway creates an awe-inspiring artificial cascade that rivals natural waterfalls.',
    coverImage: '/public/assets/images/destinations/rihand-dam.webp',
    location: 'Obra, Sonbhadra',
    isPublished: true
  },
  {
    slug: 'chopan-ghats',
    name: 'Chopan Ghats',
    category: 'River Confluences & Fortresses',
    categorySlug: 'confluence',
    tagline: 'Sacred riverbanks on the shimmering Son River',
    summary: 'Historic stone ghats where tribal traditions and cultural rituals meet the flowing waters of the Son River, renowned for peaceful sunset vistas.',
    coverImage: '/public/assets/images/destinations/agori-fort.webp',
    location: 'Chopan, Sonbhadra',
    isPublished: true
  },
  {
    slug: 'kaimur-sanctuary',
    name: 'Kaimur Wildlife Sanctuary',
    category: 'Nature & Wildlife',
    categorySlug: 'nature',
    tagline: 'Vast protected plateau forest of the Kaimur Range',
    summary: 'A sprawling sanctuary home to leopards, sloth bears, sambar, and rare migratory birds amidst sandstone gorges and seasonal cascades.',
    coverImage: '/public/assets/images/destinations/lakhaniya-dari.webp',
    location: 'Robertsganj / Ghorawal, Sonbhadra',
    isPublished: true
  }
];

export async function seedDestinations() {
  for (const item of CATALOG) {
    const existing = await Destination.findOne({
      $or: [
        { slug: item.slug },
        { slug: item.slug === 'salkhan-fossils' ? 'salkhan-fossil-park' : item.slug },
        { name: item.name }
      ]
    });
    if (!existing) {
      const created = await Destination.create(item);
      console.log('✨ Seeded destination in Atlas:', created.name, `(${created.slug})`);
    } else {
      console.log('✔️ Destination exists in Atlas:', existing.name, `(${existing.slug})`);
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed-destinations.js')) {
  mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME })
    .then(async () => {
      console.log('Connected to Atlas DB:', mongoose.connection.name);
      await seedDestinations();
      console.log('Seeding complete!');
      process.exit(0);
    })
    .catch(err => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}
