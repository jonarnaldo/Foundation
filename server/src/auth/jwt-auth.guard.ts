import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

const DEV_USER = { sub: 'dev-user-001', email: 'dev@foundation.app', name: 'Dev User' }

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    if (process.env.NODE_ENV !== 'production') {
      const req = context.switchToHttp().getRequest()
      req.user = DEV_USER
      return true
    }
    return super.canActivate(context)
  }
}
