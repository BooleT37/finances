import { createMiddleware } from '@tanstack/react-start';

import { applyInputRules, type InputRules } from './inputRules';
import { setTrackedInput } from './trackedInputs';

type TrackInputArgs<Input> = [InputRules<Input>] extends [never]
  ? []
  : [rules: InputRules<Input>];

const createTrackInputMiddleware = (rules: unknown) =>
  createMiddleware({ type: 'function' }).server(
    ({ next, data, serverFnMeta }) => {
      try {
        setTrackedInput(serverFnMeta.id, applyInputRules(data, rules));
      } catch (error) {
        console.error('trackInput failed:', error);
      }
      return next();
    },
  );

export const trackInput = <Input>(...args: TrackInputArgs<Input>) =>
  createTrackInputMiddleware((args as readonly unknown[])[0]);
