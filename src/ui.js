export function getInputs() {
  return {
    revenue: Number(document.getElementById('revenue').value),
    shares: Number(document.querySelector('#shares .btn-group__btn--active').dataset.value),
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

const SHARE_TABLE_MAX = { 5: 8, 10: 18 }

const tableState = { full: false, half: false }

function toggleTable(which) {
  tableState[which] = !tableState[which]
  const tableEl = document.getElementById(`result-${which}-table`)
  const btnEl = document.getElementById(`toggle-${which}`)
  tableEl.classList.toggle('result__share-table--collapsed', !tableState[which])
  btnEl.classList.toggle('result__toggle--expanded', tableState[which])
  btnEl.setAttribute('aria-expanded', String(tableState[which]))
}

export function initToggleButtons() {
  document.getElementById('toggle-full').addEventListener('click', () => toggleTable('full'))
  document.getElementById('toggle-half').addEventListener('click', () => toggleTable('half'))
}

function renderChunked(max, perShare, numChunks) {
  const chunkSize = Math.ceil(max / numChunks)
  let html = ''
  for (let start = 1; start <= max; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, max)
    let sharesRow = '', payoutRow = ''
    for (let i = start; i <= end; i++) {
      sharesRow += `<td>${i}</td>`
      payoutRow += `<td>$${perShare * i}</td>`
    }
    html += `<table class="share-table"><tr><th>Shares</th>${sharesRow}</tr><tr><th>Payout</th>${payoutRow}</tr></table>`
  }
  return html
}

function fitShareTable(el, max, perShare) {
  for (let numChunks = 1; numChunks <= max; numChunks++) {
    el.innerHTML = renderChunked(max, perShare, numChunks)
    if (el.scrollWidth <= el.clientWidth) break
  }
}

export function setShareTables(shares, fullPerShare, halfPerShare) {
  const max = SHARE_TABLE_MAX[shares]
  const fullEl = document.getElementById('result-full-table')
  const halfEl = document.getElementById('result-half-table')
  const fullBtn = document.getElementById('toggle-full')
  const halfBtn = document.getElementById('toggle-half')
  if (!max) {
    tableState.full = false
    tableState.half = false
    fullEl.innerHTML = ''
    halfEl.innerHTML = ''
    fullBtn.hidden = true
    halfBtn.hidden = true
    return
  }
  fullBtn.hidden = false
  halfBtn.hidden = false
  // Temporarily reveal both elements so fitShareTable can measure clientWidth correctly.
  // (display:none produces clientWidth=0, which breaks the chunk-fitting loop.)
  // No visual flash because JS runs synchronously before the browser paints.
  fullEl.classList.remove('result__share-table--collapsed')
  halfEl.classList.remove('result__share-table--collapsed')
  fitShareTable(fullEl, max, fullPerShare)
  fitShareTable(halfEl, max, halfPerShare)
  // Re-apply collapsed state from tableState
  fullEl.classList.toggle('result__share-table--collapsed', !tableState.full)
  halfEl.classList.toggle('result__share-table--collapsed', !tableState.half)
  fullBtn.classList.toggle('result__toggle--expanded', tableState.full)
  halfBtn.classList.toggle('result__toggle--expanded', tableState.half)
  fullBtn.setAttribute('aria-expanded', String(tableState.full))
  halfBtn.setAttribute('aria-expanded', String(tableState.half))
}

export function clearShareTables() {
  tableState.full = false
  tableState.half = false
  document.getElementById('result-full-table').classList.remove('result__share-table--collapsed')
  document.getElementById('result-half-table').classList.remove('result__share-table--collapsed')
  document.getElementById('toggle-full').classList.remove('result__toggle--expanded')
  document.getElementById('toggle-half').classList.remove('result__toggle--expanded')
  document.getElementById('result-full-table').innerHTML = ''
  document.getElementById('result-half-table').innerHTML = ''
  document.getElementById('toggle-full').hidden = true
  document.getElementById('toggle-half').hidden = true
}

export function clearDoubleJump() {
  document.getElementById('double-jump').innerHTML = ''
}

const fmtSigned = n => n < 0 ? `−$${Math.abs(n)}` : `$${n}`

function renderDJPossibleBody(analysis, rate) {
  const { originalPrice, adjustedPrice, cash, withheld, loansNeeded, existingInterest, newInterest, treasuryDividend, endCash } = analysis

  let loansHtml
  if (loansNeeded === 0) {
    loansHtml = '<div class="dj__loans">No new loans needed</div>'
  } else {
    const priceNote = adjustedPrice < originalPrice ? `, price $${originalPrice} → $${adjustedPrice}` : ''
    loansHtml = `<div class="dj__loans">${loansNeeded} new loan${loansNeeded !== 1 ? 's' : ''} needed ($${loansNeeded * 100} + $${newInterest} interest${priceNote})</div>`
  }

  const cashRow = cash > 0 ? `<span>+ Company cash</span><span>$${cash}</span>` : ''
  const withheldRow = withheld > 0 ? `<span>+ Withheld</span><span>$${withheld}</span>` : ''
  const treasuryDivRow = treasuryDividend > 0
    ? `<span>+ Treasury dividends</span><span>$${treasuryDividend}</span>`
    : ''
  const existIntRow = existingInterest > 0
    ? `<span>− Existing interest</span><span>−$${existingInterest}</span>`
    : ''
  const newIntRow = newInterest > 0
    ? `<span>− New interest (${loansNeeded} × $${rate})</span><span>−$${newInterest}</span>`
    : ''

  return loansHtml + `
      <div class="dj__breakdown">
        ${cashRow}
        ${withheldRow}
        ${treasuryDivRow}
        ${existIntRow}${newIntRow}
        <span class="breakdown__total">= Remaining</span><span class="breakdown__total">${fmtSigned(endCash)}</span>
      </div>`
}

function renderDJImpossibleBody(analysis, revenueLabel) {
  const { canFund, effectiveRevenue, totalTarget, maxNewLoans, loansNeeded, originalPrice, adjustedPrice, endCash } = analysis

  if (!canFund) {
    return `<div class="dj__reason">${revenueLabel} ($${effectiveRevenue}) below target ($${totalTarget}) — loan capacity: ${maxNewLoans}</div>`
  }
  const loanNote = loansNeeded > 0
    ? `${loansNeeded} loan${loansNeeded !== 1 ? 's' : ''} (price $${originalPrice} → $${adjustedPrice}), but `
    : ''
  return `<div class="dj__reason">${loanNote}remaining cash: ${fmtSigned(endCash)}</div>`
}

function renderDJCard(analysis, rate, payLabel) {
  const { possible, totalTarget } = analysis

  const headerClass = possible ? 'dj__header--ok' : 'dj__header--fail'
  const statusClass = possible ? 'dj__status--ok' : 'dj__status--fail'
  const statusText = possible ? 'Possible' : 'Not Possible'
  const revenueLabel = payLabel === 'Half Pay' ? 'Half-pay' : 'Revenue'

  const bodyHtml = possible
    ? renderDJPossibleBody(analysis, rate)
    : renderDJImpossibleBody(analysis, revenueLabel)

  return `
    <div class="dj__card">
      <div class="dj__header ${headerClass}">
        <span class="dj__title">${payLabel} Double Jump (≥ $${totalTarget} total)</span>
        <span class="${statusClass}">${statusText}</span>
      </div>
      <div class="dj__body">${bodyHtml}</div>
    </div>`
}

export function setDoubleJumps(fullAnalysis, halfAnalysis, rate) {
  document.getElementById('double-jump').innerHTML =
    renderDJCard(fullAnalysis, rate, 'Full Pay') +
    renderDJCard(halfAnalysis, rate, 'Half Pay')
}
