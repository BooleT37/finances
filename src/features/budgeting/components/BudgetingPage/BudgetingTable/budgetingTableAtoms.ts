import { atom } from 'jotai';

/**
 * True while a "fill from subscriptions" sequence is applying several
 * category writes one at a time — drives a loading overlay over the table.
 */
export const isApplyingSubscriptionsAtom = atom(false);
