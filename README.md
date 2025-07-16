## 🌐 Asklet
### In-Browser LLM Benchmarking with WebLLM + LangChain

https://github.com/hwclass/asklet/assets/asklet-intro.mov

Asklet is an open benchmarking sandbox for testing local LLM inference performance across modern frontend frameworks like React, Svelte, and Qwik — using WebLLM and LangChain.js.

🔍 What it does:
- Runs LLMs entirely in the browser — no server or API calls.
- Injects a DevTools-callable ask() function for experiments.
- Captures detailed token-level performance metrics:
  - Time to First Token (TTFT)
  - Time per Output Token (TPOT)
  - Total generation time
  - Token throughput
  - JS heap usage
  - Script transfer size

🧪 Why it matters:
This repo helps answer:

_“How efficient is local inference for real-world prompts across frameworks?”_

Great for evaluating performance trade-offs when embedding LLMs natively into your apps, extensions, or UIs.

📦 Includes:
    • Minimal demo apps for React, Svelte, Qwik
    • Shared benchmarking logic and metric collector
    • Sample prompts and usage guide

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Copyright (c) 2025
MIT License