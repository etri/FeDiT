import { IsString, MinLength } from 'class-validator';

export class RequestAccountDeletionDto {
  @IsString()
  @MinLength(1)
  password: string;
}
