import { Controller, Get } from '@nestjs/common';

import { RolesService } from './roles.service';
import { Role } from '../common/constants';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.rolesService.findAllRoles();
  }
}
