import { Entity, Column } from 'typeorm';
import { userRole } from '../users/enums/userRole.enum';

@Entity('users')
export class User {
  @Column({ type: 'varchar', default: userRole.USER })
  role: userRole;
}
