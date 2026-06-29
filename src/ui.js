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
    possible, canFund,
    originalPrice, adjustedPrice, totalTarget, targetPerShare,
    cash, revenue, loansNeeded, maxNewLoans,
    existingInterest, newInterest, externalShares, externalDividend, endCash,
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
      const priceNote = adjustedPrice < originalPrice ? `, price $${originalPrice} → $${adjustedPrice}` : ''
      bodyHtml += `<div class="dj__loans">${loansNeeded} new loan${loansNeeded !== 1 ? 's' : ''} needed ($${loansNeeded * 100} + $${newInterest} interest${priceNote})</div>`
    }

    const existIntRow = existingInterest > 0
      ? `<span>− Existing interest</span><span>−$${existingInterest}</span>`
      : ''
    const newIntRow = newInterest > 0
      ? `<span>− New interest (${loansNeeded} × $${rate})</span><span>−$${newInterest}</span>`
      : ''

    const cashRow = cash > 0 ? `<span>+ Company cash</span><span>$${cash}</span>` : ''
    bodyHtml += `
      <div class="dj__breakdown">
        <span>Revenue</span><span>$${revenue}</span>
        ${cashRow}
        <span>− Ext. dividend (${externalShares} × $${targetPerShare})</span><span>−$${externalDividend}</span>
        ${existIntRow}${newIntRow}
        <span class="breakdown__total">= Remaining</span><span class="breakdown__total">${fmt(endCash)}</span>
      </div>`
  } else {
    if (!canFund) {
      bodyHtml += `<div class="dj__reason">Revenue ($${revenue}) below target ($${totalTarget}) — loan capacity: ${maxNewLoans}</div>`
    } else {
      const loanNote = loansNeeded > 0
        ? `${loansNeeded} loan${loansNeeded !== 1 ? 's' : ''} (price $${originalPrice} → $${adjustedPrice}), but `
        : ''
      bodyHtml += `<div class="dj__reason">${loanNote}remaining cash: ${fmt(endCash)}</div>`
    }
  }

  document.getElementById('double-jump').innerHTML = `
    <div class="dj__header ${headerClass}">
      <span class="dj__title">Double Jump (≥ $${totalTarget} total)</span>
      <span class="${statusClass}">${statusText}</span>
    </div>
    <div class="dj__body">${bodyHtml}</div>
  `
}
