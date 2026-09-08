import { useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("The cat sat on the mat.");
  const [result, setResult] = useState(null);

  const analyzeAttention = async () => {
    const response = await fetch("http://127.0.0.1:8000/attention", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
      }),
    });

    const data = await response.json();
    setResult(data);
  };

  return (
    <div className="app">
      <h1>ModelLens</h1>

      <p>
        Explore how transformer models connect tokens through attention.
      </p>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
      />

      <button onClick={analyzeAttention}>
        Analyze Attention
      </button>

      {result && (
        <div>
          <h2>Tokens</h2>
          <p>{result.tokens.join(" | ")}</p>
        </div>
      )}
    </div>
  );
}

export default App;
