import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ApiKeyScope {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin',
  CUSTOM = 'custom',
}

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Hashed API key' })
  @Column('varchar', { length: 255, unique: true })
  keyHash: string;

  @ApiProperty({ description: 'User-friendly name for the API key' })
  @Column('varchar', { length: 100 })
  name: string;

  @ApiProperty({ description: 'Associated user ID' })
  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    description: 'Scopes/permissions for this API key',
    enum: ApiKeyScope,
    isArray: true,
  })
  @Column('simple-array', { default: [ApiKeyScope.READ] })
  scopes: ApiKeyScope[];

  @ApiProperty({ description: 'Expiration date' })
  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @ApiProperty({ description: 'Whether the key is active' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Last used timestamp' })
  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  @ApiProperty({ description: 'Usage count' })
  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @ApiProperty({ description: 'IP whitelist (optional)' })
  @Column('simple-array', { nullable: true })
  ipWhitelist?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}