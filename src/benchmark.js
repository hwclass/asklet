class AskletBenchmark {
  constructor() {
    this.metrics = {
      version: window.askletVersion || 'unknown',
      start: performance.now(),
    };
  }

  // Helper function to convert ms to human readable format
  formatTime(ms) {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    if (ms < 60000) return `${ms.toFixed(2)}ms (~${(ms/1000).toFixed(1)}s)`;
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${ms.toFixed(2)}ms (~${minutes}m ${seconds}s)`;
  }

  async run() {
    console.log(`[Benchmark] Starting Asklet benchmark for version: ${this.metrics.version}`);
    
    try {
      await this.measureAskResponse();
      await this.measureMemoryUsage();
      await this.measureScriptMetrics();
      this.calculateTotalTime();
      
      this.logResults();
      return this.metrics;
    } catch (error) {
      console.error("[Benchmark] Error during benchmark:", error);
      throw error;
    }
  }

  async measureAskResponse() {
    const t0 = performance.now();
    await window?.ask("Test prompt");
    const t1 = performance.now();
    
    this.metrics.askDuration = t1 - t0;
    console.log(`[Benchmark] ask() response time: ${this.metrics.askDuration.toFixed(2)}ms`);
  }

  async measureMemoryUsage() {
    // Wait a tick to allow LLM to finish background memory allocation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (performance.memory) {
      this.metrics.jsHeapUsed = performance.memory.usedJSHeapSize / 1024 / 1024;
      this.metrics.jsHeapTotal = performance.memory.totalJSHeapSize / 1024 / 1024;
      console.log(`[Benchmark] JS Heap used: ${this.metrics.jsHeapUsed.toFixed(2)} MB`);
    } else {
      console.warn("[Benchmark] performance.memory not available in this browser.");
    }
  }

  measureScriptMetrics() {
    const resources = performance.getEntriesByType("resource");
    const askletScript = resources.find(resource => 
      resource.name.includes("asklet") && resource.initiatorType === "script"
    );

    if (askletScript) {
      this.metrics.scriptTransferSize = askletScript.transferSize / 1024;
      this.metrics.scriptDuration = askletScript.duration;
      console.log(`[Benchmark] Script transfer size: ${this.metrics.scriptTransferSize.toFixed(1)} KB`);
      console.log(`[Benchmark] Script duration: ${this.metrics.scriptDuration.toFixed(2)}ms`);
    } else {
      console.warn("[Benchmark] Asklet script resource not found.");
    }
  }

  calculateTotalTime() {
    this.metrics.total = performance.now() - this.metrics.start;
  }

  logResults() {
    console.log(`[Benchmark] Total benchmark time: ${this.metrics.total.toFixed(2)}ms`);
    
    // Format metrics for better readability
    const formattedMetrics = {
      version: this.metrics.version,
      start: this.formatTime(this.metrics.start),
      askDuration: this.formatTime(this.metrics.askDuration),
      jsHeapUsed: this.metrics.jsHeapUsed ? `${this.metrics.jsHeapUsed.toFixed(2)} MB` : 'N/A',
      jsHeapTotal: this.metrics.jsHeapTotal ? `${this.metrics.jsHeapTotal.toFixed(2)} MB` : 'N/A',
      scriptTransferSize: this.metrics.scriptTransferSize ? `${this.metrics.scriptTransferSize.toFixed(1)} KB` : 'N/A',
      scriptDuration: this.formatTime(this.metrics.scriptDuration),
      total: this.formatTime(this.metrics.total),
    };
    
    console.table(formattedMetrics);
  }

  // Utility method to get formatted metrics
  getFormattedMetrics() {
    return {
      ...this.metrics,
      askDuration: this.formatTime(this.metrics.askDuration),
      total: this.formatTime(this.metrics.total),
      jsHeapUsed: this.metrics.jsHeapUsed ? `${this.metrics.jsHeapUsed.toFixed(2)} MB` : 'N/A',
      scriptTransferSize: this.metrics.scriptTransferSize ? `${this.metrics.scriptTransferSize.toFixed(1)} KB` : 'N/A',
      scriptDuration: this.formatTime(this.metrics.scriptDuration),
    };
  }
}

// Auto-run the benchmark
(async () => {
  const benchmark = new AskletBenchmark();
  try {
    await benchmark.run();
  } catch (error) {
    console.error("[Benchmark] Failed to run benchmark:", error);
  }
})();

// Export for manual usage
export { AskletBenchmark };

// Also support CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AskletBenchmark;
}