import { fullPay, halfPay, withhold, fullPayCompany, halfPayCompany, withholdCompany, interest, fullPayCompanySteps, halfPayCompanySteps, withholdCompanySteps, fullPayJumpAnalysis, halfPayJumpAnalysis } from './calculator.js'
import { getInputs, setResults, setCompanyBreakdowns, clearCompanyBreakdowns, setJumps, clearJumps, setShareTables, clearShareTables, initToggleButtons } from './ui.js'

function formatShareResults(revenue, shares) {
  if (shares === 2) {
    return [`$${fullPay(revenue, shares) * shares} total`, `$${halfPay(revenue, shares) * shares} total`]
  }
  return [`$${fullPay(revenue, shares)}/share`, `$${halfPay(revenue, shares)}/share`]
}

const JUMP_COMBINATIONS = [
  { jumpLabel: 'Double Jump', payLabel: 'Full Pay', multiplier: 2, analyze: fullPayJumpAnalysis },
  { jumpLabel: 'Double Jump', payLabel: 'Half Pay', multiplier: 2, analyze: halfPayJumpAnalysis },
  { jumpLabel: 'Single Jump', payLabel: 'Full Pay', multiplier: 1, analyze: fullPayJumpAnalysis },
  { jumpLabel: 'Single Jump', payLabel: 'Half Pay', multiplier: 1, analyze: halfPayJumpAnalysis },
]

function possibleJumps(revenue, company, price) {
  return JUMP_COMBINATIONS
    .map(({ analyze, ...combo }) => ({ ...combo, analysis: analyze(revenue, company, price, combo.multiplier) }))
    .filter(jump => jump.analysis.possible)
}

function update() {
  const { revenue: rawRevenue, shares, treasury, cash, loans, rate, price } = getInputs()
  const revenue = Math.floor(rawRevenue / 10) * 10
  const t = shares === 2 ? 0 : Math.max(0, Math.min(Math.floor(treasury) || 0, shares * 2 - 2))
  const existingLoans = Math.max(0, Math.min(Math.floor(loans) || 0, shares))
  const company = { shares, treasury: t, cash, existingLoans, rate }
  const i = interest(rate, existingLoans)

  if (!revenue) {
    setResults('—', '—', '—')
    clearCompanyBreakdowns()
    clearShareTables()
    clearJumps()
    return
  }

  const [fullResult, halfResult] = formatShareResults(revenue, shares)
  setResults(fullResult, halfResult, '')

  setShareTables(shares, fullPay(revenue, shares), halfPay(revenue, shares))

  setCompanyBreakdowns(
    fullPayCompanySteps(revenue, i, company),
    halfPayCompanySteps(revenue, i, company),
    withholdCompanySteps(revenue, i, company)
  )

  if (price > 0) {
    setJumps(possibleJumps(revenue, company, price), price, rate)
  } else {
    clearJumps()
  }
}

function getShares() {
  const active = document.querySelector('#shares .btn-group__btn--active')
  return Number(active.dataset.value)
}

function updateTreasuryVisibility() {
  const shares = getShares()
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
document.querySelectorAll('#shares .btn-group__btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#shares .btn-group__btn').forEach(b => b.classList.remove('btn-group__btn--active'))
    btn.classList.add('btn-group__btn--active')
    updateTreasuryVisibility()
    update()
  })
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
document.getElementById('price').addEventListener('change', update)

updateTreasuryVisibility()
update()
initToggleButtons()
