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

export const STOCK_PRICES = [40, 45, 50, 55, 60, 65, 70, 80, 90, 100, 110, 120, 135, 150, 165, 180, 200, 220, 245, 270, 300, 330, 360, 400, 440, 490, 540, 600]

export function doubleJumpAnalysis(revenue, shares, treasury, cash, existingLoans, rate, price) {
  const LOAN_VALUE = 100
  const priceIndex = STOCK_PRICES.indexOf(price)
  const externalShares = shares - treasury
  const existingInterest = interest(rate, existingLoans)
  const maxNewLoans = shares - existingLoans

  // Each loan taken drops the stock price one step, lowering the double-jump threshold.
  // Iterate loan counts to find the minimum N where the dividend can be funded and endCash >= 0.
  let bestFundable = null

  for (let N = 0; N <= maxNewLoans; N++) {
    const adjustedPrice = STOCK_PRICES[Math.max(0, priceIndex - N)]
    const totalTarget = adjustedPrice * 2
    if (revenue + N * LOAN_VALUE < totalTarget) continue  // can't fund dividend with this many loans

    const targetPerShare = totalTarget / shares
    const externalDividend = targetPerShare * externalShares
    const newInterest = N * rate
    const endCash = cash + revenue - externalDividend - existingInterest - newInterest

    const result = {
      originalPrice: price, adjustedPrice, totalTarget, targetPerShare,
      cash, revenue, loansNeeded: N, maxNewLoans,
      externalShares, externalDividend, existingInterest, newInterest, endCash,
    }

    if (endCash >= 0) return { possible: true, canFund: true, ...result }
    if (bestFundable === null || endCash > bestFundable.endCash) bestFundable = result
  }

  // Not possible — report best fundable scenario, or max-loans scenario if nothing was fundable
  const canFund = bestFundable !== null

  if (!canFund) {
    const N = maxNewLoans
    const adjustedPrice = STOCK_PRICES[Math.max(0, priceIndex - N)]
    const totalTarget = adjustedPrice * 2
    const targetPerShare = totalTarget / shares
    const externalDividend = targetPerShare * externalShares
    const newInterest = N * rate
    const endCash = cash + revenue - externalDividend - existingInterest - newInterest
    bestFundable = {
      originalPrice: price, adjustedPrice, totalTarget, targetPerShare,
      cash, revenue, loansNeeded: N, maxNewLoans,
      externalShares, externalDividend, existingInterest, newInterest, endCash,
    }
  }

  return { possible: false, canFund, ...bestFundable }
}
