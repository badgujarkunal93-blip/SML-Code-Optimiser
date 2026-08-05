export interface RequestLog {
  requestId: string;
  timestamp: string;
  endpoint: string;
  inputLanguage: string;
  status: "SUCCESS" | "ERROR" | "TIMEOUT";
  durationMs: number;
  errorMessage?: string;
}

class RequestLogger {
  private logs: RequestLog[] = [];

  public logRequest(log: RequestLog): void {
    this.logs.unshift(log);
    if (this.logs.length > 200) {
      this.logs = this.logs.slice(0, 200);
    }
    console.log(`[REQ_${log.status}] ${log.requestId} ${log.endpoint} ${log.inputLanguage} (${log.durationMs}ms)`);
  }

  public getRecentLogs(): RequestLog[] {
    return this.logs;
  }
}

export const loggerService = new RequestLogger();
