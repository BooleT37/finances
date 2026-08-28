import Decimal from 'decimal.js';

export type FormulaErrorCode =
  | 'empty'
  | 'syntax'
  | 'mixedSeparators'
  | 'divisionByZero';

export interface FormulaError {
  code: FormulaErrorCode;
  position: number;
}

export type FormulaResult =
  | { ok: true; value: Decimal }
  | { ok: false; error: FormulaError };

type Operator = '+' | '-' | '*' | '/';

type Token =
  | { type: 'number'; value: Decimal; position: number }
  | { type: 'operator'; value: Operator; position: number }
  | { type: 'paren'; value: '(' | ')'; position: number };

class FormulaParseError extends Error {
  code: FormulaErrorCode;
  position: number;

  constructor(code: FormulaErrorCode, position: number) {
    super(code);
    this.code = code;
    this.position = position;
  }
}

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

function isOperator(char: string): char is Operator {
  return char === '+' || char === '-' || char === '*' || char === '/';
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < input.length) {
    const char = input[index]!;

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (char === '(' || char === ')') {
      tokens.push({ type: 'paren', value: char, position: index });
      index += 1;
      continue;
    }

    if (isOperator(char)) {
      tokens.push({ type: 'operator', value: char, position: index });
      index += 1;
      continue;
    }

    if (isDigit(char) || char === '.') {
      const start = index;
      while (index < input.length && isDigit(input[index]!)) {
        index += 1;
      }
      if (input[index] === '.') {
        index += 1;
        const fractionStart = index;
        while (index < input.length && isDigit(input[index]!)) {
          index += 1;
        }
        if (index === fractionStart) {
          throw new FormulaParseError('syntax', start);
        }
      }
      tokens.push({
        type: 'number',
        value: new Decimal(input.slice(start, index)),
        position: start,
      });
      continue;
    }

    throw new FormulaParseError('syntax', index);
  }

  return tokens;
}

function parse(tokens: Token[], endPosition: number): Decimal {
  let index = 0;

  const peek = (): Token | undefined => tokens[index];

  function parsePrimary(): Decimal {
    const token = peek();
    if (!token) {
      throw new FormulaParseError('syntax', endPosition);
    }
    if (token.type === 'number') {
      index += 1;
      return token.value;
    }
    if (token.type === 'paren' && token.value === '(') {
      index += 1;
      const value = parseExpression();
      const closing = peek();
      if (closing?.type !== 'paren' || closing.value !== ')') {
        throw new FormulaParseError('syntax', closing?.position ?? endPosition);
      }
      index += 1;
      return value;
    }
    throw new FormulaParseError('syntax', token.position);
  }

  function parseFactor(): Decimal {
    const token = peek();
    if (
      token?.type === 'operator' &&
      (token.value === '-' || token.value === '+')
    ) {
      index += 1;
      const operand = parseFactor();
      return token.value === '-' ? operand.negated() : operand;
    }
    return parsePrimary();
  }

  function parseTerm(): Decimal {
    let value = parseFactor();
    for (;;) {
      const token = peek();
      if (
        token?.type !== 'operator' ||
        (token.value !== '*' && token.value !== '/')
      ) {
        return value;
      }
      index += 1;
      const right = parseFactor();
      if (token.value === '/') {
        if (right.isZero()) {
          throw new FormulaParseError('divisionByZero', token.position);
        }
        value = value.dividedBy(right);
      } else {
        value = value.times(right);
      }
    }
  }

  function parseExpression(): Decimal {
    let value = parseTerm();
    for (;;) {
      const token = peek();
      if (
        token?.type !== 'operator' ||
        (token.value !== '+' && token.value !== '-')
      ) {
        return value;
      }
      index += 1;
      const right = parseTerm();
      value = token.value === '+' ? value.plus(right) : value.minus(right);
    }
  }

  const result = parseExpression();
  const trailing = peek();
  if (trailing) {
    throw new FormulaParseError('syntax', trailing.position);
  }
  return result;
}

/**
 * Evaluates an arithmetic expression over `Decimal`, so results are exact for
 * money. Supports `+ - * / ( )`, unary signs and decimal literals written with
 * either separator — nothing else, by design.
 */
export function evaluateFormula(input: string): FormulaResult {
  if (input.trim() === '') {
    return { ok: false, error: { code: 'empty', position: 0 } };
  }

  if (input.includes('.') && input.includes(',')) {
    return {
      ok: false,
      error: { code: 'mixedSeparators', position: input.indexOf(',') },
    };
  }

  const normalized = input.replace(/,/g, '.');

  try {
    return { ok: true, value: parse(tokenize(normalized), normalized.length) };
  } catch (error) {
    if (error instanceof FormulaParseError) {
      return {
        ok: false,
        error: { code: error.code, position: error.position },
      };
    }
    throw error;
  }
}
