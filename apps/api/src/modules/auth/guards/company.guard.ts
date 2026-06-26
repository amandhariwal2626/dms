import { CanActivate, Injectable } from '@nestjs/common';

@Injectable()
export class CompanyGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
