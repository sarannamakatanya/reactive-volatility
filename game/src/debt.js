// debt.js — the Creditor's ledger (M4, spec §5.4). Pure functions, no DOM.
// D is what is owed. Invariant: totalPaid + D === 300 + totalInterest + totalLoans.

export const TOTAL_DEBT = 300;
export const BASE_PAYMENT = 100;
export const LOAN_AMOUNT = 50;
export const INTEREST_RATE = 0.25;
export const STARTING_COINS = 80;
export const INGREDIENT_COST = 5;

export function createDebt() {
  return {
    D: TOTAL_DEBT, totalPaid: 0, totalInterest: 0, totalLoans: 0,
    carry: 0, inArrears: false, loanOutstanding: false, loanInterestApplied: false,
  };
}

export function checkInvariant(debt) {
  return debt.totalPaid + debt.D === TOTAL_DEBT + debt.totalInterest + debt.totalLoans;
}

/** Borrow 50 coins. One loan at a time; D rises by 50 once, here, never again for this loan. */
export function borrow(debt, ledger) {
  if (debt.loanOutstanding) return false;
  ledger.coins += LOAN_AMOUNT;
  debt.D += LOAN_AMOUNT;
  debt.totalLoans += LOAN_AMOUNT;
  debt.loanOutstanding = true;
  debt.loanInterestApplied = false;
  if (!checkInvariant(debt)) throw new Error('debt invariant broken after borrow');
  return true;
}

/** The payment event, after every fulfilment. */
export function makePayment(debt, ledger, isFinal) {
  let loanInterest = 0;
  let loanDue = 0;
  if (debt.loanOutstanding && !debt.loanInterestApplied) {
    loanInterest = Math.ceil(LOAN_AMOUNT * INTEREST_RATE); // 13
    debt.D += loanInterest;
    debt.totalInterest += loanInterest;
    debt.loanInterestApplied = true;
    loanDue = LOAN_AMOUNT + loanInterest; // 63, collected in the due below
  }
  const due = isFinal ? debt.D : Math.min(BASE_PAYMENT + loanDue + debt.carry, debt.D);
  const paid = Math.min(ledger.coins, due);
  ledger.coins -= paid;
  debt.D -= paid;
  debt.totalPaid += paid;
  const shortfall = due - paid;
  let interest = 0;
  if (shortfall > 0) {
    interest = Math.ceil(shortfall * INTEREST_RATE);
    debt.D += interest;
    debt.totalInterest += interest;
    debt.carry = shortfall + interest;
    debt.inArrears = true;
  } else {
    debt.carry = 0;
    debt.inArrears = false;
  }
  debt.loanOutstanding = false; // the 63 was collected in the due
  if (!checkInvariant(debt)) throw new Error('debt invariant broken after payment');
  return { due, paid, shortfall, interest, loanInterest, carry: debt.carry, inArrears: debt.inArrears };
}
