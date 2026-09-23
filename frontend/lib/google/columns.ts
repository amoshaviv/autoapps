// 0 → A, 25 → Z, 26 → AA
export function columnLetter(index0: number): string {
  let n = index0 + 1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}
