import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Event } from './event.entity';

// No single 'id' column here -- schema.sql gives this table a composite
// primary key of (user_id, event_id) instead, so that's what we mirror.
@Entity('saved_events')
export class SavedEvent {
  @PrimaryColumn({ name: 'user_id' })
  userId!: string;

  @PrimaryColumn({ name: 'event_id' })
  eventId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event?: Event;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
