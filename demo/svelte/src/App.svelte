<script lang="ts">
  import Asklet from './Asklet.svelte';
</script>

<style>
  main {
    max-width: 600px;
    margin: 2rem auto;
    font-family: system-ui, sans-serif;
    text-align: center;
    color: #1a1a1a;
  }

  code {
    background: #f5f5f5;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.95em;
    color: #444;
  }

  p {
    margin-top: 1.5rem;
    color: #444;
  }
</style>

<main>
  <img src="/headline.png" alt="WebLLM + LangChain = Asklet" style="max-width: 100%; margin-bottom: 1.5rem;" />
  <Asklet model="Hermes-2-Theta-Llama-3-8B-q4f16_1-MLC" injectFunctionName="ask" />
  <p>
    Open DevTools and try: <code>await ask("Summarize this page")</code>
  </p>
</main>