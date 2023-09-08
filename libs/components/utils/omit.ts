const omit = <T extends Record<string, any>, K extends keyof T>(
  object: T,
  ...props: K[]
): Omit<T, K> => {
  const result = { ...object };
  for (const prop of props) {
    delete result[prop];
  }
  return result;
};

export default omit;
