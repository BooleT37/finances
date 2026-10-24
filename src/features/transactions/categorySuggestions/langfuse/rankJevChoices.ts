import type { JevChoiceQuestion } from '~/server/typesafe';

/** Jev's probabilities from most to least likely, each with its criterion. */
export const rankJevChoices = <T extends string>(
  question: JevChoiceQuestion<T>,
  probabilities: Record<T, number>,
) =>
  (Object.entries(probabilities) as [T, number][])
    .sort(([, a], [, b]) => b - a)
    .map(([choice, probability]) => ({
      choice,
      criterion: question.criteria[choice],
      probability,
    }));
