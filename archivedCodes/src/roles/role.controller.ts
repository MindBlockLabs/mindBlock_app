import { Controller, Post, UseGuards, Delete, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { userRole } from 'src/users/enums/userRole.enum';

@Controller('admin/iq-questions')
export class IQAdminController {
  @Post()
  @Roles(userRole.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create() {
    return { message: 'Question created successfully' };
  }

  @Delete(':id')
  @Roles(userRole.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  delete(@Param('id') id: string) {
    return { message: `Question ${id} deleted` };
  }
}
