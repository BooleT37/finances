import { atom } from 'jotai';

/** Current search string on the transactions page. */
export const transactionSearchAtom = atom('');

/** Whether the transactions table groups rows by subcategory in addition to category. */
export const groupBySubcategoriesAtom = atom(false);
