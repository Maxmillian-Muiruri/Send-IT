import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (user && (user.role === 'ADMIN' || user.role === 'admin')) {
      return true;
    }
    throw new ForbiddenException('Only admins can perform this action');
  }
}
