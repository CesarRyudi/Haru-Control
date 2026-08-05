import { IsString, IsOptional } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  observation?: string;
}
