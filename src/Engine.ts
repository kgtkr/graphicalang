export interface State {
  variables: Partial<Record<string, number>>;
}

export function create(): State {
  return {
    variables: {
      x: 0,
      y: 0,
    },
  };
}

export function getVariable(state: State, name: string): number {
  return state.variables[name] ?? 0;
}

export function setVariable(
  state: State,
  name: string,
  value: number | undefined
): State {
  if (value !== undefined && Number.isFinite(value)) {
    return {
      ...state,
      variables: {
        ...state.variables,
        [name]: value,
      },
    };
  } else {
    return {
      ...state,
      variables: {
        ...state.variables,
        [name]: undefined,
      },
    };
  }
}

export function listVariables(state: State): [string, number][] {
  return Object.entries(state.variables)
    .filter((kv): kv is [string, number] => kv[1] !== undefined)
    .sort((a, b) => a[0].localeCompare(b[0]));
}
