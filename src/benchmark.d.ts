export class AskletBenchmark {
  constructor();
  metrics: {
    version: string;
    start: number;
    askDuration?: number;
    jsHeapUsed?: number;
    jsHeapTotal?: number;
    scriptTransferSize?: number;
    scriptDuration?: number;
    total?: number;
  };
  run(): Promise<any>;
  measureAskResponse(): Promise<void>;
  measureMemoryUsage(): Promise<void>;
  measureScriptMetrics(): void;
  calculateTotalTime(): void;
  logResults(): void;
  getFormattedMetrics(): any;
} 