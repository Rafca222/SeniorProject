import { IsString, IsNumber, IsOptional, IsIn, MinLength, IsInt, IsUrl } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsString()
  @MinLength(2)
  venue_name!: string;

  @IsOptional()
  @IsString()
  venue_description?: string;

  @IsString()
  @MinLength(2)
  category!: string;

  @IsString()
  start_datetime!: string; // ISO string from the client

  @IsOptional()
  @IsInt()
  minimum_age?: number;

  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsString()
  @MinLength(2)
  city!: string;

  @IsOptional()
  @IsUrl()
  cover_image_url?: string;

  @IsOptional()
  @IsIn(['open', 'approval'])
  join_policy?: 'open' | 'approval';
}
