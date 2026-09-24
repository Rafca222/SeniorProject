import { IsString, MinLength } from 'class-validator';

export class ParseSearchDto {
  @IsString()
  @MinLength(3)
  query!: string;
}
