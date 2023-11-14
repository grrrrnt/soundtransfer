export const filterFalsy = <T>(arr: (T | undefined)[]): T[] => {
  return arr.filter(item => item !== undefined) as T[];
}
