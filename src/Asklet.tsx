// src/Asklet.tsx
import React, { useEffect, useState } from 'react';
import { ChatWebLLM } from "@langchain/community/chat_models/webllm";
import { HumanMessage } from "@langchain/core/messages";

type AskletProps = {
  model?: string;
  injectFunctionName?: string;
};

// Utility to extract and clean HTML from model output
function extractHtml(answer: string): string {
  // Remove triple backticks and ```html or ```HTML
  let cleaned = answer.replace(/```[Hh][Tt][Mm][Ll]|```/g, '').trim();

  // If there's a <body> tag, extract its content
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) cleaned = bodyMatch[1];

  // If there's a <style> tag, extract it
  const styleMatch = answer.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  let styleTag = '';
  if (styleMatch) styleTag = `<style>${styleMatch[1]}</style>`;

  // Return style + cleaned HTML
  return styleTag + cleaned;
}

export const Asklet = ({
  model = "Llama-3", // safe default
  injectFunctionName = "ask",
}: AskletProps) => {
  const [ready, setReady] = useState(false);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        console.log(`[Asklet] Initializing model: ${model}`);
        
        const chatModel = new ChatWebLLM({
          model,
          chatOptions: {
            temperature: 0.3,
          },
        });

        console.log(`[Asklet] Model created, initializing...`);
        await chatModel.initialize(({ progress, text }) =>
          console.log(`[Asklet] Progress: ${Math.round(progress * 100)}% ${text ?? ""}`)
        );

        console.log(`[Asklet] Model initialized successfully`);

        (window as any)[injectFunctionName] = async (prompt: string) => {
          try {
            console.log(`[Asklet] Processing prompt: ${prompt.substring(0, 100)}...`);
            setError(null);
            setQuestion(prompt);
            setAnswer(null); // Clear previous answer while loading
            
            const message = new HumanMessage({ content: prompt });
            console.log(`[Asklet] Created message, invoking model...`);
            
            const res = await chatModel.invoke([message]);
            console.log(`[Asklet] Model response received`);
            
            const answerStr = typeof res.content === 'string' ? res.content : JSON.stringify(res.content);
            setAnswer(answerStr);
            console.log(`[Asklet] Response: ${answerStr}`);
            return answerStr;
          } catch (e) {
            console.error(`[Asklet] Error during inference:`, e);
            console.error(`[Asklet] Error stack:`, e instanceof Error ? e.stack : 'No stack trace');
            setError(e instanceof Error ? e.message : 'An unknown error occurred');
            return null;
          }
        };

        setReady(true);
      } catch (e) {
        console.error(`[Asklet] Error loading model:`, e);
        console.error(`[Asklet] Error stack:`, e instanceof Error ? e.stack : 'No stack trace');
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
      }
    };

    init();
  }, [model, injectFunctionName]);

  const renderAnswer = () => {
    if (error) {
      return (
        <div style={{ 
          color: '#ff4444', 
          padding: '1em', 
          border: '1px solid #ff4444', 
          borderRadius: '4px', 
          margin: '1em 0' 
        }}>
          Error: {error}
        </div>
      );
    }

    if (answer === null) {
      return question ? (
        <span style={{ color: "#888" }}>Loading...</span>
      ) : (
        <span style={{ color: "#888" }}>No answer yet.</span>
      );
    }

    // Always render as HTML using extractHtml
    const htmlContent = extractHtml(answer);
    return (
      <div 
        className="asklet-response-container"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{ 
          isolation: 'isolate', // Create a new stacking context
          position: 'relative', // Establish a positioning context
          width: '100%'
        }} 
      />
    );
  };

  return ready ? (
    <div>
      <div>
        <strong>Last Question:</strong>
        <div style={{ margin: "0.5em 0", fontStyle: "italic" }}>
          {question || <span style={{ color: "#888" }}>No question asked yet.</span>}
        </div>
      </div>
      <div>
        <strong>Last Answer:</strong>
        <div style={{ margin: "0.5em 0" }}>
          {renderAnswer()}
        </div>
      </div>
    </div>
  ) : (
    <div>Loading Asklet (LangChain + WebLLM)...</div>
  );
};