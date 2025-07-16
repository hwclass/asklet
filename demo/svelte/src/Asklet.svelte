<script lang="ts">
  import { onMount } from "svelte";
  import { ChatWebLLM } from "@langchain/community/chat_models/webllm";
  import { HumanMessage } from "@langchain/core/messages";
  import { AskletBenchmark } from "../../../src/benchmark";

  export let model: string = "Llama-3";
  export let injectFunctionName: string = "ask";

  let ready = false;
  let question: string | null = null;
  let answer: string | null = null;
  let error: string | null = null;
  let benchmarkResults: any = null;
  let benchmarkError: string | null = null;

  function extractHtml(raw: string): string {
    let cleaned = raw.replace(/```[Hh][Tt][Mm][Ll]|```/g, "").trim();
    const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) cleaned = bodyMatch[1];
    const styleMatch = raw.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const styleTag = styleMatch ? `<style>${styleMatch[1]}</style>` : "";
    return styleTag + cleaned;
  }

  function formatTime(ms: number | undefined): string {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    if (ms < 60000) return `${ms.toFixed(2)}ms (~${(ms / 1000).toFixed(1)}s)`;
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${ms.toFixed(2)}ms (~${minutes}m ${seconds}s)`;
  }

  async function runBenchmark() {
    const benchmark = new AskletBenchmark();
    try {
      benchmarkError = null;
      benchmarkResults = await benchmark.run();
      console.log("[Benchmark] Results", benchmarkResults);
    } catch (e) {
      benchmarkError = e instanceof Error ? e.message : "Unknown benchmark error";
      console.error("[Benchmark] Failed", e);
    }
  }

  onMount(async () => {
    try {
      console.log(`[Asklet] Initializing model: ${model}`);
      const chatModel = new ChatWebLLM({
        model,
        chatOptions: { temperature: 0.3 },
      });

      await chatModel.initialize(({ progress, text }) => {
        console.log(`[Asklet] Progress: ${Math.round(progress * 100)}% ${text ?? ""}`);
      });

      (window as any)[injectFunctionName] = async (prompt: string) => {
        try {
          error = null;
          question = prompt;
          answer = null;

          const res = await chatModel.invoke([new HumanMessage({ content: prompt })]);
          const answerStr = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
          answer = answerStr;
          return answerStr;
        } catch (e) {
          error = e instanceof Error ? e.message : "Unknown error";
          console.error(`[Asklet] Error:`, e);
        }
      };

      ready = true;
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
      console.error(`[Asklet] Failed to initialize`, e);
    }
  });
</script>

{#if ready}
  <div class="asklet-container">
    <!-- Benchmark Button -->
    <div class="asklet-top">
      <button on:click={runBenchmark}>Run Benchmark</button>
    </div>

    <!-- Benchmark Results -->
    {#if benchmarkError}
      <div class="error">Benchmark failed: {benchmarkError}</div>
    {/if}

    {#if benchmarkResults}
      <div class="benchmark-results">
        <h3>Benchmark Results:</h3>
        <ul>
          <li><strong>Version:</strong> {benchmarkResults.version || "N/A"}</li>
          <li><strong>Start Time:</strong> {formatTime(benchmarkResults.start)}</li>
          <li><strong>Response Time:</strong> {formatTime(benchmarkResults.askDuration)}</li>
          <li><strong>Total Time:</strong> {formatTime(benchmarkResults.total)}</li>
          <li><strong>Heap Used:</strong> {benchmarkResults.jsHeapUsed?.toFixed(2) ?? "N/A"} MB</li>
          <li><strong>Script Size:</strong> {benchmarkResults.scriptTransferSize?.toFixed(1) ?? "N/A"} KB</li>
        </ul>
      </div>
    {/if}

    <!-- Q&A Section -->
    <div class="asklet-body">
      <div class="asklet-section">
        <div class="label">Last Question:</div>
        <div class="italic">{question || "No question asked yet."}</div>
      </div>

      <div class="asklet-section">
        <div class="label">Last Answer:</div>
        <div class="answer-container">
          {#if error}
            <div class="error">Error: {error}</div>
          {:else if answer}
            {@html extractHtml(answer)}
          {:else}
            <span class="loading">No answer yet.</span>
          {/if}
        </div>
      </div>
    </div>
  </div>
{:else}
  <div>Loading Asklet (LangChain + WebLLM)...</div>
{/if}

<style>
  .asklet-container {
    max-width: 600px;
    margin: 2rem auto;
    font-family: system-ui, sans-serif;
  }

  .asklet-top {
    text-align: center;
    margin-bottom: 2rem;
  }

  .asklet-body {
    text-align: center;
    padding: 0 1rem;
  }

  .asklet-section {
    margin-bottom: 1.5rem;
  }

  .label {
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: #1a1a1a;
  }

  .italic {
    font-style: italic;
    color: #777;
  }

  .answer-container {
    color: #444;
    margin-top: 0.5rem;
  }

  .error {
    color: #dc2626;
  }

  .loading {
    color: gray;
  }

  .benchmark-results {
    background: #222;
    color: #fff;
    padding: 1em;
    margin-bottom: 2rem;
    border-radius: 6px;
    font-size: 0.95em;
    text-align: left;
  }

  .benchmark-results ul {
    padding-left: 1.2em;
    margin: 0;
  }

  .benchmark-results li {
    margin: 0.4em 0;
  }

  .benchmark-results h3 {
    margin-top: 0;
    color: #bcdcff;
  }

  button {
    background-color: #007bff;
    color: #fff;
    padding: 0.6em 1.2em;
    font-size: 1em;
    font-weight: 500;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  button:disabled {
    background: #888;
    cursor: not-allowed;
  }
</style>