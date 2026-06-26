import { CanActivate, Injectable } from '@nestjs/common';

@Injectable()
export class PermissionGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
