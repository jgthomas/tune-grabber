// Mock pino before importing the logger
jest.mock('pino', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe('Logger', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should configure pino with default level "info" and no transport in non-dev environment', () => {
    // Set environment to production (or just not development)
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
    delete process.env.LOG_LEVEL;

    // Get the fresh mock instance
    const pinoMock = require('pino').default;

    // Import logger - this triggers the pino call
    require('./logger');

    expect(pinoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        transport: undefined,
      }),
    );
  });

  it('should configure pino with pino-pretty transport in development environment', () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
    delete process.env.LOG_LEVEL;

    const pinoMock = require('pino').default;

    require('./logger');

    expect(pinoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
          },
        },
      }),
    );
  });

  it('should use provided LOG_LEVEL', () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
    process.env.LOG_LEVEL = 'debug';

    const pinoMock = require('pino').default;

    require('./logger');

    expect(pinoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug',
      }),
    );
  });
});
