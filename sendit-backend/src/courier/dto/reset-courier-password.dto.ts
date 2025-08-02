import { IsString } from 'class-validator';

export class ResetCourierPasswordDto {
  @IsString()
  courierId: string;
}
