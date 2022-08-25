import * as S from "fp-ts/State";
import { pipe } from "fp-ts/function";

export interface Program {
  stats: Partial<Record<StatId, Stat>>;
  exprs: Partial<Record<string, Expr>>;
  statLists: Partial<Record<string, StatId[]>>;
  statCount: number;
  exprCount: number;
  statListCount: number;
}

export type ExprId = string;
export type StatId = string;
export type StatListId = string;
export const entryStatListId: StatListId = "entry";

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
      body: StatListId;
    }
  | {
      type: "if";
      cond: ExprId;
      body1: StatListId;
      body2: StatListId;
    }
  | {
      type: "sleep";
      value: ExprId;
    };

export function emptyProgram(): Program {
  return {
    stats: {},
    exprs: {},
    statLists: {
      [entryStatListId]: [],
    },
    statCount: 0,
    exprCount: 0,
    statListCount: 0,
  };
}

const genExprId: S.State<Program, ExprId> = (program) => [
  String(program.exprCount),
  {
    ...program,
    exprCount: program.exprCount + 1,
  },
];

const genStatId: S.State<Program, StatId> = (program) => [
  String(program.statCount),
  {
    ...program,
    statCount: program.statCount + 1,
  },
];

const genStatListId: S.State<Program, StatListId> = (program) => [
  String(program.statListCount),
  {
    ...program,
    statListCount: program.statListCount + 1,
  },
];

export function registerStat(stat: Stat): S.State<Program, StatId> {
  return pipe(
    S.bindTo("statId")(genStatId),
    S.bind("_", ({ statId }) => (program) => [
      null,
      { ...program, stats: { ...program.stats, [statId]: stat } },
    ]),
    S.map(({ statId }) => statId)
  );
}

export function registerStatList(
  statList: StatId[]
): S.State<Program, StatListId> {
  return pipe(
    S.bindTo("statListId")(genStatListId),
    S.bind("_", ({ statListId }) => (program) => [
      null,
      {
        ...program,
        statLists: { ...program.statLists, [statListId]: statList },
      },
    ]),
    S.map(({ statListId }) => statListId)
  );
}

export function setExpr(
  exprId: ExprId,
  expr: Expr | undefined
): S.State<Program, null> {
  return (program) => [
    null,
    { ...program, exprs: { ...program.exprs, [exprId]: expr } },
  ];
}

export function statFromType(type: Stat["type"]): S.State<Program, Stat> {
  switch (type) {
    case "assign": {
      return pipe(
        S.bindTo("value")(genExprId),
        S.map(
          ({ value }): Stat => ({
            type: "assign",
            name: "x",
            value,
          })
        )
      );
    }
    case "if": {
      return pipe(
        S.bindTo("cond")(genExprId),
        S.bind("body1", () => registerStatList([])),
        S.bind("body2", () => registerStatList([])),
        S.map(
          ({ cond, body1, body2 }): Stat => ({
            type: "if",
            cond,
            body1,
            body2,
          })
        )
      );
    }
    case "while": {
      return pipe(
        S.bindTo("cond")(genExprId),
        S.bind("body", () => registerStatList([])),
        S.map(
          ({ cond, body }): Stat => ({
            type: "while",
            cond,
            body,
          })
        )
      );
    }
    case "sleep": {
      return pipe(
        S.bindTo("value")(genExprId),
        S.map(
          ({ value }): Stat => ({
            type: "sleep",
            value,
          })
        )
      );
    }
    default: {
      const _: never = type;
      return _;
    }
  }
}

export function appendStatList(
  statListId: StatListId,
  statId: StatId
): S.State<Program, null> {
  return (program) => [
    null,
    {
      ...program,
      statLists: {
        ...program.statLists,
        [statListId]: [...(program.statLists[statListId] ?? []), statId],
      },
    },
  ];
}

export function removeStatListItem(
  statListId: StatListId,
  i: number
): S.State<Program, null> {
  return (program) => [
    null,
    {
      ...program,
      statLists: {
        ...program.statLists,
        [statListId]: program.statLists[statListId]?.filter((_, j) => j !== i),
      },
    },
  ];
}

