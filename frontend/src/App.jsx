import { useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("The cat sat on the mat.");
  const [result, setResult] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);

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
    setSelectedToken(null);
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

          <div>
            {result.tokens.map((token, index) => (
              <button
                key={index}
                onClick={() => setSelectedToken(index)}
              >
                {token}
              </button>
            ))}
          </div>

          {selectedToken !== null && (
            <div>
              <h2>
                Attention from "{result.tokens[selectedToken]}"
              </h2>

              {result.tokens.map((token, index) => {
                const value =
                  result.attention[selectedToken][index];

                return (
                  <div className="attention-row" key={index}>
                    <span className="token-label">
                      {token}
                    </span>

                    <div className="attention-bar-background">
                      <div
                        className="attention-bar"
                        style={{
                          width: `${value * 100}%`,
                        }}
                      />
                    </div>

                    <span className="attention-value">
                      {value.toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
