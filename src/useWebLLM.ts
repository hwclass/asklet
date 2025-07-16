import { useEffect, useState } from 'react';
import { ChatModule } from '@mlc-ai/web-llm';

export const useWebLLM = (model: string = 'Llama-3') => {
  const [chat, setChat] = useState<ChatModule | null>(null);

  useEffect(() => {
    const init = async () => {
      const instance = new ChatModule();
      await instance.reload(model);
      setChat(instance);
    };
    init();
  }, [model]);

  return chat;
};