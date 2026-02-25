import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns basic health payload for gateway', () => {
    const controller = new HealthController();

    const response = controller.getHealth();

    expect(response.status).toBe('ok');
    expect(response.service).toBe('gateway');
    expect(typeof response.time).toBe('string');
    expect(Number.isNaN(Date.parse(response.time))).toBe(false);
  });
});
