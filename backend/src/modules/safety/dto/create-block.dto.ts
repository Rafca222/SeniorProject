import { IsUUID } from 'class-validator';

export class CreateBlockDto {
  @IsUUID()
  blocked_id!: string;
}
