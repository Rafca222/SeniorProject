// Run from the backend/ folder: npm run seed
import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../src/data-source';
import { User } from '../src/modules/users/entities/user.entity';
import { Event } from '../src/modules/events/entities/event.entity';

const SEED_EMAIL = 'team@eventure.app';

const events: Partial<Event>[] = [
  {
    title: 'Sunrise Hike to Qadisha Valley',
    description: 'A guided morning hike through the UNESCO-listed Qadisha Valley, ending at a viewpoint over the ancient monasteries.',
    venueName: 'Qadisha Valley Trailhead',
    venueDescription: 'Meet at the trailhead parking lot near Bcharre. Moderate difficulty, sturdy shoes required.',
    category: 'Outdoor & Hiking',
    startDatetime: new Date('2026-10-04T06:30:00Z'),
    minimumAge: 12,
    lat: 34.2611, lng: 36.0103, city: 'Bcharre',
  },
  {
    title: 'Sea Kayaking at Jeita',
    description: 'A half-day sea kayaking trip along the coast near Jounieh, suitable for beginners.',
    venueName: 'Jounieh Bay',
    venueDescription: 'Life jackets and kayaks provided. Meet at the public beach access point.',
    category: 'Outdoor & Hiking',
    startDatetime: new Date('2026-10-11T09:00:00Z'),
    minimumAge: 10,
    lat: 33.9808, lng: 35.6178, city: 'Jounieh',
  },
  {
    title: 'Beirut Street Food Crawl',
    description: 'A walking tour through Mar Mikhael, sampling manakish, shawarma, and knefeh from five local spots.',
    venueName: 'Mar Mikhael',
    venueDescription: 'Meet outside Electricite du Liban building. Comfortable walking shoes recommended.',
    category: 'Food & Dining',
    startDatetime: new Date('2026-09-27T18:00:00Z'),
    lat: 33.8996, lng: 35.5259, city: 'Beirut',
  },
  {
    title: 'Byblos Old Souk Wine Tasting',
    description: 'An evening wine tasting featuring three Bekaa Valley vineyards, held in the historic Byblos souk.',
    venueName: 'Byblos Old Souk',
    venueDescription: 'Indoor/outdoor seating in the restored souk courtyard.',
    category: 'Food & Dining',
    startDatetime: new Date('2026-10-17T19:00:00Z'),
    minimumAge: 18,
    lat: 34.1208, lng: 35.6478, city: 'Byblos',
  },
  {
    title: 'Sursock Museum Contemporary Exhibit',
    description: 'A guided walkthrough of the latest contemporary Lebanese art exhibit, followed by an open Q&A with a featured artist.',
    venueName: 'Sursock Museum',
    venueDescription: 'Indoor gallery space, wheelchair accessible entrance on Sursock Street.',
    category: 'Arts & Culture',
    startDatetime: new Date('2026-09-30T17:00:00Z'),
    lat: 33.8919, lng: 35.5169, city: 'Beirut',
  },
  {
    title: 'Tripoli Old City Heritage Walk',
    description: 'A walking tour through Tripoli\'s Mamluk-era souks, khans, and the citadel of Raymond de Saint-Gilles.',
    venueName: 'Tripoli Citadel',
    venueDescription: 'Meet at the citadel entrance. About 2.5 hours of walking on uneven stone streets.',
    category: 'Arts & Culture',
    startDatetime: new Date('2026-10-18T10:00:00Z'),
    lat: 34.4367, lng: 35.8497, city: 'Tripoli',
  },
  {
    title: 'Open-Air Screening: Classic Lebanese Cinema',
    description: 'An outdoor screening of a restored classic Lebanese film, with popcorn and blankets provided.',
    venueName: 'Beirut Souks Rooftop',
    venueDescription: 'Rooftop venue, bring a light jacket for the evening breeze.',
    category: 'Movies & Entertainment',
    startDatetime: new Date('2026-10-09T20:00:00Z'),
    lat: 33.8967, lng: 35.5056, city: 'Beirut',
  },
  {
    title: 'Jounieh Drive-In Movie Night',
    description: 'A drive-in screening of a recent action blockbuster on Jounieh\'s waterfront.',
    venueName: 'Jounieh Waterfront Lot',
    venueDescription: 'Bring your own car or arrive on foot; seating areas available too.',
    category: 'Movies & Entertainment',
    startDatetime: new Date('2026-10-23T20:30:00Z'),
    lat: 33.9803, lng: 35.6197, city: 'Jounieh',
  },
  {
    title: 'Live Jazz Night at Onno Bar',
    description: 'A live jazz quartet performing original compositions and standards in an intimate setting.',
    venueName: 'Onno Bar',
    venueDescription: 'Indoor venue, seated and standing room available. 21+ recommended given the bar setting.',
    category: 'Music & Concerts',
    startDatetime: new Date('2026-10-02T21:00:00Z'),
    minimumAge: 18,
    lat: 33.8892, lng: 35.5197, city: 'Beirut',
  },
  {
    title: 'Byblos International Festival Warm-Up Show',
    description: 'An acoustic warm-up concert ahead of the main Byblos festival season, featuring emerging Lebanese artists.',
    venueName: 'Byblos Roman Amphitheatre Grounds',
    venueDescription: 'Outdoor seating on stone steps; cushions recommended.',
    category: 'Music & Concerts',
    startDatetime: new Date('2026-10-16T19:30:00Z'),
    lat: 34.1230, lng: 35.6489, city: 'Byblos',
  },
  {
    title: 'Rooftop Party: Beirut Skyline Sessions',
    description: 'A rooftop DJ set overlooking downtown Beirut, with resident and guest DJs.',
    venueName: 'Downtown Beirut Rooftop',
    venueDescription: 'Indoor/outdoor rooftop space. Valid ID required at entry.',
    category: 'Nightlife & Parties',
    startDatetime: new Date('2026-09-26T22:00:00Z'),
    minimumAge: 18,
    lat: 33.8959, lng: 35.5015, city: 'Beirut',
  },
  {
    title: 'Sea Sunset Beach Party',
    description: 'A beach club party with live DJs, starting at sunset and running until midnight.',
    venueName: 'Sea Sunset Beach Club',
    venueDescription: 'Outdoor beachfront venue. Cover charge at the door.',
    category: 'Nightlife & Parties',
    startDatetime: new Date('2026-10-10T18:30:00Z'),
    minimumAge: 18,
    lat: 33.9750, lng: 35.6100, city: 'Jounieh',
  },
  {
    title: '5v5 Football Tournament - Sin El Fil',
    description: 'A casual, open-registration 5-a-side football tournament, teams and free agents both welcome.',
    venueName: 'Sin El Fil Sports Complex',
    venueDescription: 'Outdoor turf pitches, bring your own cleats and water.',
    category: 'Sports & Fitness',
    startDatetime: new Date('2026-10-05T15:00:00Z'),
    minimumAge: 14,
    lat: 33.8781, lng: 35.5453, city: 'Sin El Fil',
  },
  {
    title: 'Sunrise Yoga on the Corniche',
    description: 'A free outdoor yoga session on the Beirut Corniche, all levels welcome, mats not provided.',
    venueName: 'Beirut Corniche',
    venueDescription: 'Meet near the Raouche end of the Corniche. Bring your own mat.',
    category: 'Sports & Fitness',
    startDatetime: new Date('2026-09-28T06:30:00Z'),
    lat: 33.8904, lng: 35.4700, city: 'Beirut',
  },
  {
    title: 'Skincare & Self-Care Workshop',
    description: 'A hands-on workshop covering skincare routines, led by a local dermatologist and beauty brand.',
    venueName: 'ABC Achrafieh Event Space',
    venueDescription: 'Indoor mall event space, third floor near the main atrium.',
    category: 'Beauty & Wellness',
    startDatetime: new Date('2026-10-12T17:00:00Z'),
    minimumAge: 16,
    lat: 33.8869, lng: 35.5131, city: 'Beirut',
  },
  {
    title: 'Cedars Ski Day',
    description: 'A guided beginner-friendly ski day at The Cedars, gear rental available on site.',
    venueName: 'The Cedars Ski Resort',
    venueDescription: 'Meet at the main lodge. Warm layers required; rentals available on site.',
    category: 'Outdoor & Hiking',
    startDatetime: new Date('2027-01-17T08:00:00Z'),
    minimumAge: 8,
    lat: 34.0169, lng: 36.0181, city: 'Bsharri',
  },
  {
    title: 'Chouf Cedar Reserve Trek',
    description: 'A nature trek through the Chouf Cedar Reserve, one of the largest reserves in Lebanon, with a local ranger guide.',
    venueName: 'Chouf Cedar Reserve',
    venueDescription: 'Meet at the Maasser el Chouf entrance. Moderate difficulty, 3-4 hours round trip.',
    category: 'Outdoor & Hiking',
    startDatetime: new Date('2026-10-24T08:30:00Z'),
    minimumAge: 10,
    lat: 33.7167, lng: 35.6667, city: 'Maasser el Chouf',
  },
  {
    title: 'Batroun Fish Market Food Tour',
    description: 'A guided tasting tour through Batroun\'s coastal seafood spots, ending with a sunset dinner by the marina.',
    venueName: 'Batroun Marina',
    venueDescription: 'Meet at the marina entrance. Includes 4 tasting stops.',
    category: 'Food & Dining',
    startDatetime: new Date('2026-11-01T17:30:00Z'),
    lat: 34.2550, lng: 35.6581, city: 'Batroun',
  },
  {
    title: 'Zahle Riverside Dinner',
    description: 'A traditional Lebanese mezze dinner along the Berdawni River, Zahle\'s famous riverside dining strip.',
    venueName: 'Berdawni River Strip',
    venueDescription: 'Outdoor riverside seating, reservation required.',
    category: 'Food & Dining',
    startDatetime: new Date('2026-10-30T19:30:00Z'),
    lat: 33.8463, lng: 35.9019, city: 'Zahle',
  },
  {
    title: 'Beiteddine Palace Art Fair',
    description: 'A curated fair featuring Lebanese painters, sculptors, and craftspeople, held in the courtyards of Beiteddine Palace.',
    venueName: 'Beiteddine Palace',
    venueDescription: 'Outdoor palace courtyards. Ticketed entry.',
    category: 'Arts & Culture',
    startDatetime: new Date('2026-10-25T11:00:00Z'),
    lat: 33.6942, lng: 35.5844, city: 'Beiteddine',
  },
  {
    title: 'Gemmayze Gallery Night',
    description: 'A one-night gallery crawl through Gemmayze\'s independent art spaces, with several openings running simultaneously.',
    venueName: 'Gemmayze Art District',
    venueDescription: 'Walking route across 5 galleries; a map is provided at the first stop.',
    category: 'Arts & Culture',
    startDatetime: new Date('2026-10-08T18:30:00Z'),
    lat: 33.8951, lng: 35.5197, city: 'Beirut',
  },
  {
    title: 'Outdoor Cinema Under the Stars - Batroun',
    description: 'A beachfront outdoor screening in Batroun, featuring a recent Lebanese independent film.',
    venueName: 'Batroun Beachfront',
    venueDescription: 'Bring a blanket or low chair; some seating provided.',
    category: 'Movies & Entertainment',
    startDatetime: new Date('2026-10-31T19:30:00Z'),
    lat: 34.2500, lng: 35.6580, city: 'Batroun',
  },
  {
    title: 'Symphony Night at Beirut Hippodrome',
    description: 'An evening orchestral performance by a Lebanese symphony ensemble, staged at the historic Beirut Hippodrome.',
    venueName: 'Beirut Hippodrome',
    venueDescription: 'Outdoor seating on the grounds; formal-casual dress suggested.',
    category: 'Music & Concerts',
    startDatetime: new Date('2026-11-07T20:00:00Z'),
    lat: 33.8794, lng: 35.5147, city: 'Beirut',
  },
  {
    title: 'Karaoke Night - Hamra',
    description: 'A weekly karaoke night at a Hamra bar, open sign-up, all skill levels welcome.',
    venueName: 'Hamra Street Bar',
    venueDescription: 'Indoor venue, 21+ recommended given the bar setting.',
    category: 'Nightlife & Parties',
    startDatetime: new Date('2026-09-25T21:30:00Z'),
    minimumAge: 18,
    lat: 33.8959, lng: 35.4806, city: 'Beirut',
  },
  {
    title: 'Padel Tournament - Dbayeh',
    description: 'An open-registration padel tournament, doubles format, beginner and intermediate brackets.',
    venueName: 'Dbayeh Padel Courts',
    venueDescription: 'Outdoor courts, bring your own racket or rent on site.',
    category: 'Sports & Fitness',
    startDatetime: new Date('2026-10-19T09:00:00Z'),
    minimumAge: 12,
    lat: 33.9439, lng: 35.5906, city: 'Dbayeh',
  },
  {
    title: 'Spa Day Retreat - Faqra',
    description: 'A full-day mountain spa retreat featuring guided stretching, sauna, and a group meditation session.',
    venueName: 'Faqra Wellness Retreat',
    venueDescription: 'Indoor/outdoor facility; robes and towels provided.',
    category: 'Beauty & Wellness',
    startDatetime: new Date('2026-10-26T10:00:00Z'),
    minimumAge: 16,
    lat: 33.9761, lng: 35.8264, city: 'Faqra',
  },
];

async function main() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const eventRepo = AppDataSource.getRepository(Event);

  let seedUser = await userRepo.findOne({ where: { email: SEED_EMAIL } });
  if (seedUser) {
    console.log('Using existing seed account:', SEED_EMAIL);
  } else {
    const passwordHash = await bcrypt.hash('SeedAccountNotForLogin123!', 12);
    seedUser = await userRepo.save(
      userRepo.create({ name: 'Eventure Team', email: SEED_EMAIL, passwordHash, role: 'organizer' })
    );
    console.log('Created seed account:', SEED_EMAIL);
  }

  let inserted = 0;
  for (const e of events) {
    const dup = await eventRepo.findOne({ where: { title: e.title } });
    if (dup) continue;

    await eventRepo.save(eventRepo.create({ ...e, createdBy: seedUser.id }));
    inserted++;
  }

  console.log(`Seeded ${inserted} new event(s). ${events.length - inserted} already existed and were skipped.`);
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
