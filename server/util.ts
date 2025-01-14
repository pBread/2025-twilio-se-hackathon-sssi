export function makeId(prefix = "", code?: string) {
  const CODE_LENGTH = 7;
  const _code = code
    ? code.padStart(CODE_LENGTH, "0")
    : (Math.random() * CODE_LENGTH * 10).toFixed().padStart(CODE_LENGTH, "0");

  if (prefix) return `${prefix}-${_code}`;
  return _code;
}
