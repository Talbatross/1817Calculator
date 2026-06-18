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

export function interest(rate, loans) {
  return rate * loans
}
