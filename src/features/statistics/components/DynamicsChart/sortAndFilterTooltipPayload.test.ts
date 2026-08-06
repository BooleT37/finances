import { sortAndFilterTooltipPayload } from './sortAndFilterTooltipPayload';

describe('sortAndFilterTooltipPayload', () => {
  it('sorts items by value descending', () => {
    const result = sortAndFilterTooltipPayload([
      { name: '1', value: 10 },
      { name: '2', value: 30 },
      { name: '3', value: 20 },
    ]);
    expect(result.map((item) => item.name)).toEqual(['2', '3', '1']);
  });

  it('filters out zero-value items', () => {
    const result = sortAndFilterTooltipPayload([
      { name: '1', value: 10 },
      { name: '2', value: 0 },
      { name: '3', value: 20 },
    ]);
    expect(result.map((item) => item.name)).toEqual(['3', '1']);
  });

  it('returns an empty array when every item is zero', () => {
    const result = sortAndFilterTooltipPayload([
      { name: '1', value: 0 },
      { name: '2', value: 0 },
    ]);
    expect(result).toEqual([]);
  });

  it('reads the value from payload[name] when present, over item.value', () => {
    const result = sortAndFilterTooltipPayload([
      { name: '1', value: 999, payload: { '1': 5, '2': 15 } },
      { name: '2', value: 999, payload: { '1': 5, '2': 15 } },
    ]);
    expect(result.map((item) => item.name)).toEqual(['2', '1']);
  });

  it('falls back to item.value when payload[name] is not a number', () => {
    const result = sortAndFilterTooltipPayload([
      { name: '1', value: 10, payload: { month: 'January' } },
      { name: '2', value: 20, payload: { month: 'January' } },
    ]);
    expect(result.map((item) => item.name)).toEqual(['2', '1']);
  });

  it('treats a missing value as zero and filters it out', () => {
    const result = sortAndFilterTooltipPayload([
      { name: '1' },
      { name: '2', value: 5 },
    ]);
    expect(result.map((item) => item.name)).toEqual(['2']);
  });

  it('does not mutate the input array', () => {
    const input = [
      { name: '1', value: 10 },
      { name: '2', value: 20 },
    ];
    const inputCopy = [...input];
    sortAndFilterTooltipPayload(input);
    expect(input).toEqual(inputCopy);
  });
});
