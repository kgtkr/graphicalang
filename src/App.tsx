import { useDebugValue, useEffect, useRef, useState } from "react";
import cat from "./assets/cat.jpg";
import styles from "./App.module.scss";
import * as Engine from "./Engine.js";
function Stat({
  program,
  runningState,
  statId,
  setProgram,
}: {
  program: Engine.Program;
  runningState: Engine.RunningState | null;
  statId: Engine.StatId;
  setProgram: (updater: (value: Engine.Program) => Engine.Program) => void;
}): JSX.Element {
  const stat = program.stats[statId];
  return (
    <div
      style={{
        border:
          runningState?.currentStat === statId
            ? "1px solid red"
            : "1px solid black",
      }}
    >
      {(() => {
        if (stat === undefined) {
          return <></>;
        } else {
          switch (stat.type) {
            case "assign": {
              return (
                <div>
                  Substitute
                  <input
                    type="text"
                    value={stat.name}
                    onChange={(e) =>
                      setProgram((program) => ({
                        ...program,
                        stats: {
                          ...program.stats,
                          [statId]: { ...stat, name: e.target.value },
                        },
                      }))
                    }
                  />{" "}
                  for{" "}
                  <Expr
                    program={program}
                    exprId={stat.value}
                    setProgram={setProgram}
                  ></Expr>
                </div>
              );
            }
            case "if": {
              return (
                <div>
                  <div>If</div>
                  <Expr
                    program={program}
                    exprId={stat.cond}
                    setProgram={setProgram}
                  />
                  <div>then</div>
                  <StatList
                    program={program}
                    statIds={stat.body1}
                    setProgram={setProgram}
                    runningState={runningState}
                    setStatIds={(updater) =>
                      setProgram((program) => ({
                        ...program,
                        stats: {
                          ...program.stats,
                          [statId]: { ...stat, body1: updater(stat.body1) },
                        },
                      }))
                    }
                  />
                  <div>else</div>
                  <StatList
                    program={program}
                    statIds={stat.body2}
                    setProgram={setProgram}
                    runningState={runningState}
                    setStatIds={(updater) =>
                      setProgram((program) => ({
                        ...program,
                        stats: {
                          ...program.stats,
                          [statId]: { ...stat, body2: updater(stat.body2) },
                        },
                      }))
                    }
                  />
                </div>
              );
            }
            case "while": {
              return (
                <div>
                  <div>While</div>
                  <Expr
                    program={program}
                    exprId={stat.cond}
                    setProgram={setProgram}
                  />
                  <StatList
                    program={program}
                    statIds={stat.body}
                    setProgram={setProgram}
                    runningState={runningState}
                    setStatIds={(updater) =>
                      setProgram((program) => ({
                        ...program,
                        stats: {
                          ...program.stats,
                          [statId]: { ...stat, body: updater(stat.body) },
                        },
                      }))
                    }
                  />
                </div>
              );
            }
            case "sleep": {
              return (
                <div>
                  <div>Sleep</div>
                  <Expr
                    program={program}
                    exprId={stat.value}
                    setProgram={setProgram}
                  />
                </div>
              );
            }
            default: {
              const _: never = stat;
            }
          }
        }
      })()}
    </div>
  );
}

