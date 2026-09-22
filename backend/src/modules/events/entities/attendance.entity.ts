import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from './event.entity';

export type AttendanceStatus = 'going' | 'pending' | 'declined';

@Entity('attendance')
@Unique(['userId', 'eventId']) // matches schema.sql's UNIQUE(user_id, event_id)
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'event_id' })
  eventId!: string;

  @Column({ type: 'text', default: 'going' })
  status!: AttendanceStatus;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event?: Event;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
