export function getInputs() {
  return {
    revenue: Number(document.getElementById('revenue').value),
    shares: Number(document.getElementById('shares').value),
  }
}

export function setResults(full, half, hold) {
  document.getElementById('result-full').textContent = full
  document.getElementById('result-half').textContent = half
  document.getElementById('result-withhold').textContent = hold
}
