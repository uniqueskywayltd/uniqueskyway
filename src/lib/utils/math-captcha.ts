export function randomMathDigit(): number {
  return Math.floor(Math.random() * 9) + 1;
}

export function isMathCaptchaCorrect(a: number, b: number, answer: string | number): boolean {
  const n = typeof answer === "string" ? parseInt(answer, 10) : answer;
  return (
    Number.isInteger(a) &&
    Number.isInteger(b) &&
    a >= 1 &&
    a <= 9 &&
    b >= 1 &&
    b <= 9 &&
    !Number.isNaN(n) &&
    n === a + b
  );
}
