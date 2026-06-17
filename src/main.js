import { fullPay, halfPay, withhold, fullPayCompany, halfPayCompany, withholdCompany } from './calculator.js'
import { getInputs, setResults, setCompanyResults } from './ui.js'

function update() {
  const { revenue, shares, treasury } = getInputs()
  const t = shares === 2 ? 0 : treasury

  if (!revenue) {
    setResults('—', '—', '—')
    setCompanyResults('—', '—', '—')
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

  setCompanyResults(
    `$${fullPayCompany(revenue, shares, t)}`,
    `$${halfPayCompany(revenue, shares, t)}`,
    `$${withholdCompany(revenue)}`
  )
}

function updateTreasuryVisibility() {
  const shares = Number(document.getElementById('shares').value)
  const label = document.getElementById('treasury-label')
  const input = document.getElementById('treasury')
  label.hidden = shares === 2
  if (shares === 2) {
    input.value = 0
  } else {
    input.max = shares - 2
  }
}

document.getElementById('revenue').addEventListener('input', update)
document.getElementById('shares').addEventListener('change', () => {
  updateTreasuryVisibility()
  update()
})
document.getElementById('treasury').addEventListener('input', update)

updateTreasuryVisibility()
update()