function StatList({
  program,
  runningState,
  statIds,
  setProgram,
  setStatIds,
}: {
  program: Engine.Program;
  runningState: Engine.RunningState | null;
  statIds: Engine.StatId[];
  setProgram: (updater: (value: Engine.Program) => Engine.Program) => void;
  setStatIds: (updater: (value: Engine.StatId[]) => Engine.StatId[]) => void;
}): JSX.Element {
  const [type, setType] = useState<Engine.Stat["type"]>("assign");

  return (
    <div
      style={{
        padding: "1em",
        border: "1px solid black",
      }}
    >
      {statIds.map((statId, i) => (
        <div key={statId}>
          <button
            onClick={() => {
              setStatIds((statIds) => statIds.filter((_, j) => j !== i));
            }}
          >
            x
          </button>
          <Stat
            program={program}
            runningState={runningState}
            statId={statId}
            setProgram={setProgram}
          />
        </div>
      ))}
      <select
        value={type}
        onChange={(e) => {
          setType(e.target.value as Engine.Stat["type"]);
        }}
      >
        {(() => {
          const options: Record<Engine.Stat["type"], string> = {
            assign: "Assign",
            if: "If",
            while: "While",
            sleep: "Sleep",
          };
          return Object.entries(options).map(([type, label]) => (
            <option value={type} key={type}>
              {label}
            </option>
          ));
        })()}
      </select>
      <button
        onClick={() => {
          switch (type) {
            case "assign": {
              setStatIds((statIds) => [...statIds, String(program.statCount)]);
              setProgram((program) => ({
                ...program,
                stats: {
                  ...program.stats,
                  [String(program.statCount)]: {
                    type: "assign",
                    name: "x",
                    value: String(program.exprCount),
                  },
                },
                statCount: program.statCount + 1,
                exprCount: program.exprCount + 1,
              }));
              break;
            }
            case "if": {
              setStatIds((statIds) => [...statIds, String(program.statCount)]);
              setProgram((program) => ({
                ...program,
                stats: {
                  ...program.stats,
                  [String(program.statCount)]: {
                    type: "if",
                    cond: String(program.exprCount),
                    body1: [],
                    body2: [],
                  },
                },
                statCount: program.statCount + 1,
                exprCount: program.exprCount + 1,
              }));
              break;
            }
            case "while": {
              setStatIds((statIds) => [...statIds, String(program.statCount)]);
              setProgram((program) => ({
                ...program,
                stats: {
                  ...program.stats,
                  [String(program.statCount)]: {
                    type: "while",
                    cond: String(program.exprCount),
                    body: [],
                  },
                },
                statCount: program.statCount + 1,
                exprCount: program.exprCount + 1,
              }));
              break;
            }
            case "sleep": {
              setStatIds((statIds) => [...statIds, String(program.statCount)]);
              setProgram((program) => ({
                ...program,
                stats: {
                  ...program.stats,
                  [String(program.statCount)]: {
                    type: "sleep",
                    value: String(program.exprCount),
                  },
                },
                statCount: program.statCount + 1,
                exprCount: program.exprCount + 1,
              }));
              break;
            }
            default: {
              const _: never = type;
            }
          }
        }}
      >
        select stat
      </button>
    </div>
  );
}

