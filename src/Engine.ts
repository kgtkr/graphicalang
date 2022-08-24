export interface Program {
  stats: Partial<Record<StatId, Stat>>;
  exprs: Partial<Record<string, Expr>>;
  entry: StatId[];
  statCount: number;
  exprCount: number;
}

export type ExprId = string;
export type StatId = string;

export type Expr =
  | {
      type: "const";
      value: number;
    }
  | {
      type: "var";
      name: string;
    }
  | {
      type: "add";
      lhs: ExprId;
      rhs: ExprId;
    }
  | {
      type: "sub";
      lhs: ExprId;
      rhs: ExprId;
    }
  | {
      type: "mul";
      lhs: ExprId;
      rhs: ExprId;
    }
  | {
      type: "div";
      lhs: ExprId;
      rhs: ExprId;
    }
  | {
      type: "mod";
      lhs: ExprId;
      rhs: ExprId;
    }
  | {
      type: "eq";
      lhs: ExprId;
      rhs: ExprId;
    }
  | {
      type: "neq";
      lhs: ExprId;
      rhs: ExprId;
    }
  | {
      type: "lt";
      lhs: ExprId;
      rhs: ExprId;
    }
  | {
      type: "lte";
      lhs: ExprId;
      rhs: ExprId;
    }
  | {
      type: "gt";
      lhs: ExprId;
      rhs: ExprId;
    }
  | {
      type: "gte";
      lhs: ExprId;
      rhs: ExprId;
    }
  | {
      type: "and";
      lhs: ExprId;
      rhs: ExprId;
    }
  | {
      type: "or";
      lhs: ExprId;
      rhs: ExprId;
    }
  | {
      type: "not";
      expr: ExprId;
    };

export type Stat =
  | {
      type: "assign";
      name: string;
      value: ExprId;
    }
  | {
      type: "while";
      cond: ExprId;
      body: StatId[];
    }
  | {
      type: "if";
      cond: ExprId;
      body1: StatId[];
      body2: StatId[];
    };

export function emptyProgram(): Program {
  return {
    stats: {},
    exprs: {},
    entry: [],
    statCount: 0,
    exprCount: 0,
  };
}

export interface SpecialVariables {
  x: number;
  y: number;
}

export interface RunningState {
  currentStat: StatId;
  variables: [string, number][];
  specialVariables: SpecialVariables;
}

export function* run(program: Program): Generator<RunningState, void, unknown> {
  const variables: Partial<Record<string, number>> = {
    x: 0,
    y: 0,
  };

  for (const statId of program.entry) {
    yield* runStat(program, { statId, variables });
  }
}

function* runStat(
  program: Program,
  {
    statId,
    variables,
  }: {
    statId: StatId;
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
        for (const statId of stat.body) {
          yield* runStat(program, { statId, variables });
        }
      }
      break;
    }
    case "if": {
      if (evalExpr(program, { variables, exprId: stat.cond }) !== 0) {
        for (const statId of stat.body1) {
          yield* runStat(program, { statId, variables });
        }
      } else {
        for (const statId of stat.body2) {
          yield* runStat(program, { statId, variables });
        }
      }
      break;
    }
  }
}

export function evalExpr(
  program: Program,
  {
    exprId,
    variables,
  }: {
    exprId: ExprId;
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
  };
}
