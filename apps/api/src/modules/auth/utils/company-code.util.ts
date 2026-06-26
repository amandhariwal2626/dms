export function generateCompanyCode(counter: number): string {
  const padded = String(counter).padStart(6, '0');
  return `CMP${padded}`;
}

export function parseCompanyCode(code: string): number {
  const num = code.replace('CMP', '');
  return Number.parseInt(num, 10);
}

export function generateEmployeeCode(counter: number): string {
  const padded = String(counter).padStart(6, '0');
  return `EMP${padded}`;
}
