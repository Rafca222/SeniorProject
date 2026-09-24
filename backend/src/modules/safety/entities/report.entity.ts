import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'reporter_id' })
  reporterId!: string;

  @Column({ name: 'reported_user_id' })
  reportedUserId!: string;

  @Column({ name: 'event_id', nullable: true })
  eventId?: string;

  @Column()
  reason!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter?: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_user_id' })
  reportedUser?: User;

  @ManyToOne(() => Event, { nullable: true })
  @JoinColumn({ name: 'event_id' })
  event?: Event;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
