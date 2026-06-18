import { describe, it, expect } from 'vitest'
import { fullPay, halfPay, withhold, fullPayCompany, halfPayCompany, withholdCompany, interest } from './calculator.js'

describe('fullPay', () => {
  it('divides revenue evenly by share count', () => {
    expect(fullPay(70, 10)).toBe(7)
    expect(fullPay(60, 5)).toBe(12)
    expect(fullPay(40, 2)).toBe(20)
  })
})

describe('halfPay', () => {
  it('rounds withheld down to nearest $10 for 10-share companies', () => {
    // $70: withheld = floor(70/20)*10 = $30, payout = $40, per share = $4
    expect(halfPay(70, 10)).toBe(4)
    // $60: withheld = $30, payout = $30, per share = $3
    expect(halfPay(60, 10)).toBe(3)
    // $80: withheld = $40, payout = $40, per share = $4
    expect(halfPay(80, 10)).toBe(4)
    // $90: withheld = $40, payout = $50, per share = $5
    expect(halfPay(90, 10)).toBe(5)
  })

  it('splits evenly for 5-share companies', () => {
    expect(halfPay(60, 5)).toBe(6)
    expect(halfPay(100, 5)).toBe(10)
  })

  it('splits evenly for 2-share companies', () => {
    expect(halfPay(60, 2)).toBe(15)
    expect(halfPay(40, 2)).toBe(10)
  })
})

describe('withhold', () => {
  it('always returns 0 regardless of revenue or shares', () => {
    expect(withhold(0, 10)).toBe(0)
    expect(withhold(70, 10)).toBe(0)
    expect(withhold(60, 5)).toBe(0)
  })
})

describe('zero revenue', () => {
  it('all functions return 0 when revenue is 0', () => {
    expect(fullPay(0, 10)).toBe(0)
    expect(halfPay(0, 10)).toBe(0)
    expect(withhold(0, 10)).toBe(0)
  })
})

describe('fullPayCompany', () => {
  it('returns 0 when no treasury shares', () => {
    expect(fullPayCompany(80, 10, 0)).toBe(0)
  })
  it('returns per-share dividend times treasury shares', () => {
    expect(fullPayCompany(80, 10, 2)).toBe(16)
    expect(fullPayCompany(60, 5, 1)).toBe(12)
  })
})

describe('halfPayCompany', () => {
  it('returns withheld amount when no treasury shares (10-share)', () => {
    // $80: withheld = floor(80/20)*10 = $40
    expect(halfPayCompany(80, 10, 0)).toBe(40)
    // $70: withheld = floor(70/20)*10 = $30
    expect(halfPayCompany(70, 10, 0)).toBe(30)
  })
  it('returns half revenue when no treasury shares (5-share)', () => {
    expect(halfPayCompany(60, 5, 0)).toBe(30)
  })
  it('adds treasury share dividends to withheld (10-share)', () => {
    // $80: withheld=$40, per-share=$4, treasury=2 → 40 + 4*2 = 48
    expect(halfPayCompany(80, 10, 2)).toBe(48)
  })
  it('adds treasury share dividends to withheld (5-share)', () => {
    // $60: withheld=$30, per-share=$6, treasury=1 → 30 + 6*1 = 36
    expect(halfPayCompany(60, 5, 1)).toBe(36)
  })
})

describe('withholdCompany', () => {
  it('returns full revenue to company', () => {
    expect(withholdCompany(80)).toBe(80)
    expect(withholdCompany(0)).toBe(0)
  })
})

describe('interest', () => {
  it('returns rate times number of loans', () => {
    expect(interest(10, 3)).toBe(30)
    expect(interest(35, 5)).toBe(175)
    expect(interest(70, 10)).toBe(700)
  })

  it('returns 0 when rate is 0', () => {
    expect(interest(0, 5)).toBe(0)
  })

  it('returns 0 when loans is 0', () => {
    expect(interest(30, 0)).toBe(0)
  })
})
