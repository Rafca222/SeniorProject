import { IsString, IsNumber, IsOptional, IsIn, MinLength, IsInt, IsUrl } from 'class-validator';

// Same fields as CreateEventDto, but every one is optional -- a PATCH-style
// partial update where the client only sends what's actually changing.
export class UpdateEventDto {
  @IsOptional() @IsString() @MinLength(3)
  title?: string;

  @IsOptional() @IsString() @MinLength(10)
  description?: string;

  @IsOptional() @IsString() @MinLength(2)
  venue_name?: string;

  @IsOptional() @IsString()
  venue_description?: string;

  @IsOptional() @IsString() @MinLength(2)
  category?: string;

  @IsOptional() @IsString()
  start_datetime?: string;

  @IsOptional() @IsInt()
  minimum_age?: number;

  @IsOptional() @IsNumber()
  lat?: number;

  @IsOptional() @IsNumber()
  lng?: number;

  @IsOptional() @IsString() @MinLength(2)
  city?: string;

  @IsOptional() @IsUrl()
  cover_image_url?: string;

  @IsOptional() @IsIn(['open', 'approval'])
  join_policy?: 'open' | 'approval';
}
