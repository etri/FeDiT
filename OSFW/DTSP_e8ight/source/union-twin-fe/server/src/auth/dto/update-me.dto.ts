import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  organization?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string | null;
}
