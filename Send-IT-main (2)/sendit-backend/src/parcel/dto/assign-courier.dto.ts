import { IsString, IsOptional } from 'class-validator';

export class AssignCourierDto {
  @IsString()
  courierId: string;

  @IsOptional()
  @IsString()
  assignedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