function Expr({
  program,
  exprId,
  setProgram,
}: {
  program: Engine.Program;
  exprId: Engine.ExprId;
  setProgram: (updater: (value: Engine.Program) => Engine.Program) => void;
}): JSX.Element {
  const expr = program.exprs[exprId];
  const [type, setType] = useState<Engine.Expr["type"]>("const");

  return (
    <span>
      {expr === undefined ? (
        <>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as Engine.Expr["type"]);
            }}
          >
            {(() => {
              const options: Record<Engine.Expr["type"], string> = {
                const: "constant value",
                var: "variable",
                add: "add",
                sub: "subtract",
                mul: "multiply",
                div: "divide",
                mod: "modulo",
                eq: "equal",
                neq: "not equal",
                lt: "less than",
                lte: "less than or equal",
                gt: "greater than",
                gte: "greater than or equal",
                and: "and",
                or: "or",
                not: "not",
              };
              return Object.entries(options).map(([type, label]) => (
                <option value={type} key={type}>
                  {label}
                </option>
              ));
            })()}
          </select>
          <button
            onClick={() => {
              switch (type) {
                case "const": {
                  setProgram((program) => ({
                    ...program,
                    exprs: {
                      ...program.exprs,
                      [exprId]: {
                        type: "const",
                        value: 0,
                      },
                    },
                  }));
                  break;
                }
                case "var": {
                  setProgram((program) => ({
                    ...program,
                    exprs: {
                      ...program.exprs,
                      [exprId]: {
                        type: "var",
                        name: "x",
                      },
                    },
                  }));
                  break;
                }
                case "add": {
                  setProgram((program) => ({
                    ...program,
                    exprs: {
                      ...program.exprs,
                      [exprId]: {
                        type: "add",
                        lhs: String(program.exprCount),
                        rhs: String(program.exprCount + 1),
                      },
                    },
                    exprCount: program.exprCount + 2,
                  }));
                  break;
                }
                case "sub": {
                  setProgram((program) => ({
                    ...program,
                    exprs: {
                      ...program.exprs,
                      [exprId]: {
                        type: "sub",
                        lhs: String(program.exprCount),
                        rhs: String(program.exprCount + 1),
                      },
                    },
                    exprCount: program.exprCount + 2,
                  }));
                  break;
                }
                case "mul": {
                  setProgram((program) => ({
                    ...program,
                    exprs: {
                      ...program.exprs,
                      [exprId]: {
                        type: "mul",
                        lhs: String(program.exprCount),
                        rhs: String(program.exprCount + 1),
                      },
                    },
                    exprCount: program.exprCount + 2,
                  }));
                  break;
                }
                case "div": {
                  setProgram((program) => ({
                    ...program,
                    exprs: {
                      ...program.exprs,
                      [exprId]: {
                        type: "div",
                        lhs: String(program.exprCount),
                        rhs: String(program.exprCount + 1),
                      },
                    },
                    exprCount: program.exprCount + 2,
                  }));
                  break;
                }
                case "mod": {
                  setProgram((program) => ({
                    ...program,
                    exprs: {
                      ...program.exprs,
                      [exprId]: {
                        type: "mod",
                        lhs: String(program.exprCount),
                        rhs: String(program.exprCount + 1),
                      },
                    },
                    exprCount: program.exprCount + 2,
                  }));
                  break;
                }
                case "eq": {
                  setProgram((program) => ({
                    ...program,
                    exprs: {
                      ...program.exprs,
                      [exprId]: {
                        type: "eq",
                        lhs: String(program.exprCount),
                        rhs: String(program.exprCount + 1),
                      },
                    },
                    exprCount: program.exprCount + 2,
                  }));
                  break;
                }
                case "neq": {
                  setProgram((program) => ({
                    ...program,
                    exprs: {
                      ...program.exprs,
                      [exprId]: {
                        type: "neq",
                        lhs: String(program.exprCount),
                        rhs: String(program.exprCount + 1),
                      },
                    },
                    exprCount: program.exprCount + 2,
                  }));
                  break;
                }
                case "lt": {
                  setProgram((program) => ({
                    ...program,
                    exprs: {
                      ...program.exprs,
                      [exprId]: {
                        type: "lt",
                        lhs: String(program.exprCount),
                        rhs: String(program.exprCount + 1),
                      },
                    },
                    exprCount: program.exprCount + 2,
                  }));
                  break;
                }
                case "lte": {
                  setProgram((program) => ({
                    ...program,
                    exprs: {
                      ...program.exprs,
                      [exprId]: {
                        type: "lte",
                        lhs: String(program.exprCount),
                        rhs: String(program.exprCount + 1),
                      },
                    },
                    exprCount: program.exprCount + 2,
                  }));
                  break;
                }
                case "gt": {
                  setProgram((program) => ({
                    ...program,
                    exprs: {
                      ...program.exprs,
                      [exprId]: {
                        type: "gt",
                        lhs: String(program.exprCount),
                        rhs: String(program.exprCount + 1),
                      },
                    },
                    exprCount: program.exprCount + 2,
                  }));
                  break;
                }
                case "gte": {
                  setProgram((program) => ({
                    ...program,
                    exprs: {
                      ...program.exprs,
                      [exprId]: {
                        type: "gte",
                        lhs: String(program.exprCount),
                        rhs: String(program.exprCount + 1),
                      },
                    },
                    exprCount: program.exprCount + 2,
                  }));
                  break;
                }
                case "and": {
                  setProgram((program) => ({
                    ...program,
                    exprs: {
                      ...program.exprs,
                      [exprId]: {
                        type: "and",
                        lhs: String(program.exprCount),
                        rhs: String(program.exprCount + 1),
                      },
                    },
                    exprCount: program.exprCount + 2,
                  }));
                  break;
                }
                case "or": {
                  setProgram((program) => ({
                    ...program,
                    exprs: {
                      ...program.exprs,
                      [exprId]: {
                        type: "or",
                        lhs: String(program.exprCount),
                        rhs: String(program.exprCount + 1),
                      },
                    },
                    exprCount: program.exprCount + 2,
                  }));
                  break;
                }
                case "not": {
                  setProgram((program) => ({
                    ...program,
                    exprs: {
                      ...program.exprs,
                      [exprId]: {
                        type: "not",
                        expr: String(program.exprCount),
                      },
                    },
                    exprCount: program.exprCount + 1,
                  }));
                  break;
                }
                default: {
                  const _: never = type;
                }
              }
            }}
          >
            select expr
          </button>
        </>
      ) : (
        <button
          onClick={() => {
            setProgram((program) => ({
              ...program,
              exprs: { ...program.exprs, [exprId]: undefined },
            }));
          }}
        >
          x
        </button>
      )}
      {(() => {
        if (expr === undefined) {
          return <></>;
        } else {
          switch (expr.type) {
            case "const": {
              return (
                <>
                  <input
                    type="text"
                    value={expr.value}
                    onChange={(e) =>
                      setProgram((program) => ({
                        ...program,
                        exprs: {
                          ...program.exprs,
                          [exprId]: { ...expr, value: Number(e.target.value) },
                        },
                      }))
                    }
                  />
                </>
              );
            }
            case "var": {
              return (
                <>
                  <input
                    type="text"
                    value={expr.name}
                    onChange={(e) =>
                      setProgram((program) => ({
                        ...program,
                        exprs: {
                          ...program.exprs,
                          [exprId]: { ...expr, name: e.target.value },
                        },
                      }))
                    }
                  />
                </>
              );
            }
            case "add": {
              return (
                <>
                  <Expr
                    program={program}
                    exprId={expr.lhs}
                    setProgram={setProgram}
                  />
                  +
                  <Expr
                    program={program}
                    exprId={expr.rhs}
                    setProgram={setProgram}
                  />
                </>
              );
            }
            case "sub": {
              return (
                <>
                  <Expr
                    program={program}
                    exprId={expr.lhs}
                    setProgram={setProgram}
                  />
                  -
                  <Expr
                    program={program}
                    exprId={expr.rhs}
                    setProgram={setProgram}
                  />
                </>
              );
            }
            case "mul": {
              return (
                <>
                  <Expr
                    program={program}
                    exprId={expr.lhs}
                    setProgram={setProgram}
                  />
                  *
                  <Expr
                    program={program}
                    exprId={expr.rhs}
                    setProgram={setProgram}
                  />
                </>
              );
            }
            case "div": {
              return (
                <>
                  <Expr
                    program={program}
                    exprId={expr.lhs}
                    setProgram={setProgram}
                  />
                  /
                  <Expr
                    program={program}
                    exprId={expr.rhs}
                    setProgram={setProgram}
                  />
                </>
              );
            }
            case "mod": {
              return (
                <>
                  <Expr
                    program={program}
                    exprId={expr.lhs}
                    setProgram={setProgram}
                  />
                  %
                  <Expr
                    program={program}
                    exprId={expr.rhs}
                    setProgram={setProgram}
                  />
                </>
              );
            }
            case "eq": {
              return (
                <>
                  <Expr
                    program={program}
                    exprId={expr.lhs}
                    setProgram={setProgram}
                  />
                  ==
                  <Expr
                    program={program}
                    exprId={expr.rhs}
                    setProgram={setProgram}
                  />
                </>
              );
            }
            case "neq": {
              return (
                <>
                  <Expr
                    program={program}
                    exprId={expr.lhs}
                    setProgram={setProgram}
                  />
                  !=
                  <Expr
                    program={program}
                    exprId={expr.rhs}
                    setProgram={setProgram}
                  />
                </>
              );
            }
            case "lt": {
              return (
                <>
                  <Expr
                    program={program}
                    exprId={expr.lhs}
                    setProgram={setProgram}
                  />
                  {"<"}
                  <Expr
                    program={program}
                    exprId={expr.rhs}
                    setProgram={setProgram}
                  />
                </>
              );
            }
            case "lte": {
              return (
                <>
                  <Expr
                    program={program}
                    exprId={expr.lhs}
                    setProgram={setProgram}
                  />
                  {"<="}
                  <Expr
                    program={program}
                    exprId={expr.rhs}
                    setProgram={setProgram}
                  />
                </>
              );
            }
            case "gt": {
              return (
                <>
                  <Expr
                    program={program}
                    exprId={expr.lhs}
                    setProgram={setProgram}
                  />
                  {">"}
                  <Expr
                    program={program}
                    exprId={expr.rhs}
                    setProgram={setProgram}
                  />
                </>
              );
            }
            case "gte": {
              return (
                <>
                  <Expr
                    program={program}
                    exprId={expr.lhs}
                    setProgram={setProgram}
                  />
                  {">="}
                  <Expr
                    program={program}
                    exprId={expr.rhs}
                    setProgram={setProgram}
                  />
                </>
              );
            }
            case "not": {
              return (
                <>
                  not
                  <Expr
                    program={program}
                    exprId={expr.expr}
                    setProgram={setProgram}
                  />
                </>
              );
            }
            case "and": {
              return (
                <>
                  <Expr
                    program={program}
                    exprId={expr.lhs}
                    setProgram={setProgram}
                  />
                  and
                  <Expr
                    program={program}
                    exprId={expr.rhs}
                    setProgram={setProgram}
                  />
                </>
              );
            }
            case "or": {
              return (
                <>
                  <Expr
                    program={program}
                    exprId={expr.lhs}
                    setProgram={setProgram}
                  />
                  or
                  <Expr
                    program={program}
                    exprId={expr.rhs}
                    setProgram={setProgram}
                  />
                </>
              );
            }
          }
        }
      })()}
    </span>
  );
}

