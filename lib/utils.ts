export const filterFalsy = <T>(arr: (T | undefined)[]): T[] => {
  return arr.filter(item => item !== undefined) as T[];
}

export const asyncNoOp = async <T>(_: T): Promise<void> => {};
