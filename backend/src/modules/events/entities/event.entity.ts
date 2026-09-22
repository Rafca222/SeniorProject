import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type JoinPolicy = 'open' | 'approval'; // see user.entity.ts for why this isn't a TypeORM 'enum' column

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column({ name: 'venue_name' })
  venueName!: string;

  @Column({ name: 'venue_description', nullable: true })
  venueDescription?: string;

  @Column()
  category!: string;

  @Column({ name: 'start_datetime', type: 'timestamptz' })
  startDatetime!: Date;

  @Column({ name: 'minimum_age', type: 'int', nullable: true })
  minimumAge?: number;

  @Column({ type: 'double precision' })
  lat!: number;

  @Column({ type: 'double precision' })
  lng!: number;

  @Column()
  city!: string;

  @Column({ name: 'cover_image_url', nullable: true })
  coverImageUrl?: string;

  @Column({ name: 'is_promoted', default: false })
  isPromoted!: boolean;

  @Column({ name: 'join_policy', type: 'text', default: 'open' })
  joinPolicy!: JoinPolicy;

  @Column({ name: 'created_by' })
  createdBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
