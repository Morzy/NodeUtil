import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Redis } from 'ioredis';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly redis: Redis) { }

  async validateRequest(request) {
    const token = request.headers.authorization;
    const userId = await this.redis.get(token);
    if (userId) {
      request.userId = userId;
      return true;
    }
    return false;
  }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }
  

  
}
