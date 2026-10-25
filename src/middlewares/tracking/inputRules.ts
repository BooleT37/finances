export type StringRule = 'send' | 'sendFull' | 'omit' | 'length';

export type InputRules<T> =
  NonNullable<T> extends readonly (infer Item)[]
    ? InputRules<Item>
    : NonNullable<T> extends string
      ? StringRule
      : NonNullable<T> extends object
        ? [ObjectRules<NonNullable<T>>] extends [never]
          ? never
          : ObjectRules<NonNullable<T>> | 'omit'
        : never;

type ObjectRules<T> = keyof RulesFor<T> extends never ? never : RulesFor<T>;

type RulesFor<T> = {
  [K in keyof T as [InputRules<T[K]>] extends [never]
    ? never
    : K]-?: InputRules<T[K]>;
};

const MAX_SENT_LENGTH = 200;
const OMITTED = Symbol('omitted');

const applyStringRule = (value: string, rule: unknown) => {
  switch (rule) {
    case 'send':
      return value.length > MAX_SENT_LENGTH
        ? `${value.slice(0, MAX_SENT_LENGTH)}…`
        : value;
    case 'sendFull':
      return value;
    case 'length':
      return { length: value.length };
    default:
      return OMITTED;
  }
};

const applyRule = (value: unknown, rule: unknown): unknown => {
  if (rule === 'omit') {
    return OMITTED;
  }
  if (typeof value === 'string') {
    return applyStringRule(value, rule);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => applyRule(item, rule))
      .filter((item) => item !== OMITTED);
  }
  if (value !== null && typeof value === 'object') {
    const rules: Partial<Record<string, unknown>> =
      typeof rule === 'object' && rule !== null ? rule : {};
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, field]) => [key, applyRule(field, rules[key])])
        .filter(([, field]) => field !== OMITTED),
    );
  }
  return value;
};

// The input reaches middleware before validation, so it can carry fields its
// type doesn't declare. A string without a rule is therefore dropped rather
// than sent, whatever the type says.
export const applyInputRules = (input: unknown, rules: unknown): unknown => {
  const result = applyRule(input, rules);
  return result === OMITTED ? undefined : result;
};
