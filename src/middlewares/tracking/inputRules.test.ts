import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  applyInputRules,
  type InputRules,
  type StringRule,
} from './inputRules';
import type { trackInput } from './trackInput';

describe('applyInputRules', () => {
  it('sends a short string as is with "send"', () => {
    expect(applyInputRules({ name: 'Coffee' }, { name: 'send' })).toEqual({
      name: 'Coffee',
    });
  });

  it('does not cut a string of exactly 200 characters with "send"', () => {
    const value = 'x'.repeat(200);
    expect(applyInputRules({ name: value }, { name: 'send' })).toEqual({
      name: value,
    });
  });

  it('cuts a longer string to 200 characters and marks the cut with "send"', () => {
    expect(
      applyInputRules({ name: 'x'.repeat(250) }, { name: 'send' }),
    ).toEqual({ name: `${'x'.repeat(200)}…` });
  });

  it('sends a long string uncut with "sendFull"', () => {
    const value = 'x'.repeat(250);
    expect(applyInputRules({ id: value }, { id: 'sendFull' })).toEqual({
      id: value,
    });
  });

  it('sends only the length with "length"', () => {
    expect(applyInputRules({ file: 'abcdef' }, { file: 'length' })).toEqual({
      file: { length: 6 },
    });
  });

  it('leaves a string out with "omit"', () => {
    expect(
      applyInputRules(
        { name: 'Coffee', cost: '-3' },
        { name: 'omit', cost: 'send' },
      ),
    ).toEqual({ cost: '-3' });
  });

  it('drops a string that has no rule', () => {
    expect(
      applyInputRules({ cost: '-3', smuggled: 'secret' }, { cost: 'send' }),
    ).toEqual({ cost: '-3' });
  });

  it('sends numbers, booleans and null without rules', () => {
    expect(
      applyInputRules({ id: 5, active: true, parentId: null }, undefined),
    ).toEqual({ id: 5, active: true, parentId: null });
  });

  it('applies nested rules to every item of an array field', () => {
    expect(
      applyInputRules(
        {
          components: [
            { name: 'a', cost: '-1', categoryId: 2 },
            { name: 'b', cost: '-2', categoryId: 3 },
          ],
        },
        { components: { name: 'omit', cost: 'send' } },
      ),
    ).toEqual({
      components: [
        { cost: '-1', categoryId: 2 },
        { cost: '-2', categoryId: 3 },
      ],
    });
  });

  it('applies item rules when the input itself is an array', () => {
    expect(
      applyInputRules(
        [
          { name: 'a', cost: '-1' },
          { name: 'b', cost: '-2' },
        ],
        { name: 'omit', cost: 'send' },
      ),
    ).toEqual([{ cost: '-1' }, { cost: '-2' }]);
  });

  it('leaves out a whole object field with "omit"', () => {
    expect(
      applyInputRules(
        { id: 1, trace: { traceId: 't', value: 'v' } },
        { trace: 'omit' },
      ),
    ).toEqual({ id: 1 });
  });

  it('drops the strings of a nested object that has no rules', () => {
    expect(
      applyInputRules({ trace: { traceId: 't', score: 1 } }, undefined),
    ).toEqual({ trace: { score: 1 } });
  });

  it('applies a rule to an input that is a single string', () => {
    expect(applyInputRules('user-id', 'sendFull')).toBe('user-id');
  });

  it('returns undefined for a single string without a rule', () => {
    expect(applyInputRules('user-id', undefined)).toBeUndefined();
  });

  it('returns a number input as is', () => {
    expect(applyInputRules(42, undefined)).toBe(42);
  });
});

// Checked by `tsc`, not at runtime: each `@ts-expect-error` fails the
// typecheck if the line below it stops being an error.
describe('InputRules', () => {
  type Input = {
    name: string;
    cost: string;
    categoryId: number;
    actualDate?: string | null;
    parser: 'VIVID';
    components?: { name: string; cost: string; categoryId: number }[];
    ids: number[];
  };
  const valid: InputRules<Input> = {
    name: 'omit',
    cost: 'send',
    actualDate: 'send',
    parser: 'send',
    components: { name: 'omit', cost: 'send' },
  };

  it('requires a rule for every string field, nested ones included', () => {
    // @ts-expect-error a top-level string field has no rule
    const missingTopLevel: InputRules<Input> = { ...valid, name: undefined };
    const missingNested: InputRules<Input> = {
      ...valid,
      // @ts-expect-error a nested string field has no rule
      components: { cost: 'send' },
    };
    expect([missingTopLevel, missingNested]).toHaveLength(2);
  });

  it('rejects rules for fields without strings', () => {
    // @ts-expect-error a number field takes no rule
    const numberRule: InputRules<Input> = { ...valid, categoryId: 'send' };
    // @ts-expect-error an array of numbers takes no rule
    const arrayRule: InputRules<Input> = { ...valid, ids: 'send' };
    expect([numberRule, arrayRule]).toHaveLength(2);
  });

  it('rejects an unknown rule name', () => {
    // @ts-expect-error 'full' is not a rule
    const unknownRule: InputRules<Input> = { ...valid, cost: 'full' };
    expect(unknownRule).toBeDefined();
  });

  it('lets trackInput take no rules when the input has no strings', () => {
    expectTypeOf<Parameters<typeof trackInput<number>>>().toEqualTypeOf<[]>();
    expectTypeOf<Parameters<typeof trackInput<string>>>().toEqualTypeOf<
      [rules: StringRule]
    >();
  });
});
