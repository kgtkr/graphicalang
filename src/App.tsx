import { useDebugValue, useEffect, useRef, useState } from "react";
import cat from "./assets/cat.jpg";
import styles from "./App.module.scss";
import * as Evaluator from "./Evaluator.js";
import * as Program from "./Program.js";
import { pipe } from "fp-ts/function";
import * as S from "fp-ts/State";

function Stat({
  program,
  runningState,
  statId,
  setProgram,
}: {
  program: Program.Program;
  runningState: Evaluator.RunningState | null;
  statId: Program.StatId;
  setProgram: (updater: (value: Program.Program) => Program.Program) => void;
}): JSX.Element {
  const stat = program.stats[statId];
  return (
    <div
      style={{
        border: `1px solid black`,
        padding: "5px",
        borderRadius: "5px",
        backgroundColor:
          runningState?.currentStat === statId ? "#5555ff" : "#ccccff",
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
                    statListId={stat.body1}
                    setProgram={setProgram}
                    runningState={runningState}
                  />
                  <div>else</div>
                  <StatList
                    program={program}
                    statListId={stat.body2}
                    setProgram={setProgram}
                    runningState={runningState}
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
                    statListId={stat.body}
                    setProgram={setProgram}
                    runningState={runningState}
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
  statListId,
  setProgram,
}: {
  program: Program.Program;
  runningState: Evaluator.RunningState | null;
  statListId: Program.StatListId;
  setProgram: (updater: (value: Program.Program) => Program.Program) => void;
}): JSX.Element {
  const [type, setType] = useState<Program.Stat["type"]>("assign");
  const statIds = program.statLists[statListId] ?? [];

  return (
    <div
      style={{
        border: "1px solid black",
        padding: "5px",
        borderRadius: "5px",
        backgroundColor: "#ccffcc",
      }}
    >
      {statIds.map((statId, i) => (
        <div
          key={statId}
          style={{
            display: "flex",
          }}
        >
          <div>
            <button
              onClick={() => {
                setProgram((program) => ({
                  ...program,
                  statLists: {
                    ...program.statLists,
                    [statListId]: statIds.filter((_, j) => j !== i),
                  },
                }));
              }}
            >
              x
            </button>
          </div>
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
          setType(e.target.value as Program.Stat["type"]);
        }}
      >
        {(() => {
          const options: Record<Program.Stat["type"], string> = {
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
          setProgram((program) =>
            pipe(
              S.bindTo("stat")(Program.statFromType(type)),
              S.bind("statId", ({ stat }) => Program.registerStat(stat)),
              S.bind("_", ({ statId }) =>
                Program.appendStatList(statListId, statId)
              ),
              S.execute(program)
            )
          );
        }}
      >
        +
      </button>
    </div>
  );
}

function Expr({
  program,
  exprId,
  setProgram,
}: {
  program: Program.Program;
  exprId: Program.ExprId;
  setProgram: (updater: (value: Program.Program) => Program.Program) => void;
}): JSX.Element {
  const expr = program.exprs[exprId];
  const [type, setType] = useState<Program.Expr["type"]>("const");

  return (
    <div
      style={{
        padding: "5px",
        border: "1px solid black",
        borderRadius: "5px",
        display: "inline-block",
        backgroundColor: "#ffcccc",
      }}
    >
      {expr === undefined ? (
        <>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as Program.Expr["type"]);
            }}
          >
            {(() => {
              const options: Record<Program.Expr["type"], string> = {
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
    </div>
  );
}

const key = "kgtkr.net-graphicalang-program-1661363024522";

function App() {
  const [program, setProgram] = useState<Program.Program>(() => {
    const json = localStorage.getItem(key);
    if (json) {
      return JSON.parse(json);
    }
    return Program.emptyProgram();
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(program));
  }, [program]);
  const [runningState, setRunningState] =
    useState<Evaluator.RunningState | null>(null);
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
            for (const res of Evaluator.run(program)) {
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
        statListId={Program.entryStatListId}
      ></StatList>
    </div>
  );
}

export default App;
