import { useState } from "react";
import cat from "./assets/cat.jpg";
import styles from "./App.module.scss";
import * as Engine from "./Engine.js";

function App() {
  const [engineState, setEngineState] = useState<Engine.State>(Engine.create());

  return (
    <div className="App">
      <div
        style={{
          width: 600,
          height: 400,
          border: "1px solid #000",
        }}
      >
        <img
          src={cat}
          width={100}
          style={{
            transform: `translateX(${Engine.getVariable(
              engineState,
              "x"
            )}px) translateY(${Engine.getVariable(engineState, "y")}px)`,
          }}
        />
      </div>
      <table border={1}>
        <tbody>
          {Engine.listVariables(engineState).map(([name, value]) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
