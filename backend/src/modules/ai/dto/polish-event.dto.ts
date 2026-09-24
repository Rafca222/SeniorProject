import { IsString, MinLength } from 'class-validator';

export class PolishEventDto {
  @IsString()
  @MinLength(5, { message: 'Give a few words about the event first' })
  notes!: string;
}
