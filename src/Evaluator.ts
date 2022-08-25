import * as Program from "./Program.js";

export interface SpecialVariables {
  x: number;
  y: number;
  angle: number;
}

export interface RunningState {
  currentStat: Program.StatId;
  variables: [string, number][];
  specialVariables: SpecialVariables;
  duration?: number;
}

export function* run(
  program: Program.Program
): Generator<RunningState, void, unknown> {
  const variables: Partial<Record<string, number>> = {
    x: 0,
    y: 0,
    angle: 0,
  };

  for (const statId of program.statLists[Program.entryStatListId] ?? []) {
    yield* runStat(program, { statId, variables });
  }
}

function* runStat(
  program: Program.Program,
  {
    statId,
    variables,
  }: {
    statId: Program.StatId;
    variables: Partial<Record<string, number>>;
  }
): Generator<RunningState, void, unknown> {
  yield {
    currentStat: statId,
    variables: listVariables(variables),
    specialVariables: specialVariables(variables),
  };
  const stat = program.stats[statId];
  if (stat === undefined) {
    return;
  }
  switch (stat.type) {
    case "assign": {
      variables[stat.name] = evalExpr(program, {
        variables,
        exprId: stat.value,
      });
      break;
    }
    case "while": {
      while (evalExpr(program, { variables, exprId: stat.cond }) !== 0) {
        yield* runStatList(program, {
          currentStatId: statId,
          statListId: stat.body,
          variables,
        });
      }
      break;
    }
    case "if": {
      if (evalExpr(program, { variables, exprId: stat.cond }) !== 0) {
        yield* runStatList(program, {
          currentStatId: statId,
          statListId: stat.body1,
          variables,
        });
      } else {
        yield* runStatList(program, {
          currentStatId: statId,
          statListId: stat.body2,
          variables,
        });
      }
      break;
    }
    case "sleep": {
      const duration = evalExpr(program, { variables, exprId: stat.value });
      yield {
        currentStat: statId,
        variables: listVariables(variables),
        specialVariables: specialVariables(variables),
        duration,
      };
      break;
    }
    default: {
      const _: never = stat;
    }
  }
}

function* runStatList(
  program: Program.Program,
  {
    currentStatId,
    statListId,
    variables,
  }: {
    currentStatId: Program.StatId;
    statListId: Program.StatListId;
    variables: Partial<Record<string, number>>;
  }
): Generator<RunningState, void, unknown> {
  const statList = program.statLists[statListId] ?? [];
  for (const statId of statList) {
    yield* runStat(program, { statId, variables });
  }
  if (statList.length === 0) {
    yield {
      currentStat: currentStatId,
      variables: listVariables(variables),
      specialVariables: specialVariables(variables),
    };
  }
}

export function evalExpr(
  program: Program.Program,
  {
    exprId,
    variables,
  }: {
    exprId: Program.ExprId;
    variables: Partial<Record<string, number>>;
  }
): number {
  const expr = program.exprs[exprId];
  if (expr === undefined) {
    return 0;
  }
  switch (expr.type) {
    case "const": {
      return expr.value;
    }
    case "var": {
      return variables[expr.name] ?? NaN;
    }
    case "add": {
      return (
        evalExpr(program, { exprId: expr.lhs, variables }) +
        evalExpr(program, { exprId: expr.rhs, variables })
      );
    }
    case "sub": {
      return (
        evalExpr(program, { exprId: expr.lhs, variables }) -
        evalExpr(program, { exprId: expr.rhs, variables })
      );
    }
    case "mul": {
      return (
        evalExpr(program, { exprId: expr.lhs, variables }) *
        evalExpr(program, { exprId: expr.rhs, variables })
      );
    }
    case "div": {
      return (
        evalExpr(program, { exprId: expr.lhs, variables }) /
        evalExpr(program, { exprId: expr.rhs, variables })
      );
    }
    case "mod": {
      return (
        evalExpr(program, { exprId: expr.lhs, variables }) %
        evalExpr(program, { exprId: expr.rhs, variables })
      );
    }
    case "eq": {
      return evalExpr(program, { exprId: expr.lhs, variables }) ===
        evalExpr(program, { exprId: expr.rhs, variables })
        ? 1
        : 0;
    }
    case "neq": {
      return evalExpr(program, { exprId: expr.lhs, variables }) !==
        evalExpr(program, { exprId: expr.rhs, variables })
        ? 1
        : 0;
    }
    case "lt": {
      return evalExpr(program, { exprId: expr.lhs, variables }) <
        evalExpr(program, { exprId: expr.rhs, variables })
        ? 1
        : 0;
    }
    case "lte": {
      return evalExpr(program, { exprId: expr.lhs, variables }) <=
        evalExpr(program, { exprId: expr.rhs, variables })
        ? 1
        : 0;
    }
    case "gt": {
      return evalExpr(program, { exprId: expr.lhs, variables }) >
        evalExpr(program, { exprId: expr.rhs, variables })
        ? 1
        : 0;
    }
    case "gte": {
      return evalExpr(program, { exprId: expr.lhs, variables }) >=
        evalExpr(program, { exprId: expr.rhs, variables })
        ? 1
        : 0;
    }
    case "and": {
      return evalExpr(program, { exprId: expr.lhs, variables }) !== 0 &&
        evalExpr(program, { exprId: expr.rhs, variables }) !== 0
        ? 1
        : 0;
    }
    case "or": {
      return evalExpr(program, { exprId: expr.lhs, variables }) !== 0 ||
        evalExpr(program, {
          exprId: expr.rhs,
          variables,
        }) !== 0
        ? 1
        : 0;
    }
    case "not": {
      return evalExpr(program, { exprId: expr.expr, variables }) === 0 ? 1 : 0;
    }
    default: {
      const _: never = expr;
      return _;
    }
  }
}

function listVariables(
  variables: Partial<Record<string, number>>
): [string, number][] {
  return Object.entries(variables)
    .filter((kv): kv is [string, number] => kv[1] !== undefined)
    .sort((a, b) => a[0].localeCompare(b[0]));
}

function specialVariables(
  variables: Partial<Record<string, number>>
): SpecialVariables {
  return {
    x: variables["x"] ?? 0,
    y: variables["y"] ?? 0,
    angle: variables["angle"] ?? 0,
  };
}
