const SYSTEM_ONE_URL = 'https://api.typesafe.ai/v1/systemone';
const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 15_000;

export const JEV_MODEL = 'jev-1.13.0';

export interface JevChoiceQuestion<T extends string> {
  instructions: string;
  criteria: Record<T, string | null>;
}

export interface JevChoiceAnswer<T extends string> {
  choice: T;
  confidence: number;
  probabilities: Record<T, number>;
}

interface SystemOneResponse<T extends string> {
  model: string;
  answers: { answer: JevChoiceAnswer<T> };
  usage: { input_tokens: number; output_tokens: number };
}

export interface TypeSafeClient {
  askChoice<T extends string>(
    state: unknown,
    question: JevChoiceQuestion<T>,
  ): Promise<JevChoiceAnswer<T> & { inputTokens: number }>;
}

const isRetryable = (status: number) => status === 429 || status >= 500;

function createTypeSafeClient(apiKey: string): TypeSafeClient {
  return {
    async askChoice(state, question) {
      for (let attempt = 1; ; attempt++) {
        const response = await fetch(SYSTEM_ONE_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: JEV_MODEL,
            state,
            questions: { answer: { type: 'choice', ...question } },
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (response.ok) {
          const body = (await response.json()) as SystemOneResponse<
            keyof typeof question.criteria & string
          >;
          return {
            ...body.answers.answer,
            inputTokens: body.usage.input_tokens,
          };
        }
        if (!isRetryable(response.status) || attempt === MAX_ATTEMPTS) {
          throw new Error(
            `TypeSafe request failed with ${response.status}: ${await response.text()}`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 500));
      }
    },
  };
}

const typesafe = process.env.TYPESAFE_API_KEY
  ? createTypeSafeClient(process.env.TYPESAFE_API_KEY)
  : null;

export { typesafe };
