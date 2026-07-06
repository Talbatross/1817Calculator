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

export function interest(rate, existingLoans) {
  return rate * existingLoans
}

export function fullPayCompanySteps(revenue, interestAmount, { shares, treasury, cash, existingLoans, rate }) {
  const perShare = fullPay(revenue, shares)
  const steps = [{ label: 'Starting cash', amount: cash }]
  if (treasury > 0) {
    steps.push({ label: `Treasury (${treasury} × $${perShare})`, amount: perShare * treasury })
  }
  if (interestAmount > 0) {
    steps.push({ label: `Interest (${existingLoans} × $${rate})`, amount: -interestAmount })
  }
  return steps
}

export function halfPayCompanySteps(revenue, interestAmount, { shares, treasury, cash, existingLoans, rate }) {
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
    steps.push({ label: `Interest (${existingLoans} × $${rate})`, amount: -interestAmount })
  }
  return steps
}

export function withholdCompanySteps(revenue, interestAmount, { cash, existingLoans, rate }) {
  const steps = [
    { label: 'Starting cash', amount: cash },
    { label: 'Revenue (withheld)', amount: revenue },
  ]
  if (interestAmount > 0) {
    steps.push({ label: `Interest (${existingLoans} × $${rate})`, amount: -interestAmount })
  }
  return steps
}

export const STOCK_PRICES = [40, 45, 50, 55, 60, 65, 70, 80, 90, 100, 110, 120, 135, 150, 165, 180, 200, 220, 245, 270, 300, 330, 360, 400, 440, 490, 540, 600]

// effectiveRevenue: actual paid portion for display (halfPay*shares for Half Pay, full revenue for Full Pay)
// thresholdRevenue: revenue counted toward the DJ threshold (revenue/2 for Half Pay, full revenue for Full Pay)
// Dividends are paid from revenue (not company cash). endCash = cash + loanProceeds + withheld + treasuryDividend - interest
function analyzeDoubleJump(effectiveRevenue, thresholdRevenue, rawRevenue, { shares, treasury, cash, existingLoans, rate }, price) {
  const priceIndex = STOCK_PRICES.indexOf(price)
  const externalShares = shares - treasury
  const existingInterest = interest(rate, existingLoans)
  const maxNewLoans = shares - existingLoans
  const withheld = rawRevenue - effectiveRevenue
  const treasuryDividend = effectiveRevenue * treasury / shares

  const buildScenario = (newLoanCount) => {
    const adjustedPrice = STOCK_PRICES[Math.max(0, priceIndex - newLoanCount)]
    const totalTarget = adjustedPrice * 2
    const targetPerShare = totalTarget / shares
    const externalDividend = targetPerShare * externalShares
    const newInterest = newLoanCount * rate
    const endCash = cash + withheld + treasuryDividend - existingInterest - newInterest
    return {
      originalPrice: price, adjustedPrice, totalTarget, targetPerShare,
      cash, effectiveRevenue, withheld, loansNeeded: newLoanCount, maxNewLoans,
      externalShares, externalDividend, existingInterest, newInterest, endCash,
      treasuryDividend,
    }
  }

  let bestFundable = null

  for (let newLoanCount = 0; newLoanCount <= maxNewLoans; newLoanCount++) {
    const scenario = buildScenario(newLoanCount)
    if (thresholdRevenue < scenario.totalTarget) continue

    if (scenario.endCash >= 0) return { possible: true, canFund: true, ...scenario }
    if (bestFundable === null || scenario.endCash > bestFundable.endCash) bestFundable = scenario
  }

  const canFund = bestFundable !== null

  if (!canFund) {
    bestFundable = buildScenario(maxNewLoans)
  }

  return { possible: false, canFund, ...bestFundable }
}

export function fullPayDoubleJumpAnalysis(revenue, company, price) {
  return analyzeDoubleJump(revenue, revenue, revenue, company, price)
}

export function halfPayDoubleJumpAnalysis(revenue, company, price) {
  const effectiveRevenue = halfPay(revenue, company.shares) * company.shares
  const thresholdRevenue = effectiveRevenue
  return analyzeDoubleJump(effectiveRevenue, thresholdRevenue, revenue, company, price)
}
