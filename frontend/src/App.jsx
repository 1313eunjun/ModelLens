import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import "./App.css";


function getTokenPosition(index, tokenCount) {
  const radius = 5;

  const startAngle = Math.PI;
  const endAngle = 0;

  const angle =
    startAngle +
    (index / (tokenCount - 1)) *
      (endAngle - startAngle);

  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius - 2;

  return [x, y, 0];
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

  const values = attention[selectedToken];

  const visibleValues = values.filter(
    (value, index) =>
      index !== selectedToken && value >= 0.02
  );

  const maxValue = Math.max(
    ...visibleValues,
    0.02
  );

  return tokens.map((token, index) => {
    if (index === selectedToken) {
      return null;
    }

    const value = values[index];

    if (value < 0.02) {
      return null;
    }

    const normalized = value / maxValue;

    const end = getTokenPosition(
      index,
      tokens.length
    );

    return (
      <Line
        key={index}
        points={[start, end]}
        color="cyan"
        lineWidth={1 + normalized * 8}
        transparent
        opacity={0.3 + normalized * 0.7}
      />
    );
  });
}


function App() {
  const [text, setText] = useState(
    "The cat sat on the mat."
  );

  const [result, setResult] = useState(null);

  const [selectedToken, setSelectedToken] =
    useState(null);

  const [selectedLayer, setSelectedLayer] =
    useState(0);

  const [selectedHead, setSelectedHead] =
    useState(0);


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
    setSelectedLayer(0);
    setSelectedHead(0);
  };


  const currentAttention =
    result
      ? result.attentions[selectedLayer][selectedHead]
      : null;


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
          <div className="controls">
            <label>
              Layer:
              <select
                value={selectedLayer}
                onChange={(event) =>
                  setSelectedLayer(
                    Number(event.target.value)
                  )
                }
              >
                {Array.from(
                  { length: result.num_layers },
                  (_, index) => (
                    <option
                      key={index}
                      value={index}
                    >
                      Layer {index + 1}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Head:
              <select
                value={selectedHead}
                onChange={(event) =>
                  setSelectedHead(
                    Number(event.target.value)
                  )
                }
              >
                {Array.from(
                  { length: result.num_heads },
                  (_, index) => (
                    <option
                      key={index}
                      value={index}
                    >
                      Head {index + 1}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <h2>3D Attention View</h2>

          <p>
            Click a token to visualize its attention.
          </p>

          <div className="canvas-container">
            <Canvas
              camera={{
                position: [0, 1, 12],
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
                attention={currentAttention}
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

              <p>
                Layer {selectedLayer + 1},
                Head {selectedHead + 1}
              </p>

              {result.tokens.map(
                (token, index) => {
                  const value =
                    currentAttention[
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