export function exprFromType(type: Expr["type"]): S.State<Program, Expr> {
  switch (type) {
    case "const": {
      return S.of({
        type: "const",
        value: 0,
      });
    }
    case "var": {
      return S.of({
        type: "var",
        name: "x",
      });
    }
    case "add": {
      return pipe(
        S.bindTo("lhs")(genExprId),
        S.bind("rhs", () => genExprId),
        S.map(
          ({ lhs, rhs }): Expr => ({
            type: "add",
            lhs,
            rhs,
          })
        )
      );
    }
    case "sub": {
      return pipe(
        S.bindTo("lhs")(genExprId),
        S.bind("rhs", () => genExprId),
        S.map(
          ({ lhs, rhs }): Expr => ({
            type: "sub",
            lhs,
            rhs,
          })
        )
      );
    }
    case "mul": {
      return pipe(
        S.bindTo("lhs")(genExprId),
        S.bind("rhs", () => genExprId),
        S.map(
          ({ lhs, rhs }): Expr => ({
            type: "mul",
            lhs,
            rhs,
          })
        )
      );
    }
    case "div": {
      return pipe(
        S.bindTo("lhs")(genExprId),
        S.bind("rhs", () => genExprId),
        S.map(
          ({ lhs, rhs }): Expr => ({
            type: "div",
            lhs,
            rhs,
          })
        )
      );
    }
    case "mod": {
      return pipe(
        S.bindTo("lhs")(genExprId),
        S.bind("rhs", () => genExprId),
        S.map(
          ({ lhs, rhs }): Expr => ({
            type: "mod",
            lhs,
            rhs,
          })
        )
      );
    }
    case "eq": {
      return pipe(
        S.bindTo("lhs")(genExprId),
        S.bind("rhs", () => genExprId),
        S.map(
          ({ lhs, rhs }): Expr => ({
            type: "eq",
            lhs,
            rhs,
          })
        )
      );
    }
    case "neq": {
      return pipe(
        S.bindTo("lhs")(genExprId),
        S.bind("rhs", () => genExprId),
        S.map(
          ({ lhs, rhs }): Expr => ({
            type: "neq",
            lhs,
            rhs,
          })
        )
      );
    }
    case "lt": {
      return pipe(
        S.bindTo("lhs")(genExprId),
        S.bind("rhs", () => genExprId),
        S.map(
          ({ lhs, rhs }): Expr => ({
            type: "lt",
            lhs,
            rhs,
          })
        )
      );
    }
    case "lte": {
      return pipe(
        S.bindTo("lhs")(genExprId),
        S.bind("rhs", () => genExprId),
        S.map(
          ({ lhs, rhs }): Expr => ({
            type: "lte",
            lhs,
            rhs,
          })
        )
      );
    }
    case "gt": {
      return pipe(
        S.bindTo("lhs")(genExprId),
        S.bind("rhs", () => genExprId),
        S.map(
          ({ lhs, rhs }): Expr => ({
            type: "gt",
            lhs,
            rhs,
          })
        )
      );
    }
    case "gte": {
      return pipe(
        S.bindTo("lhs")(genExprId),
        S.bind("rhs", () => genExprId),
        S.map(
          ({ lhs, rhs }): Expr => ({
            type: "gte",
            lhs,
            rhs,
          })
        )
      );
    }
    case "and": {
      return pipe(
        S.bindTo("lhs")(genExprId),
        S.bind("rhs", () => genExprId),
        S.map(
          ({ lhs, rhs }): Expr => ({
            type: "and",
            lhs,
            rhs,
          })
        )
      );
    }
    case "or": {
      return pipe(
        S.bindTo("lhs")(genExprId),
        S.bind("rhs", () => genExprId),
        S.map(
          ({ lhs, rhs }): Expr => ({
            type: "or",
            lhs,
            rhs,
          })
        )
      );
    }
    case "not": {
      return pipe(
        S.bindTo("expr")(genExprId),
        S.map(
          ({ expr }): Expr => ({
            type: "not",
            expr,
          })
        )
      );
    }
    default: {
      const _: never = type;
      return _;
    }
  }
}