const key = "kgtkr.net-graphicalang-program-v1";

function App() {
  const [program, setProgram] = useState<Engine.Program>(() => {
    const json = localStorage.getItem(key);
    if (json) {
      return JSON.parse(json);
    }
    return Engine.emptyProgram();
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(program));
  }, [program]);
  const [runningState, setRunningState] = useState<Engine.RunningState | null>(
    null
  );
  const interruptRef = useRef(false);

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
            transform: `translateX(${
              runningState?.specialVariables.x ?? 0
            }px) translateY(${
              runningState?.specialVariables.y ?? 0
            }px) rotate(${runningState?.specialVariables.angle ?? 0}deg)`,
          }}
        />
      </div>
      <div>
        <button
          onClick={async () => {
            if (interruptRef.current) {
              return;
            }
            for (const res of Engine.run(program)) {
              if (interruptRef.current) {
                break;
              }
              setRunningState(res);
              await new Promise((resolve) =>
                setTimeout(resolve, res.duration ?? 0)
              );
            }
            setRunningState(null);
            interruptRef.current = false;
          }}
          disabled={runningState !== null}
        >
          Run
        </button>
        <button
          onClick={async () => {
            setRunningState(null);
            interruptRef.current = true;
          }}
          disabled={runningState === null}
        >
          Stop
        </button>
      </div>
      <table border={1}>
        <tbody>
          {runningState?.variables.map(([name, value]) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <StatList
        program={program}
        setProgram={setProgram}
        runningState={runningState}
        setStatIds={(updater) =>
          setProgram((program) => ({
            ...program,
            entry: updater(program.entry),
          }))
        }
        statIds={program.entry}
      ></StatList>
    </div>
  );
}

export default App;
