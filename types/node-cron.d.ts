declare module 'node-cron' {
  type CronCallback = () => void | Promise<void>;

  interface ScheduleOptions {
    scheduled?: boolean;
    timezone?: string;
    recoverMissedExecutions?: boolean;
  }

  interface ScheduledTask {
    start: () => void;
    stop: () => void;
    destroy: () => void;
    addCallback?: (callback: CronCallback) => void;
  }

  interface Cron {
    schedule: (expression: string, callback: CronCallback, options?: ScheduleOptions) => ScheduledTask;
    validate: (expression: string) => boolean;
  }

  const cron: Cron;
  export = cron;
}
