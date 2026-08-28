import Decimal from 'decimal.js';

import type { FormulaErrorCode } from './evaluateFormula';
import { evaluateFormula } from './evaluateFormula';

function value(input: string): Decimal {
  const result = evaluateFormula(input);
  if (!result.ok) {
    throw new Error(
      `Expected "${input}" to evaluate, got ${result.error.code}`,
    );
  }
  return result.value;
}

function expectValue(input: string, expected: string): void {
  expect(value(input).toString()).toBe(expected);
}

function error(input: string): { code: FormulaErrorCode; position: number } {
  const result = evaluateFormula(input);
  if (result.ok) {
    throw new Error(
      `Expected "${input}" to fail, got ${result.value.toString()}`,
    );
  }
  return result.error;
}

function expectError(input: string, code: FormulaErrorCode): void {
  expect(error(input).code).toBe(code);
}

describe('evaluateFormula', () => {
  describe('literals', () => {
    it.each([
      ['0', '0'],
      ['7', '7'],
      ['42', '42'],
      ['1.5', '1.5'],
      ['0.01', '0.01'],
      ['.5', '0.5'],
      ['19.99', '19.99'],
      ['1000000', '1000000'],
      ['123456789.12', '123456789.12'],
    ])('parses %s', (input, expected) => {
      expectValue(input, expected);
    });
  });

  describe('the four operators', () => {
    it.each([
      ['2+3', '5'],
      ['10-4', '6'],
      ['6*7', '42'],
      ['20/4', '5'],
    ])('evaluates %s', (input, expected) => {
      expectValue(input, expected);
    });
  });

  describe('precedence', () => {
    it.each([
      ['2+3*4', '14'],
      ['2*3+4', '10'],
      ['10-2*3', '4'],
      ['2+10/5', '4'],
      ['1+2*3+4', '11'],
      ['(2+3)*4', '20'],
      ['2*(3+4)', '14'],
    ])('evaluates %s', (input, expected) => {
      expectValue(input, expected);
    });
  });

  describe('associativity', () => {
    it.each([
      ['10-3-2', '5'],
      ['100/5/2', '10'],
      ['1-2-3-4', '-8'],
      ['2*3*4', '24'],
    ])('evaluates %s left to right', (input, expected) => {
      expectValue(input, expected);
    });
  });

  describe('parentheses', () => {
    it.each([
      ['(5)', '5'],
      ['((5))', '5'],
      ['(((1+2)))', '3'],
      ['((1+2)*(3+4))', '21'],
      ['2*(3+(4-1))', '12'],
      ['(10-(2+3))/1', '5'],
    ])('evaluates %s', (input, expected) => {
      expectValue(input, expected);
    });
  });

  describe('unary signs', () => {
    it.each([
      ['-5', '-5'],
      ['+5', '5'],
      ['-(2+3)', '-5'],
      ['2*-3', '-6'],
      ['2--3', '5'],
      ['2++3', '5'],
      ['--5', '5'],
      ['-+-5', '5'],
      ['-2*-3', '6'],
      ['10/-2', '-5'],
      ['100-20', '80'],
    ])('evaluates %s', (input, expected) => {
      expectValue(input, expected);
    });
  });

  describe('whitespace', () => {
    it.each([
      [' 2 + 3 ', '5'],
      ['2\t+\t3', '5'],
      ['2\n+\n3', '5'],
      ['  (  2  +  3  )  *  2  ', '10'],
      ['1 2', undefined],
    ])('handles %j', (input, expected) => {
      if (expected === undefined) {
        expectError(input, 'syntax');
      } else {
        expectValue(input, expected);
      }
    });
  });

  describe('decimal separators', () => {
    it('accepts a comma as the decimal separator', () => {
      expectValue('1,5', '1.5');
    });

    it('accepts commas throughout an expression', () => {
      expectValue('1,5+2,5', '4');
    });

    it('rejects an expression mixing both separators', () => {
      expectError('1.5+2,5', 'mixedSeparators');
    });

    it('reports the position of the first comma when separators are mixed', () => {
      expect(error('1.5+2,5').position).toBe(5);
    });
  });

  describe('exactness', () => {
    it('adds tenths without floating point drift', () => {
      expectValue('0.1+0.2', '0.3');
    });

    it('multiplies prices without floating point drift', () => {
      expectValue('19.99*3', '59.97');
    });

    it('sums many cents exactly', () => {
      expectValue('0.01+0.01+0.01+0.01+0.01+0.01+0.01+0.01+0.01+0.01', '0.1');
    });

    it('keeps precision on repeating division', () => {
      expect(value('1/3').toFixed(5)).toBe('0.33333');
    });

    it('round-trips a division by its divisor', () => {
      expectValue('(10/4)*4', '10');
    });
  });

  describe('division by zero', () => {
    it.each(['1/0', '1/(2-2)', '5/0.0', '(1+2)/(3-3)'])(
      'rejects %s',
      (input) => {
        expectError(input, 'divisionByZero');
      },
    );

    it('allows zero as a dividend', () => {
      expectValue('0/5', '0');
    });
  });

  describe('empty input', () => {
    it.each(['', '   ', '\t', '\n'])('rejects %j', (input) => {
      expectError(input, 'empty');
    });
  });

  describe('syntax errors', () => {
    it.each([
      '1+',
      '1-',
      '*2',
      '/2',
      '+',
      '-',
      '()',
      '(',
      ')',
      '(1+2',
      '1+2)',
      '((1)',
      '1**2',
      '1//2',
      '1+*2',
      '2^3',
      '1+a',
      'abc',
      '$5',
      '5%',
      '1.',
      '.',
      '1..2',
      '1,,2',
      '(1+2)(3+4)',
      '2(3)',
    ])('rejects %j', (input) => {
      expectError(input, 'syntax');
    });
  });

  describe('error positions', () => {
    it('points at the offending character', () => {
      expect(error('1+a').position).toBe(2);
    });

    it('points past the end when the expression is truncated', () => {
      expect(error('1+').position).toBe(2);
    });

    it('points at the unclosed group when a paren is missing', () => {
      expect(error('(1+2').position).toBe(4);
    });

    it('points at the trailing token after a complete expression', () => {
      expect(error('1+2)').position).toBe(3);
    });
  });

  describe('realistic budget lines', () => {
    it.each([
      ['12+8', '20'],
      ['1200/12', '100'],
      ['49.99*2', '99.98'],
      ['(15+25)*3', '120'],
      ['100-20', '80'],
      ['2,5*4', '10'],
    ])('evaluates %s', (input, expected) => {
      expectValue(input, expected);
    });
  });
});
