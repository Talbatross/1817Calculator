import { describe, it, expect } from 'vitest'
import { fullPay, halfPay, withhold, fullPayCompany, halfPayCompany, withholdCompany, interest, doubleJumpAnalysis } from './calculator.js'

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

describe('doubleJumpAnalysis', () => {
  it('price drops when loan is taken, reducing the dividend target', () => {
    // price=$50 (index 2), 1 loan drops price to $45 → totalTarget=90
    // revenue=$90 covers target, no extra cash needed except $5 interest
    // endCash = 5 + 90 - 90 - 0 - 5 = 0
    const r = doubleJumpAnalysis(90, 10, 0, 5, 0, 5, 50)
    expect(r.possible).toBe(true)
    expect(r.loansNeeded).toBe(1)
    expect(r.originalPrice).toBe(50)
    expect(r.adjustedPrice).toBe(45)
    expect(r.totalTarget).toBe(90)
    expect(r.endCash).toBe(0)
  })

  it('is possible with zero loans when revenue covers target at current price', () => {
    // price=$45, totalTarget=$90, revenue=$100 ≥ $90 → loansNeeded=0, no price drop
    // externalDividend=$90, endCash=0+100-90-0-0=10
    const r = doubleJumpAnalysis(100, 10, 0, 0, 0, 5, 45)
    expect(r.possible).toBe(true)
    expect(r.loansNeeded).toBe(0)
    expect(r.adjustedPrice).toBe(45)
    expect(r.endCash).toBe(10)
  })

  it('treasury shares reduce external dividend', () => {
    // price=$50, 1 loan → $45, totalTarget=$90, externalShares=2, externalDividend=$18
    // endCash = 0 + 30 - 18 - 0 - 10 = 2
    const r = doubleJumpAnalysis(30, 10, 8, 0, 0, 10, 50)
    expect(r.possible).toBe(true)
    expect(r.loansNeeded).toBe(1)
    expect(r.adjustedPrice).toBe(45)
    expect(r.externalDividend).toBe(18)
    expect(r.endCash).toBe(2)
  })

  it('existing cash contributes to end balance but not to funding the dividend', () => {
    // cash=$200 won't prevent needing a loan (only revenue=$10 counts toward $100 target)
    // 1 loan drops price $50→$45, totalTarget=$90; endCash=200+10-90-0-10=110
    const r = doubleJumpAnalysis(10, 10, 0, 200, 0, 10, 50)
    expect(r.possible).toBe(true)
    expect(r.loansNeeded).toBe(1)
    expect(r.cash).toBe(200)
    expect(r.endCash).toBe(110)
  })

  it('is not possible when loan capacity is zero and revenue is too low', () => {
    // shares=2, existingLoans=2 → maxNewLoans=0; revenue=$10 < target=$100
    const r = doubleJumpAnalysis(10, 2, 0, 0, 2, 10, 50)
    expect(r.possible).toBe(false)
    expect(r.canFund).toBe(false)
    expect(r.maxNewLoans).toBe(0)
  })

  it('is not possible when end cash is always negative', () => {
    // price=$45, 1 loan drops to $40, totalTarget=$80, externalDividend=$80
    // endCash = 0 + 10 - 80 - 0 - 10 = -80; more loans only add interest
    const r = doubleJumpAnalysis(10, 10, 0, 0, 0, 10, 45)
    expect(r.possible).toBe(false)
    expect(r.canFund).toBe(true)
    expect(r.loansNeeded).toBe(1)
    expect(r.adjustedPrice).toBe(40)
    expect(r.endCash).toBe(-80)
  })

  it('existing interest is deducted from end cash', () => {
    // price=$50, 1 loan → $45, totalTarget=$90; existingInterest=3×$10=$30
    // endCash = 0 + 60 - 18 - 30 - 10 = 2
    const r = doubleJumpAnalysis(60, 10, 8, 0, 3, 10, 50)
    expect(r.possible).toBe(true)
    expect(r.existingInterest).toBe(30)
    expect(r.newInterest).toBe(10)
    expect(r.endCash).toBe(2)
  })
})
