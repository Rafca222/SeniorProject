import { IsUUID, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateReportDto {
  @IsUUID()
  reported_user_id!: string;

  @IsOptional()
  @IsUUID()
  event_id?: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
