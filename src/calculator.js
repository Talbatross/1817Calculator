export function fullPay(revenue, shares) {
  return revenue / shares
}

export function halfPay(revenue, shares) {
  if (shares === 10) {
    const withheld = Math.floor(revenue / 20) * 10
    return (revenue - withheld) / 10
  }
  return revenue / 2 / shares
}

export function withhold() {
  return 0
}

export function fullPayCompany(revenue, shares, treasury) {
  return fullPay(revenue, shares) * treasury
}

export function halfPayCompany(revenue, shares, treasury) {
  const perShare = halfPay(revenue, shares)
  return (revenue - perShare * shares) + perShare * treasury
}

export function withholdCompany(revenue) {
  return revenue
}

export function interest(rate, loans) {
  return rate * loans
}

export function fullPayCompanySteps(revenue, shares, treasury, cash, interestAmount, loanCount, loanRate) {
  const perShare = fullPay(revenue, shares)
  const steps = [{ label: 'Starting cash', amount: cash }]
  if (treasury > 0) {
    steps.push({ label: `Treasury (${treasury} × $${perShare})`, amount: perShare * treasury })
  }
  if (interestAmount > 0) {
    steps.push({ label: `Interest (${loanCount} × $${loanRate})`, amount: -interestAmount })
  }
  return steps
}

export function halfPayCompanySteps(revenue, shares, treasury, cash, interestAmount, loanCount, loanRate) {
  const perShare = halfPay(revenue, shares)
  const withheld = revenue - perShare * shares
  const steps = [{ label: 'Starting cash', amount: cash }]
  if (withheld > 0) {
    steps.push({ label: 'Withheld revenue', amount: withheld })
  }
  if (treasury > 0) {
    steps.push({ label: `Treasury (${treasury} × $${perShare})`, amount: perShare * treasury })
  }
  if (interestAmount > 0) {
    steps.push({ label: `Interest (${loanCount} × $${loanRate})`, amount: -interestAmount })
  }
  return steps
}

export function withholdCompanySteps(revenue, cash, interestAmount, loanCount, loanRate) {
  const steps = [
    { label: 'Starting cash', amount: cash },
    { label: 'Revenue (withheld)', amount: revenue },
  ]
  if (interestAmount > 0) {
    steps.push({ label: `Interest (${loanCount} × $${loanRate})`, amount: -interestAmount })
  }
  return steps
}

export function doubleJumpAnalysis(revenue, shares, treasury, cash, existingLoans, rate, price) {
  const LOAN_VALUE = 100
  const targetPerShare = price * 2
  const totalTarget = targetPerShare * shares
  const externalShares = shares - treasury
  const externalDividend = targetPerShare * externalShares
  const existingInterest = interest(rate, existingLoans)
  const maxNewLoans = shares - existingLoans
  const cashBeforeLoans = cash + revenue

  const loansNeeded = cashBeforeLoans >= totalTarget
    ? 0
    : Math.ceil((totalTarget - cashBeforeLoans) / LOAN_VALUE)

  const capacityOk = loansNeeded <= maxNewLoans
  const newInterest = loansNeeded * rate
  const endCash = cashBeforeLoans - externalDividend - existingInterest - newInterest

  return {
    targetPerShare,
    cashBeforeLoans,
    loansNeeded,
    maxNewLoans,
    capacityOk,
    existingInterest,
    newInterest,
    externalShares,
    externalDividend,
    endCash,
    possible: capacityOk && endCash >= 0,
  }
}
