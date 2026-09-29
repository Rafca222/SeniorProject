import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './modules/users/entities/user.entity';
import { Event } from './modules/events/entities/event.entity';
import { Attendance } from './modules/events/entities/attendance.entity';
import { SavedEvent } from './modules/events/entities/saved-event.entity';
import { Message } from './modules/events/entities/message.entity';
import { Report } from './modules/safety/entities/report.entity';
import { Block } from './modules/safety/entities/block.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Supabase's pooler, same as the old pool.js

  // CRITICAL: never set this to true. synchronize:true makes TypeORM
  // auto-alter your LIVE database to match these entity files on every
  // startup -- on a database that already has real seeded data, that is
  // how you silently lose or corrupt it. All schema changes from here on
  // go through migrations instead (npm run migration:generate / :run).
  synchronize: false,

  logging: false,
  entities: [User, Event, Attendance, SavedEvent, Message, Report, Block],

  // __dirname makes this resolve correctly in BOTH contexts automatically:
  // when this file runs via ts-node locally, __dirname points at src/, so
  // it finds the .ts migration; when it runs as compiled dist/data-source.js
  // in production, __dirname points at dist/, so it finds the compiled .js
  // version instead -- never the raw .ts file, which is what broke on
  // Render (a newer Node version tried to load that raw file directly and
  // choked on a TypeScript-only interface with no real JS equivalent).
  migrations: [__dirname + '/migrations/*.{js,ts}'],
});