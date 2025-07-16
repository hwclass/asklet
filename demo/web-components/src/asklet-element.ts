import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ChatWebLLM } from "@langchain/community/chat_models/webllm";
import { HumanMessage } from "@langchain/core/messages";
import { AskletBenchmark } from '../../../src/benchmark.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

function extractHtml(answer: string): string {
  let cleaned = answer.replace(/```[Hh][Tt][Mm][Ll]|```/g, '').trim();
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) cleaned = bodyMatch[1];
  const styleMatch = answer.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  let styleTag = '';
  if (styleMatch) styleTag = `<style>${styleMatch[1]}</style>`;
  return styleTag + cleaned;
}

@customElement('asklet-element')
export class AskletElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .question, .answer {
      margin: 1em 0;
    }
    .label {
      font-weight: bold;
      margin-bottom: 0.5em;
    }
    .content {
      margin: 0.5em 0;
    }
    .italic {
      font-style: italic;
    }
    .gray {
      color: #888;
    }
    .benchmark-results {
      width: 100%;
      text-align: left;
      background: #222;
      color: #f8f9fa;
      padding: 1em;
      border-radius: 8px;
      margin-bottom: 1em;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      border: 1px solid #444;
    }
    .benchmark-results h3 {
      color: #bcdcff;
      margin-top: 0;
    }
    .benchmark-table td {
      padding: 0.5em;
    }
    .benchmark-table tr {
      border-bottom: 1px solid #444;
    }
    .benchmark-table tr:last-child {
      background: #333;
    }
    .benchmark-label {
      font-weight: bold;
      color: #bcdcff;
    }
    .benchmark-total {
      font-weight: bold;
    }
    .benchmark-btn {
      margin-bottom: 1em;
      padding: 0.5em 1em;
      background: #007bff;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .benchmark-btn[disabled] {
      background: #888;
      cursor: not-allowed;
    }
  `;

  @property({ type: String })
  model = "Hermes-2-Theta-Llama-3-8B-q4f16_1-MLC";

  @property({ type: String })
  injectFunctionName = "ask";

  @state()
  private ready = false;

  @state()
  private question: string | null = null;

  @state()
  private answer: string | null = null;

  @state()
  private benchmarkResults: any = null;

  @state()
  private isRunningBenchmark: boolean = false;

  async connectedCallback() {
    super.connectedCallback();
    await this.initializeModel();
  }

  private async initializeModel() {
    try {
      const chatModel = new ChatWebLLM({
        model: this.model,
        chatOptions: {
          temperature: 0.3,
        },
      });

      await chatModel.initialize(({ progress, text }) =>
        console.log(`[Asklet] Progress: ${Math.round(progress * 100)}% ${text ?? ""}`)
      );

      (window as any)[this.injectFunctionName] = async (prompt: string) => {
        this.question = prompt;
        this.answer = null;
        const res = await chatModel.invoke([
          new HumanMessage({ content: prompt }),
        ]);
        const answerStr = typeof res.content === 'string' ? res.content : JSON.stringify(res.content);
        this.answer = answerStr;
        console.log(`[Asklet] Response: ${answerStr}`);
        return answerStr;
      };

      this.ready = true;
    } catch (e) {
      console.error(`[Asklet] Error loading model:`, e);
    }
  }

  private async runBenchmark() {
    this.isRunningBenchmark = true;
    try {
      const benchmark = new AskletBenchmark();
      const results = await benchmark.run();
      this.benchmarkResults = results;
    } catch (e) {
      this.benchmarkResults = { error: e instanceof Error ? e.message : String(e) };
    } finally {
      this.isRunningBenchmark = false;
    }
  }

  private formatTime(ms: number | undefined): string {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    if (ms < 60000) return `${ms.toFixed(2)}ms (~${(ms/1000).toFixed(1)}s)`;
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${ms.toFixed(2)}ms (~${minutes}m ${seconds}s)`;
  }

  private renderBenchmarkResults() {
    if (!this.benchmarkResults) return null;
    if (this.benchmarkResults.error) {
      return html`<div class="benchmark-results"><span style="color:#ff6b6b;">Error: ${this.benchmarkResults.error}</span></div>`;
    }
    const r = this.benchmarkResults;
    return html`
      <div class="benchmark-results">
        <h3>Benchmark Results:</h3>
        <table class="benchmark-table">
          <tbody>
            <tr><td class="benchmark-label">Version:</td><td>${r.version}</td></tr>
            <tr><td class="benchmark-label">Start Time:</td><td>${this.formatTime(r.start)}</td></tr>
            <tr><td class="benchmark-label">Response Time:</td><td>${this.formatTime(r.askDuration)}</td></tr>
            <tr><td class="benchmark-label">Memory Used:</td><td>${r.jsHeapUsed ? `${r.jsHeapUsed.toFixed(2)} MB` : 'N/A'}</td></tr>
            <tr><td class="benchmark-label">Memory Total:</td><td>${r.jsHeapTotal ? `${r.jsHeapTotal.toFixed(2)} MB` : 'N/A'}</td></tr>
            <tr><td class="benchmark-label">Script Size:</td><td>${r.scriptTransferSize ? `${r.scriptTransferSize.toFixed(1)} KB` : 'N/A'}</td></tr>
            <tr><td class="benchmark-label">Script Load Time:</td><td>${this.formatTime(r.scriptDuration)}</td></tr>
            <tr><td class="benchmark-label benchmark-total">Total Time:</td><td class="benchmark-total">${this.formatTime(r.total)}</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  private renderAnswer() {
    if (this.answer === null) {
      return this.question
        ? html`<span class="gray">Loading...</span>`
        : html`<span class="gray">No answer yet.</span>`;
    }
    // Always render as HTML using extractHtml and unsafeHTML
    const htmlContent = extractHtml(this.answer);
    return html`<div class="html-content">${unsafeHTML(htmlContent)}</div>`;
  }

  render() {
    if (!this.ready) {
      return html`<div>Loading Asklet (LangChain + WebLLM)...</div>`;
    }

    return html`
      <button 
        class="benchmark-btn"
        @click=${this.runBenchmark}
        ?disabled=${this.isRunningBenchmark}
      >
        ${this.isRunningBenchmark ? 'Running Benchmark...' : 'Run Benchmark'}
      </button>
      ${this.renderBenchmarkResults()}
      <div class="question">
        <div class="label">Last Question:</div>
        <div class="content italic">
          ${this.question || html`<span class="gray">No question asked yet.</span>`}
        </div>
      </div>
      <div class="answer">
        <div class="label">Last Answer:</div>
        <div class="content">
          ${this.renderAnswer()}
        </div>
      </div>
    `;
  }
} 