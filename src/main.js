import { fullPay, halfPay, withhold } from './calculator.js'
import { getInputs, setResults } from './ui.js'

function update() {
  const { revenue, shares } = getInputs()

  if (!revenue) {
    setResults('—', '—', '—')
    return
  }

  if (shares === 2) {
    setResults(
      `$${fullPay(revenue, shares) * shares} total`,
      `$${halfPay(revenue, shares) * shares} total`,
      `$${withhold()} total`
    )
    return
  }

  setResults(
    `$${fullPay(revenue, shares)}/share`,
    `$${halfPay(revenue, shares)}/share`,
    `$${withhold()}/share`
  )
}

document.getElementById('revenue').addEventListener('input', update)
document.getElementById('shares').addEventListener('change', update)

update()
