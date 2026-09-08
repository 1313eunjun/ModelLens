import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import "./App.css";


function getTokenPosition(index, tokenCount) {
  const center = (tokenCount - 1) / 2;
  const x = (index - center) * 1.5;

  return [x, 0, 0];
}


function TokenNode({
  token,
  index,
  tokenCount,
  selected,
  onClick,
}) {
  const position = getTokenPosition(index, tokenCount);

  return (
    <group position={position}>
      <mesh onClick={onClick}>
        <sphereGeometry args={[0.45, 32, 32]} />

        <meshStandardMaterial
          color={selected ? "cyan" : "orange"}
        />
      </mesh>

      <Text
        position={[0, 0.8, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {token}
      </Text>
    </group>
  );
}


function AttentionLines({
  tokens,
  attention,
  selectedToken,
}) {
  if (selectedToken === null) {
    return null;
  }

  const start = getTokenPosition(
    selectedToken,
    tokens.length
  );

  return tokens.map((token, index) => {
    if (index === selectedToken) {
      return null;
    }

    const value = attention[selectedToken][index];

    const end = getTokenPosition(
      index,
      tokens.length
    );

    return (
      <Line
        key={index}
        points={[start, end]}
        color="cyan"
        lineWidth={Math.max(value * 20, 0.5)}
        transparent
        opacity={Math.max(value, 0.15)}
      />
    );
  });
}


function App() {
  const [text, setText] = useState(
    "The cat sat on the mat."
  );

  const [result, setResult] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);


  const analyzeAttention = async () => {
    const response = await fetch(
      "http://127.0.0.1:8000/attention",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          text: text,
        }),
      }
    );

    const data = await response.json();

    setResult(data);
    setSelectedToken(null);
  };


  return (
    <div className="app">
      <h1>ModelLens</h1>

      <p>
        Explore how transformer models connect tokens
        through attention.
      </p>

      <textarea
        value={text}
        onChange={(event) =>
          setText(event.target.value)
        }
      />

      <button onClick={analyzeAttention}>
        Analyze Attention
      </button>

      {result && (
        <>
          <h2>3D Attention View</h2>

          <p>
            Click a token to visualize its attention.
          </p>

          <div className="canvas-container">
            <Canvas
              camera={{
                position: [0, 2, 11],
              }}
            >
              <ambientLight intensity={1.5} />

              <directionalLight
                position={[3, 3, 3]}
              />

              {result.tokens.map(
                (token, index) => (
                  <TokenNode
                    key={index}
                    token={token}
                    index={index}
                    tokenCount={
                      result.tokens.length
                    }
                    selected={
                      selectedToken === index
                    }
                    onClick={() =>
                      setSelectedToken(index)
                    }
                  />
                )
              )}

              <AttentionLines
                tokens={result.tokens}
                attention={result.attention}
                selectedToken={selectedToken}
              />

              <OrbitControls />
            </Canvas>
          </div>

          {selectedToken !== null && (
            <div>
              <h2>
                Attention from "
                {result.tokens[selectedToken]}"
              </h2>

              {result.tokens.map(
                (token, index) => {
                  const value =
                    result.attention[
                      selectedToken
                    ][index];

                  return (
                    <div
                      className="attention-row"
                      key={index}
                    >
                      <span className="token-label">
                        {token}
                      </span>

                      <div className="attention-bar-background">
                        <div
                          className="attention-bar"
                          style={{
                            width: `${
                              value * 100
                            }%`,
                          }}
                        />
                      </div>

                      <span className="attention-value">
                        {value.toFixed(4)}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}


export default App;
