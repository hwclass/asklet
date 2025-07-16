import { Asklet } from "../../../src/Asklet";
import { AskletBenchmark } from "../../../src/benchmark";
import './App.css';
import { useState } from 'react';

type BenchmarkResults = {
  version: string;
  start: number;
  askDuration?: number;
  jsHeapUsed?: number;
  jsHeapTotal?: number;
  scriptTransferSize?: number;
  scriptDuration?: number;
  total?: number;
  error?: string;
} | null;

// Helper function to convert ms to human readable format
const formatTime = (ms: number | undefined): string => {
  if (!ms) return 'N/A';
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  if (ms < 60000) return `${ms.toFixed(2)}ms (~${(ms/1000).toFixed(1)}s)`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1);
  return `${ms.toFixed(2)}ms (~${minutes}m ${seconds}s)`;
};

export default function App() {
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResults>(null);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);

  const runBenchmark = async () => {
    setIsRunningBenchmark(true);
    try {
      const benchmark = new AskletBenchmark();
      const results = await benchmark.run();
      setBenchmarkResults(results);
    } catch (error) {
      console.error('Benchmark failed:', error);
      setBenchmarkResults({ 
        version: 'unknown',
        start: performance.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  return (
    <div>
      <div
        style={{
          maxWidth: "600px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <img
          src="/headline.png"
          alt="WebLLM + LangChain = Asklet"
          style={{
            maxWidth: "100%",
            height: "auto",
            marginBottom: "1rem",
          }}
        />
        <p>
          Open DevTools and try: <code>await ask("Summarize this page")</code>
        </p>
        
        <div style={{ marginBottom: "1rem" }}>
          <button 
            onClick={runBenchmark}
            disabled={isRunningBenchmark}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: isRunningBenchmark ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isRunningBenchmark ? "not-allowed" : "pointer",
            }}
          >
            {isRunningBenchmark ? "Running Benchmark..." : "Run Benchmark"}
          </button>
        </div>

        {benchmarkResults && (
          <div style={{ 
            width: "100%", 
            textAlign: "left",
            backgroundColor: "#f8f9fa",
            padding: "1rem",
            borderRadius: "4px",
            marginTop: "1rem"
          }}>
            <h3>Benchmark Results:</h3>
            {benchmarkResults.error ? (
              <p style={{ color: "red" }}>Error: {benchmarkResults.error}</p>
            ) : (
              <div style={{ fontSize: "0.9rem" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "0.5rem", fontWeight: "bold" }}>Version:</td>
                      <td style={{ padding: "0.5rem" }}>{benchmarkResults.version}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "0.5rem", fontWeight: "bold" }}>Start Time:</td>
                      <td style={{ padding: "0.5rem" }}>{formatTime(benchmarkResults.start)}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "0.5rem", fontWeight: "bold" }}>Response Time:</td>
                      <td style={{ padding: "0.5rem" }}>{formatTime(benchmarkResults.askDuration)}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "0.5rem", fontWeight: "bold" }}>Memory Used:</td>
                      <td style={{ padding: "0.5rem" }}>
                        {benchmarkResults.jsHeapUsed ? `${benchmarkResults.jsHeapUsed.toFixed(2)} MB` : 'N/A'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "0.5rem", fontWeight: "bold" }}>Memory Total:</td>
                      <td style={{ padding: "0.5rem" }}>
                        {benchmarkResults.jsHeapTotal ? `${benchmarkResults.jsHeapTotal.toFixed(2)} MB` : 'N/A'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "0.5rem", fontWeight: "bold" }}>Script Size:</td>
                      <td style={{ padding: "0.5rem" }}>
                        {benchmarkResults.scriptTransferSize ? `${benchmarkResults.scriptTransferSize.toFixed(1)} KB` : 'N/A'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "0.5rem", fontWeight: "bold" }}>Script Load Time:</td>
                      <td style={{ padding: "0.5rem" }}>
                        {formatTime(benchmarkResults.scriptDuration)}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: "#e9ecef" }}>
                      <td style={{ padding: "0.5rem", fontWeight: "bold" }}>Total Time:</td>
                      <td style={{ padding: "0.5rem", fontWeight: "bold" }}>
                        {formatTime(benchmarkResults.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <Asklet model="Hermes-2-Theta-Llama-3-8B-q4f16_1-MLC" />
      </div>
    </div>
  );
}