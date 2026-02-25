import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): { status: string; service: string; time: string } {
    return {
      status: 'ok',
      service: 'gateway',
      time: new Date().toISOString(),
    };
  }
}
