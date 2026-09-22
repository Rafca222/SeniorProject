import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// Union type instead of TypeORM's 'enum' column type on purpose: the real
// Postgres column is TEXT with a CHECK constraint (from schema.sql), not a
// native Postgres ENUM type. Declaring it as 'enum' here would make TypeORM
// expect a database enum type that doesn't exist and was never created.
export type UserRole = 'user' | 'organizer' | 'admin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  // select: false -- this column is left OUT of normal queries by default,
  // so a plain "find all users" never accidentally leaks a password hash.
  // auth.service.ts opts back in explicitly only where it's actually needed
  // (verifying a login).
  @Column({ name: 'password_hash', select: false })
  passwordHash!: string;

  @Column({ type: 'text', default: 'user' })
  role!: UserRole;

  @Column({ name: 'roster_visible', default: true })
  rosterVisible!: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified!: boolean;

  @Column({ name: 'phone_verified', default: false })
  phoneVerified!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
