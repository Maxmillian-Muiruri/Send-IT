import { IsString, IsOptional } from 'class-validator';

export class UpdateStatusDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  changedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
