import { Entity, Column } from 'typeorm';
import { userRole } from 'src/users/enums/userRole.enum';

@Entity('users')
export class User {
  @Column({ type: 'enum', enum: userRole, default: userRole.USER })
  role: userRole;
}
