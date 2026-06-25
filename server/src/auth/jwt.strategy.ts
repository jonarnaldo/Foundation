import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { passportJwtSecret } from 'jwks-rsa'

const isDev = process.env.NODE_ENV !== 'production'

function buildStrategyOptions() {
  if (isDev) {
    return {
      secretOrKey: process.env.JWT_SECRET || 'dev-jwt-secret',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['HS256'] as string[],
      ignoreExpiration: true,
    }
  }
  return {
    secretOrKeyProvider: passportJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    }),
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256'] as string[],
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super(buildStrategyOptions())
  }

  validate(payload: Record<string, unknown>) {
    return payload
  }
}
