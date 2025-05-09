export interface SetterFn<T> {
  (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: false
  ): void;
  (state: T | ((state: T) => T), replace: true): void;
}

export const stateOrSetter = <T, K extends keyof T>(
  set: SetterFn<T>,
  key: K,
  stateOrSetterFn: ((old: T[K]) => T[K]) | T[K]
) => {
  if (typeof stateOrSetterFn === 'function') {
    const setter = stateOrSetterFn as (old: T[K]) => T[K];

    set((state) => ({ ...state, [key]: setter(state[key]) }));

    return;
  }

  const state = stateOrSetterFn as T[K];

  set((prevState) => ({ ...prevState, [key]: state }));
};
