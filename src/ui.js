export function getInputs() {
  return {
    revenue: Number(document.getElementById('revenue').value),
    shares: Number(document.getElementById('shares').value),
    treasury: Number(document.getElementById('treasury').value),
    cash: Number(document.getElementById('cash').value),
    loans: Number(document.getElementById('loans').value),
    rate: Number(document.getElementById('rate').value),
    price: Number(document.getElementById('price').value),
  }
}

export function setResults(full, half, hold) {
  document.getElementById('result-full').textContent = full
  document.getElementById('result-half').textContent = half
  document.getElementById('result-withhold').textContent = hold
}

export function clearCompanyBreakdowns() {
  ;['result-full-breakdown', 'result-half-breakdown', 'result-withhold-breakdown'].forEach(id => {
    document.getElementById(id).innerHTML = ''
  })
}

export function setCompanyBreakdowns(fullSteps, halfSteps, holdSteps) {
  renderBreakdown('result-full-breakdown', fullSteps)
  renderBreakdown('result-half-breakdown', halfSteps)
  renderBreakdown('result-withhold-breakdown', holdSteps)
}

function renderBreakdown(id, steps) {
  const total = steps.reduce((sum, s) => sum + s.amount, 0)
  let html = ''
  steps.forEach((s, idx) => {
    if (idx === 0) {
      html += `<span>${s.label}</span><span>$${s.amount}</span>`
    } else if (s.amount >= 0) {
      html += `<span>+ ${s.label}</span><span>+$${s.amount}</span>`
    } else {
      html += `<span>− ${s.label}</span><span>−$${Math.abs(s.amount)}</span>`
    }
  })
  const totalStr = total < 0 ? `−$${Math.abs(total)}` : `$${total}`
  html += `<span class="breakdown__total">= Company cash</span><span class="breakdown__total">${totalStr}</span>`
  document.getElementById(id).innerHTML = html
}

export function clearDoubleJump() {
  document.getElementById('double-jump').innerHTML = ''
}

export function setDoubleJump(analysis, rate) {
  const {
    targetPerShare, cashBeforeLoans, loansNeeded, maxNewLoans,
    capacityOk, existingInterest, newInterest,
    externalShares, externalDividend, endCash, possible,
  } = analysis

  const headerClass = possible ? 'dj__header--ok' : 'dj__header--fail'
  const statusClass = possible ? 'dj__status--ok' : 'dj__status--fail'
  const statusText = possible ? 'Possible' : 'Not Possible'

  const fmt = n => n < 0 ? `−$${Math.abs(n)}` : `$${n}`

  let bodyHtml = '<div class="dj__applies">Applies to Full Pay and Half Pay</div>'

  if (possible) {
    if (loansNeeded === 0) {
      bodyHtml += '<div class="dj__loans">No new loans needed</div>'
    } else {
      bodyHtml += `<div class="dj__loans">${loansNeeded} new loan${loansNeeded !== 1 ? 's' : ''} needed ($${loansNeeded * 100} + $${newInterest} interest)</div>`
    }

    const existIntRow = existingInterest > 0
      ? `<span>− Existing interest</span><span>−$${existingInterest}</span>`
      : ''
    const newIntRow = newInterest > 0
      ? `<span>− New interest (${loansNeeded} × $${rate})</span><span>−$${newInterest}</span>`
      : ''

    bodyHtml += `
      <div class="dj__breakdown">
        <span>Cash + revenue</span><span>$${cashBeforeLoans}</span>
        <span>− Ext. dividend (${externalShares} × $${targetPerShare})</span><span>−$${externalDividend}</span>
        ${existIntRow}${newIntRow}
        <span class="breakdown__total">= Remaining</span><span class="breakdown__total">${fmt(endCash)}</span>
      </div>`
  } else {
    if (!capacityOk) {
      bodyHtml += `<div class="dj__reason">Need ${loansNeeded} loans — capacity: ${maxNewLoans}</div>`
    } else {
      const prefix = loansNeeded > 0
        ? `${loansNeeded} loan${loansNeeded !== 1 ? 's' : ''} needed, but remaining cash: `
        : 'Remaining cash would be: '
      bodyHtml += `<div class="dj__reason">${prefix}${fmt(endCash)}</div>`
    }
  }

  document.getElementById('double-jump').innerHTML = `
    <div class="dj__header ${headerClass}">
      <span class="dj__title">Double Jump (≥ $${targetPerShare}/share)</span>
      <span class="${statusClass}">${statusText}</span>
    </div>
    <div class="dj__body">${bodyHtml}</div>
  `
}
