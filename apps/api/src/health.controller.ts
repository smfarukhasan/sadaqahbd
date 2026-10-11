import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

/** A dependency-free liveness endpoint for Passenger and uptime monitoring. */
@Controller('health')
export class HealthController {
  @Get()
  @SkipThrottle()
  check() {
    return { status: 'ok' };
  }
}
