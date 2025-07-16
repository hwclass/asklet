import { component$ } from '@builder.io/qwik';
import { Asklet } from '../components/Asklet';

export default component$(() => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <main
        style={{
          maxWidth: '600px',
          margin: '2rem auto',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        <img
          src="/headline.png"
          alt="WebLLM + LangChain = Asklet"
          style={{ maxWidth: '100%', marginBottom: '2rem' }}
        />
        <Asklet />
        <p style={{ marginTop: '2rem', color: '#444' }}>
          Open DevTools and try: <code>await ask("Summarize this page")</code>
        </p>
      </main>
    </div >
  );
});