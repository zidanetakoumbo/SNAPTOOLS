export type AngleMode = 'deg' | 'rad';

const FUNCTIONS = ['asin', 'acos', 'atan', 'sin', 'cos', 'tan', 'sqrt', 'log', 'ln', 'exp', 'abs'];
const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E
};

type Token =
  | { type: 'number'; value: number }
  | { type: 'identifier'; value: string }
  | { type: 'operator'; value: string }
  | { type: 'lparen' }
  | { type: 'rparen' };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const src = input.replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');

  while (i < src.length) {
    const char = src[i];

    if (/[0-9.]/.test(char)) {
      let num = char;
      i++;
      while (i < src.length && /[0-9.]/.test(src[i])) {
        num += src[i];
        i++;
      }
      tokens.push({ type: 'number', value: Number(num) });
      continue;
    }

    if (/[a-zA-Z]/.test(char)) {
      let id = char;
      i++;
      while (i < src.length && /[a-zA-Z]/.test(src[i])) {
        id += src[i];
        i++;
      }
      tokens.push({ type: 'identifier', value: id });
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'lparen' });
      i++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'rparen' });
      i++;
      continue;
    }

    if ('+-*/^!%'.includes(char)) {
      tokens.push({ type: 'operator', value: char });
      i++;
      continue;
    }

    throw new Error(`Caractère invalide : ${char}`);
  }

  return tokens;
}

class Parser {
  private pos = 0;

  constructor(private readonly tokens: Token[], private readonly angleMode: AngleMode) {}

  parse(): number {
    if (this.tokens.length === 0) {
      return 0;
    }
    const value = this.parseExpression();
    if (this.pos < this.tokens.length) {
      throw new Error('Expression invalide');
    }
    return value;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private parseExpression(): number {
    let value = this.parseTerm();

    while (true) {
      const token = this.peek();
      if (token?.type === 'operator' && (token.value === '+' || token.value === '-')) {
        this.pos++;
        const rhs = this.parseTerm();
        value = token.value === '+' ? value + rhs : value - rhs;
      } else {
        break;
      }
    }

    return value;
  }

  private parseTerm(): number {
    let value = this.parseUnary();

    while (true) {
      const token = this.peek();
      if (token?.type === 'operator' && (token.value === '*' || token.value === '/')) {
        this.pos++;
        const rhs = this.parseUnary();
        if (token.value === '/' && rhs === 0) {
          throw new Error('Division par zéro');
        }
        value = token.value === '*' ? value * rhs : value / rhs;
      } else {
        break;
      }
    }

    return value;
  }

  private parseUnary(): number {
    const token = this.peek();
    if (token?.type === 'operator' && token.value === '-') {
      this.pos++;
      return -this.parseUnary();
    }
    if (token?.type === 'operator' && token.value === '+') {
      this.pos++;
      return this.parseUnary();
    }
    return this.parsePower();
  }

  private parsePower(): number {
    const base = this.parsePostfix();
    const token = this.peek();
    if (token?.type === 'operator' && token.value === '^') {
      this.pos++;
      const exponent = this.parseUnary();
      return Math.pow(base, exponent);
    }
    return base;
  }

  private parsePostfix(): number {
    let value = this.parsePrimary();

    while (true) {
      const token = this.peek();
      if (token?.type === 'operator' && token.value === '!') {
        this.pos++;
        value = factorial(value);
      } else if (token?.type === 'operator' && token.value === '%') {
        this.pos++;
        value = value / 100;
      } else {
        break;
      }
    }

    return value;
  }

  private parsePrimary(): number {
    const token = this.peek();

    if (!token) {
      throw new Error('Expression incomplète');
    }

    if (token.type === 'number') {
      this.pos++;
      return token.value;
    }

    if (token.type === 'lparen') {
      this.pos++;
      const value = this.parseExpression();
      const closing = this.peek();
      if (closing?.type !== 'rparen') {
        throw new Error('Parenthèse manquante');
      }
      this.pos++;
      return value;
    }

    if (token.type === 'identifier') {
      const name = token.value.toLowerCase();

      if (name in CONSTANTS) {
        this.pos++;
        return CONSTANTS[name];
      }

      if (FUNCTIONS.includes(name)) {
        this.pos++;
        const arg = this.parsePostfixOrParen();
        return this.applyFunction(name, arg);
      }

      throw new Error(`Identifiant inconnu : ${name}`);
    }

    throw new Error('Expression invalide');
  }

  private parsePostfixOrParen(): number {
    const token = this.peek();
    if (token?.type === 'lparen') {
      return this.parsePrimary();
    }
    return this.parseUnary();
  }

  private applyFunction(name: string, arg: number): number {
    const toRad = (v: number) => (this.angleMode === 'deg' ? (v * Math.PI) / 180 : v);
    const toDeg = (v: number) => (this.angleMode === 'deg' ? (v * 180) / Math.PI : v);

    switch (name) {
      case 'sin':
        return Math.sin(toRad(arg));
      case 'cos':
        return Math.cos(toRad(arg));
      case 'tan':
        return Math.tan(toRad(arg));
      case 'asin':
        return toDeg(Math.asin(arg));
      case 'acos':
        return toDeg(Math.acos(arg));
      case 'atan':
        return toDeg(Math.atan(arg));
      case 'sqrt':
        if (arg < 0) {
          throw new Error('Racine négative');
        }
        return Math.sqrt(arg);
      case 'log':
        if (arg <= 0) {
          throw new Error('Log invalide');
        }
        return Math.log10(arg);
      case 'ln':
        if (arg <= 0) {
          throw new Error('Ln invalide');
        }
        return Math.log(arg);
      case 'exp':
        return Math.exp(arg);
      case 'abs':
        return Math.abs(arg);
      default:
        throw new Error(`Fonction inconnue : ${name}`);
    }
  }
}

function factorial(n: number): number {
  if (n < 0 || Math.floor(n) !== n) {
    throw new Error('Factorielle invalide');
  }
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

export function evaluateExpression(expression: string, angleMode: AngleMode): number {
  const tokens = tokenize(expression);
  const parser = new Parser(tokens, angleMode);
  const value = parser.parse();

  if (!Number.isFinite(value)) {
    throw new Error('Résultat invalide');
  }

  return value;
}
