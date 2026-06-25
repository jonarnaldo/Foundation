import { Controller, Post, Get, Body, UseGuards, Request, UnauthorizedException, HttpCode } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { JwtAuthGuard } from './jwt-auth.guard'

const DEV_USER = { sub: 'dev-user-001', email: 'dev@foundation.app', name: 'Dev User' }

type MfaPayload = typeof DEV_USER & { mfa_pending: boolean; iat: number; exp: number }

@Controller('auth')
export class AuthController {
  constructor(private readonly jwt: JwtService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() body: { email?: string; password?: string }) {
    if (!body.email || !body.password) {
      throw new UnauthorizedException('Email and password are required')
    }
    if (process.env.NODE_ENV !== 'production') {
      if (body.email !== DEV_USER.email) {
        throw new UnauthorizedException('Invalid email or password')
      }
      const mfaToken = this.jwt.sign({ ...DEV_USER, mfa_pending: true }, { expiresIn: '5m' })
      return { requiresMfa: true, mfaToken }
    }
    throw new UnauthorizedException('Auth0 required in production')
  }

  @Post('mfa/verify')
  @HttpCode(200)
  verifyMfa(@Body() body: { mfaToken?: string; code?: string }) {
    if (!body.mfaToken || !body.code) {
      throw new UnauthorizedException('MFA token and code are required')
    }
    if (process.env.NODE_ENV !== 'production') {
      let payload: MfaPayload
      try {
        payload = this.jwt.verify<MfaPayload>(body.mfaToken)
      } catch {
        throw new UnauthorizedException('Invalid or expired MFA session')
      }
      if (!payload.mfa_pending) throw new UnauthorizedException('Invalid MFA session')
      if (!/^\d{6}$/.test(body.code)) throw new UnauthorizedException('Invalid MFA code — must be 6 digits')
      const accessToken = this.jwt.sign({ sub: payload.sub, email: payload.email, name: payload.name })
      return { accessToken, user: { sub: payload.sub, email: payload.email, name: payload.name } }
    }
    throw new UnauthorizedException('Auth0 required in production')
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req: Express.Request & { user: typeof DEV_USER }) {
    return req.user
  }

  @Post('logout')
  @HttpCode(204)
  logout() {
    // Stateless JWT — client clears token from localStorage
  }
}
