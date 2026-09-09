import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import "./App.css";


function getTokenPosition(
  index,
  tokenCount,
  layerIndex
) {
  const radius = 5;

  const startAngle = Math.PI;
  const endAngle = 0;

  const angle =
    startAngle +
    (index / (tokenCount - 1)) *
      (endAngle - startAngle);

  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius - 2;

  const z = layerIndex * -5;

  return [x, y, z];
}


function TokenNode({
  token,
  index,
  tokenCount,
  layerIndex,
  activeLayer,
  selected,
  onClick,
}) {
  const position = getTokenPosition(
    index,
    tokenCount,
    layerIndex
  );

  const isActiveLayer =
    layerIndex === activeLayer;

let color = "#64748b";

if (isActiveLayer) {
  color = "orange";
}

if (selected) {
  color = "cyan";
}
  return (
    <group position={position}>
      <mesh
        onClick={
          isActiveLayer
            ? onClick
            : undefined
        }
      >
        <sphereGeometry args={[0.42, 32, 32]} />

        <meshStandardMaterial
          color={color}
          transparent
          opacity={selected ? 1 : isActiveLayer ? 1 : 0.35}
        />
      </mesh>

      <Text
        position={[0, 0.75, 0]}
        fontSize={0.28}
        color={isActiveLayer ? "white" : "#94a3b8"}
        anchorX="center"
        anchorY="middle"
      >
        {token}
      </Text>
    </group>
  );
}


function LayerLabel({
  layerIndex,
  activeLayer,
}) {
  const isActive =
    layerIndex === activeLayer;

  const z = layerIndex * -5;

  return (
    <Text
      position={[0, 4.2, z]}
      fontSize={0.55}
      color={isActive ? "cyan" : "#64748b"}
      anchorX="center"
      anchorY="middle"
    >
      Layer {layerIndex + 1}
    </Text>
  );
}


function AttentionLines({
  tokens,
  attention,
  selectedToken,
  layerIndex,
}) {
  if (selectedToken === null) {
    return null;
  }

  const start = getTokenPosition(
    selectedToken,
    tokens.length,
    layerIndex
  );

  const values = attention[selectedToken];

  const visibleValues = values.filter(
    (value, index) =>
      index !== selectedToken &&
      value >= 0.02
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

    const normalized =
      value / maxValue;

    const end = getTokenPosition(
      index,
      tokens.length,
      layerIndex
    );

    return (
      <Line
        key={index}
        points={[start, end]}
        color="cyan"
        lineWidth={1 + normalized * 4}
        transparent
        opacity={0.3 + normalized * 0.7}
      />
    );
  });
}


function LayerConnections({
  tokens,
  numLayers,
  selectedToken,
}) {
  const connections = [];

  for (
    let layer = 0;
    layer < numLayers - 1;
    layer++
  ) {
    tokens.forEach((token, index) => {
      const start = getTokenPosition(
        index,
        tokens.length,
        layer
      );

      const end = getTokenPosition(
        index,
        tokens.length,
        layer + 1
      );

      const isSelected =
        index === selectedToken;

      connections.push(
        <Line
          key={`${layer}-${index}`}
          points={[start, end]}
          color={isSelected ? "cyan" : "#334155"}
          lineWidth={isSelected ? 3 : 0.7}
          transparent
          opacity={isSelected ? 0.9 : 0.2}
        />
      );
    });
  }

  return connections;
}

function App() {
  const [text, setText] = useState(
    "The cat sat on the mat."
  );

  const [result, setResult] =
    useState(null);

  const [
    selectedToken,
    setSelectedToken,
  ] = useState(null);

  const [
    selectedLayer,
    setSelectedLayer,
  ] = useState(0);

  const [
    selectedHead,
    setSelectedHead,
  ] = useState(0);


  const analyzeAttention = async () => {
    const response = await fetch(
      "http://127.0.0.1:8000/attention",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
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
      ? result.attentions[
          selectedLayer
        ][selectedHead]
      : null;


  return (
    <div className="app">
      <h1>ModelLens</h1>

      <p>
        Explore how transformer models connect
        tokens through attention.
      </p>

      <textarea
        value={text}
        onChange={(event) =>
          setText(event.target.value)
        }
      />

      <button
        onClick={analyzeAttention}
      >
        Analyze Attention
      </button>

      {result && (
        <>
          <div className="controls">
            <label>
              Layer:
              <select
                value={selectedLayer}
                onChange={(event) => {
                  setSelectedLayer(
                    Number(
                      event.target.value
                    )
                  );

                  setSelectedToken(null);
                }}
              >
                {Array.from(
                  {
                    length:
                      result.num_layers,
                  },
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
                onChange={(event) => {
                  setSelectedHead(
                    Number(
                      event.target.value
                    )
                  );

                  setSelectedToken(null);
                }}
              >
                {Array.from(
                  {
                    length:
                      result.num_heads,
                  },
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

          <h2>
            3D Transformer View
          </h2>

          <p>
            Select a layer, then click a token
            to visualize its attention.
          </p>

          <div className="canvas-container">
            <Canvas
              camera={{
                position: [9, 4, 18],
                fov: 50,
              }}
            >
              <ambientLight
                intensity={1.6}
              />

              <directionalLight
                position={[5, 6, 8]}
              />

              <LayerConnections
                tokens={result.tokens}
                numLayers={
                  result.num_layers
                }
		selectedToken={selectedToken}
              />

              {Array.from(
                {
                  length:
                    result.num_layers,
                },
                (_, layerIndex) => (
                  <LayerLabel
                    key={`label-${layerIndex}`}
                    layerIndex={layerIndex}
                    activeLayer={selectedLayer}
                  />
                )
              )}

              {Array.from(
                {
                  length:
                    result.num_layers,
                },
                (_, layerIndex) =>
                  result.tokens.map(
                    (token, index) => (
                      <TokenNode
                        key={`${layerIndex}-${index}`}
                        token={token}
                        index={index}
                        tokenCount={
                          result.tokens.length
                        }
                        layerIndex={
                          layerIndex
                        }
                        activeLayer={
                          selectedLayer
                        }
                        selected={
                          selectedToken ===
                            index
                        }
                        onClick={() =>
                          setSelectedToken(
                            index
                          )
                        }
                      />
                    )
                  )
              )}

              <AttentionLines
                tokens={
                  result.tokens
                }
                attention={
                  currentAttention
                }
                selectedToken={
                  selectedToken
                }
                layerIndex={
                  selectedLayer
                }
              />

              <OrbitControls />
            </Canvas>
          </div>

          {selectedToken !== null && (
            <div>
              <h2>
                Attention from "
                {
                  result.tokens[
                    selectedToken
                  ]
                }
                "
              </h2>

              <p>
                Layer{" "}
                {selectedLayer + 1},
                Head{" "}
                {selectedHead + 1}
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
                        {value.toFixed(
                          4
                        )}
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
