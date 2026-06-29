import { fullPay, halfPay, withhold, fullPayCompany, halfPayCompany, withholdCompany, interest, fullPayCompanySteps, halfPayCompanySteps, withholdCompanySteps } from './calculator.js'
import { getInputs, setResults, setCompanyBreakdowns, clearCompanyBreakdowns } from './ui.js'

function update() {
  const { revenue: rawRevenue, shares, treasury, cash, loans, rate } = getInputs()
  const revenue = Math.floor(rawRevenue / 10) * 10
  const t = shares === 2 ? 0 : Math.max(0, Math.min(Math.floor(treasury) || 0, shares * 2 - 2))
  const l = Math.max(0, Math.min(Math.floor(loans) || 0, shares))
  const i = interest(rate, l)

  if (!revenue) {
    setResults('—', '—', '—')
    clearCompanyBreakdowns()
    return
  }

  if (shares === 2) {
    setResults(
      `$${fullPay(revenue, shares) * shares} total`,
      `$${halfPay(revenue, shares) * shares} total`,
      `$${withhold()} total`
    )
  } else {
    setResults(
      `$${fullPay(revenue, shares)}/share`,
      `$${halfPay(revenue, shares)}/share`,
      `$${withhold()}/share`
    )
  }

  setCompanyBreakdowns(
    fullPayCompanySteps(revenue, shares, t, cash, i, l, rate),
    halfPayCompanySteps(revenue, shares, t, cash, i, l, rate),
    withholdCompanySteps(revenue, cash, i, l, rate)
  )
}

function updateTreasuryVisibility() {
  const shares = Number(document.getElementById('shares').value)
  const label = document.getElementById('treasury-label')
  const treasury = document.getElementById('treasury')
  const loans = document.getElementById('loans')

  label.hidden = shares === 2
  if (shares === 2) {
    treasury.value = 0
    treasury.max = 0
  } else {
    treasury.max = shares * 2 - 2
    if (Number(treasury.value) > Number(treasury.max)) treasury.value = treasury.max
  }

  loans.max = shares
  if (Number(loans.value) > shares) loans.value = shares
}

document.getElementById('revenue').addEventListener('input', update)
document.getElementById('shares').addEventListener('change', () => {
  updateTreasuryVisibility()
  update()
})
document.getElementById('treasury').addEventListener('input', () => {
  const treasury = document.getElementById('treasury')
  if (Number(treasury.value) > Number(treasury.max)) treasury.value = treasury.max
  update()
})
document.getElementById('cash').addEventListener('input', update)
document.getElementById('loans').addEventListener('input', () => {
  const loans = document.getElementById('loans')
  if (Number(loans.value) > Number(loans.max)) loans.value = loans.max
  update()
})
document.getElementById('rate').addEventListener('change', update)

updateTreasuryVisibility()
update()
