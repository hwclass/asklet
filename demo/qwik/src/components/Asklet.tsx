import { component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { ChatWebLLM } from '@langchain/community/chat_models/webllm';
import { HumanMessage } from '@langchain/core/messages';

function formatTime(ms?: number): string {
  if (!ms) return 'N/A';
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  if (ms < 60000) return `${ms.toFixed(2)}ms (~${(ms / 1000).toFixed(1)}s)`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1);
  return `${ms.toFixed(2)}ms (~${minutes}m ${seconds}s)`;
}

export const Asklet = component$(() => {
  const state = useStore({
    ready: false,
    question: '',
    answer: '',
    error: '',
    benchmark: null as any,
  });

  const injectFunctionName: string = "ask";

  useVisibleTask$(async () => {
    try {
      const chatModel = new ChatWebLLM({
        model: 'Hermes-2-Theta-Llama-3-8B-q4f16_1-MLC',
        chatOptions: { temperature: 0.3 },
      });

      await chatModel.initialize(({ progress, text }) => {
        console.log(`[Qwik Asklet] Init: ${Math.round(progress * 100)}% ${text}`);
      });

      (window as any)[injectFunctionName] = async (prompt: string) => {
        try {
          state.error = '';
          state.question = prompt;

          const start = performance.now();
          const jsHeapUsed = (performance as any).memory?.usedJSHeapSize / (1024 * 1024) || null;

          let firstTokenTime: number | null = null;
          let lastTokenTime: number | null = null;
          let tokenCount = 0;
          let output = '';

          // Try streaming if available
          const res = await chatModel.invoke(
            [new HumanMessage({ content: prompt })],
            {
              callbacks: [
                {
                  handleLLMNewToken(token: string) {
                    tokenCount++;
                    output += token;
                    const now = performance.now();
                    if (tokenCount === 1) {
                      firstTokenTime = now;
                    }
                    lastTokenTime = now;
                  }
                }
              ]
            }
          );

          // Fallback if streaming not supported
          if (tokenCount === 0) {
            output = typeof res.content === 'string' ? res.content : JSON.stringify(res.content);
            tokenCount = output.split(/\s+/).length;
            firstTokenTime = lastTokenTime = performance.now();
          }

          const end = performance.now();

          state.answer = output || (typeof res.content === 'string' ? res.content : JSON.stringify(res.content));

          // Metrics
          const TTFT = firstTokenTime ? firstTokenTime - start : null;
          const totalGenTime = lastTokenTime ? lastTokenTime - start : end - start;
          const TPOT = tokenCount > 1 && firstTokenTime && lastTokenTime
            ? (lastTokenTime - firstTokenTime) / (tokenCount - 1)
            : null;
          const throughput = tokenCount && totalGenTime
            ? (tokenCount / (totalGenTime / 1000))
            : null;

          state.benchmark = {
            version: 'qwik',
            start,
            TTFT,
            TPOT,
            totalGenTime,
            throughput,
            tokenCount,
            jsHeapUsed,
            scriptTransferSize: performance
              .getEntriesByType('resource')
              .find((e) => e.name.includes('webllm') || e.name.includes('llm'))?.transferSize
              ? Number(
                  (
                    performance
                      .getEntriesByType('resource')
                      .find((e) => e.name.includes('webllm') || e.name.includes('llm'))!
                      .transferSize / 1024
                  ).toFixed(1)
                )
              : null,
          };

          return state.answer;
        } catch (err) {
          console.error(err);
          state.error = err instanceof Error ? err.message : 'Unknown error';
        }
      };

      state.ready = true;
    } catch (err) {
      state.error = err instanceof Error ? err.message : 'Model init failed';
    }
  });

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      {state.ready ? (
        <>
          <button
            style={{
              backgroundColor: '#007bff',
              color: '#fff',
              padding: '0.6em 1.2em',
              fontSize: '1em',
              fontWeight: 500,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '2rem',
            }}
            onClick$={async () => {
              if ((window as any)[injectFunctionName]) {
                await (window as any)[injectFunctionName]('Summarize this page');
              }
            }}
          >
            Run Benchmark
          </button>

          {state.benchmark && (
            <div
              style={{
                marginBottom: '2rem',
                background: '#222',
                color: '#fff',
                padding: '1em',
                borderRadius: '6px',
                fontSize: '0.95em',
                textAlign: 'left',
              }}
            >
              <h3 style={{ marginTop: 0, color: '#bcdcff' }}>Benchmark Results</h3>
              <ul style={{ paddingLeft: '1.2em', margin: 0 }}>
                <li><strong>Version:</strong> {state.benchmark.version || 'N/A'}</li>
                <li><strong>Tokens Generated:</strong> {state.benchmark.tokenCount}</li>
                <li><strong>TTFT:</strong> {formatTime(state.benchmark.TTFT)}</li>
                <li><strong>TPOT:</strong> {formatTime(state.benchmark.TPOT)}</li>
                <li><strong>Total Generation Time:</strong> {formatTime(state.benchmark.totalGenTime)}</li>
                <li><strong>Throughput:</strong> {state.benchmark.throughput ? state.benchmark.throughput.toFixed(2) + ' tokens/s' : 'N/A'}</li>
                <li><strong>Heap Used:</strong> {state.benchmark.jsHeapUsed ? `${state.benchmark.jsHeapUsed.toFixed(2)} MB` : 'N/A'}</li>
                <li><strong>Script Size:</strong> {state.benchmark.scriptTransferSize ? `${state.benchmark.scriptTransferSize.toFixed(1)} KB` : 'N/A'}</li>
              </ul>
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: '#1a1a1a', marginTop: '1rem' }}>
              Last Question:
            </div>
            <div style={{ fontStyle: 'italic', color: '#777' }}>
              {state.question || 'No question yet.'}
            </div>

            <div style={{ fontWeight: 600, color: '#1a1a1a', marginTop: '1rem' }}>
              Last Answer:
            </div>
            <div style={{ marginTop: '0.5em', color: '#444', marginBottom: '2rem' }}>
              {state.error ? (
                <span style={{ color: '#dc2626' }}>{state.error}</span>
              ) : (
                <div dangerouslySetInnerHTML={state.answer || 'No answer yet.'}></div>
              )}
            </div>
          </div>
        </>
      ) : (
        <p>Loading WebLLM model...</p>
      )}
    </div>
  );
});