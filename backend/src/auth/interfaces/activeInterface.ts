import { userRole } from '../../users/enums/userRole.enum';

/**Active user data interface */
export interface ActiveUserData {
  /**sub of type number */
  sub: string;

  /**email of type string */
  email?: string;

  /**authenticated user role */
  userRole?: userRole;
}
