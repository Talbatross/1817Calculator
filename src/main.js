import { fullPay, halfPay, withhold } from './calculator.js'
import { getInputs, setResults } from './ui.js'

function update() {
  const { revenue, shares } = getInputs()

  if (!revenue) {
    setResults('—', '—', '—')
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
