import { startActiveObservation } from '@langfuse/tracing';

import {
  JEV_MODEL,
  type JevChoiceAnswer,
  type JevChoiceQuestion,
} from '~/server/typesafe';

import { rankJevChoices } from './rankJevChoices';

export const traceCategoryChoice = <T extends string>(
  state: unknown,
  question: JevChoiceQuestion<T>,
  ask: () => Promise<
    JevChoiceAnswer<T> & { inputTokens: number; outputTokens: number }
  >,
) =>
  startActiveObservation(
    'choose-category',
    async (generation) => {
      generation.update({ input: { state, question }, model: JEV_MODEL });
      const answer = await ask();
      generation.update({
        output: {
          choice: answer.choice,
          confidence: answer.confidence,
          probabilities: rankJevChoices(question, answer.probabilities),
        },
        usageDetails: {
          input: answer.inputTokens,
          output: answer.outputTokens,
        },
      });
      return answer;
    },
    { asType: 'generation' },
  );
