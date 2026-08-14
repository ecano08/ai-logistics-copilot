import { useEffect, useState } from 'react';

function App() {
  const [apiStatus, setApiStatus] = useState('Checking...');

  useEffect(() => {
    fetch('http://localhost:3000/health')
      .then((response) => response.json())
      .then((data) => {
        setApiStatus(
          data.status === 'ok' ? 'Connected' : 'Error'
        );
      })
      .catch(() => {
        setApiStatus('Disconnected');
      });
  }, []);

  return (
    <main>
      <h1>AI Logistics Copilot</h1>

      <p>
        Node API: <strong>{apiStatus}</strong>
      </p>
    </main>
  );
}

export default App;