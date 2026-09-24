import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('blocks')
export class Block {
  @PrimaryColumn({ name: 'blocker_id' })
  blockerId!: string;

  @PrimaryColumn({ name: 'blocked_id' })
  blockedId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'blocker_id' })
  blocker?: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'blocked_id' })
  blocked?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
