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
