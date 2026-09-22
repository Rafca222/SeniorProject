import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsBoolean()
  roster_visible?: boolean;
}
