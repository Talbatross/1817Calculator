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

// effectiveRevenue: actual paid portion for display (halfPay*shares for Half Pay, full revenue for Full Pay)
// thresholdRevenue: revenue counted toward the DJ threshold (revenue/2 for Half Pay, full revenue for Full Pay)
// Dividends are paid from revenue (not company cash). endCash = cash + loanProceeds + withheld + treasuryDividend - interest
function analyzeDoubleJump(effectiveRevenue, thresholdRevenue, revenue, shares, treasury, cash, existingLoans, rate, price) {
  const priceIndex = STOCK_PRICES.indexOf(price)
  const externalShares = shares - treasury
  const existingInterest = interest(rate, existingLoans)
  const maxNewLoans = shares - existingLoans
  const withheld = revenue - effectiveRevenue
  const treasuryDividend = effectiveRevenue * treasury / shares

  let bestFundable = null

  for (let N = 0; N <= maxNewLoans; N++) {
    const adjustedPrice = STOCK_PRICES[Math.max(0, priceIndex - N)]
    const totalTarget = adjustedPrice * 2
    if (thresholdRevenue < totalTarget) continue

    const targetPerShare = totalTarget / shares
    const externalDividend = targetPerShare * externalShares
    const newInterest = N * rate
    const endCash = cash + withheld + treasuryDividend - existingInterest - newInterest

    const result = {
      originalPrice: price, adjustedPrice, totalTarget, targetPerShare,
      cash, effectiveRevenue, withheld, loansNeeded: N, maxNewLoans,
      externalShares, externalDividend, existingInterest, newInterest, endCash,
      treasuryDividend,
    }

    if (endCash >= 0) return { possible: true, canFund: true, ...result }
    if (bestFundable === null || endCash > bestFundable.endCash) bestFundable = result
  }

  const canFund = bestFundable !== null

  if (!canFund) {
    const N = maxNewLoans
    const adjustedPrice = STOCK_PRICES[Math.max(0, priceIndex - N)]
    const totalTarget = adjustedPrice * 2
    const targetPerShare = totalTarget / shares
    const externalDividend = targetPerShare * externalShares
    const newInterest = N * rate
    const endCash = cash + withheld + treasuryDividend - existingInterest - newInterest
    bestFundable = {
      originalPrice: price, adjustedPrice, totalTarget, targetPerShare,
      cash, effectiveRevenue, withheld, loansNeeded: N, maxNewLoans,
      externalShares, externalDividend, existingInterest, newInterest, endCash,
      treasuryDividend,
    }
  }

  return { possible: false, canFund, ...bestFundable }
}

export function doubleJumpAnalysis(revenue, shares, treasury, cash, existingLoans, rate, price) {
  return analyzeDoubleJump(revenue, revenue, revenue, shares, treasury, cash, existingLoans, rate, price)
}

export function halfPayDoubleJumpAnalysis(revenue, shares, treasury, cash, existingLoans, rate, price) {
  const effectiveRevenue = halfPay(revenue, shares) * shares
  const thresholdRevenue = effectiveRevenue
  return analyzeDoubleJump(effectiveRevenue, thresholdRevenue, revenue, shares, treasury, cash, existingLoans, rate, price)
}
