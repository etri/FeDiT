import { Controller, Get } from '@nestjs/common';

import { OrganizationsService } from './organizations.service';
import { Role } from '../common/constants';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.organizationsService.findAll();
  }
}
