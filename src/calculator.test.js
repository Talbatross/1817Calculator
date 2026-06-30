import { describe, it, expect } from 'vitest'
import { fullPay, halfPay, withhold, fullPayCompany, halfPayCompany, withholdCompany, interest, doubleJumpAnalysis, halfPayDoubleJumpAnalysis } from './calculator.js'

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
    // revenue=$90 covers target; loan repaid after; endCash = 5 (cash) - 5 (interest) = 0
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
    // endCash = 0 (cash) + 0 (no loans) + 0 (no withheld/treasury) - 0 (interest) = 0
    const r = doubleJumpAnalysis(100, 10, 0, 0, 0, 5, 45)
    expect(r.possible).toBe(true)
    expect(r.loansNeeded).toBe(0)
    expect(r.adjustedPrice).toBe(45)
    expect(r.endCash).toBe(0)
  })

  it('treasury shares reduce external dividend', () => {
    // price=$50, 1 loan → $45, totalTarget=$90, externalShares=2, externalDividend=$18
    // treasuryDividend = 90 * 8/10 = 72; loan repaid after
    // endCash = 0 (cash) + 72 (treasury div) - 10 (interest) = 62
    const r = doubleJumpAnalysis(90, 10, 8, 0, 0, 10, 50)
    expect(r.possible).toBe(true)
    expect(r.loansNeeded).toBe(1)
    expect(r.adjustedPrice).toBe(45)
    expect(r.externalDividend).toBe(18)
    expect(r.endCash).toBe(62)
  })

  it('existing cash contributes to end balance but not to funding the dividend', () => {
    // cash=$200 won't prevent needing a loan (only revenue=$90 counts toward $100 target)
    // 1 loan drops price $50→$45, totalTarget=$90
    // loan repaid after; endCash = 200 (cash) - 10 (interest) = 190
    const r = doubleJumpAnalysis(90, 10, 0, 200, 0, 10, 50)
    expect(r.possible).toBe(true)
    expect(r.loansNeeded).toBe(1)
    expect(r.cash).toBe(200)
    expect(r.endCash).toBe(190)
  })

  it('is not possible when loan capacity is zero and revenue is too low', () => {
    // shares=2, existingLoans=2 → maxNewLoans=0; revenue=$10 < target=$100
    const r = doubleJumpAnalysis(10, 2, 0, 0, 2, 10, 50)
    expect(r.possible).toBe(false)
    expect(r.canFund).toBe(false)
    expect(r.maxNewLoans).toBe(0)
  })

  it('is not possible when end cash is always negative', () => {
    // price=$40 (floor), revenue=$80 meets totalTarget=$80 at N=0, maxNewLoans=0 (fully loaned)
    // existingInterest = 10×$10 = $100; endCash = 0 (cash) + 0 (no new loans) - 100 = -100
    const r = doubleJumpAnalysis(80, 10, 0, 0, 10, 10, 40)
    expect(r.possible).toBe(false)
    expect(r.canFund).toBe(true)
    expect(r.loansNeeded).toBe(0)
    expect(r.adjustedPrice).toBe(40)
    expect(r.endCash).toBe(-100)
  })

  it('existing interest is deducted from end cash', () => {
    // price=$50, 1 loan → $45, totalTarget=$90; existingInterest=3×$10=$30
    // treasuryDividend = 90 * 8/10 = 72; loan repaid after
    // endCash = 0 (cash) + 72 (treasury div) - 30 (existing int) - 10 (new int) = 32
    const r = doubleJumpAnalysis(90, 10, 8, 0, 3, 10, 50)
    expect(r.possible).toBe(true)
    expect(r.existingInterest).toBe(30)
    expect(r.newInterest).toBe(10)
    expect(r.endCash).toBe(32)
  })
})

describe('halfPayDoubleJumpAnalysis', () => {
  it('needs more loans than full pay when halfPay total is below target', () => {
    // revenue=160, shares=10, price=$50 → totalTarget=$100 at N=0
    // halfPay(160,10): effectiveRevenue=80, withheld=80, thresholdRevenue=80
    // N=0: 80 < 100 → skip. N=1: totalTarget=$90, 80 < 90 → skip.
    // N=2: adjustedPrice=$40, totalTarget=$80; 80 ≥ 80 ✓
    // loans repaid after; endCash = 0 (cash) + 80 (withheld) - 10 (interest) = 70
    const r = halfPayDoubleJumpAnalysis(160, 10, 0, 0, 0, 5, 50)
    expect(r.possible).toBe(true)
    expect(r.loansNeeded).toBe(2)
    expect(r.adjustedPrice).toBe(40)
    expect(r.effectiveRevenue).toBe(80)
    expect(r.withheld).toBe(80)
    expect(r.endCash).toBe(70)
  })

  it('cannot fund when halfPay total + max loans < target', () => {
    // revenue=100, shares=2, existingLoans=2 → maxNewLoans=0
    // halfPay(100,2): halfPayTotal=50, effectiveRevenue=50
    // N=0 only: 50 < totalTarget=200 → canFund=false (full pay would succeed: 100 ≥ 200? No)
    // Actually totalTarget = price*2 = 100*2 = 200; 50 < 200 → canFund=false
    const r = halfPayDoubleJumpAnalysis(100, 2, 0, 0, 2, 5, 100)
    expect(r.possible).toBe(false)
    expect(r.canFund).toBe(false)
    expect(r.effectiveRevenue).toBe(50)
    expect(r.withheld).toBe(50)
    expect(r.maxNewLoans).toBe(0)
  })

  it('withheld contributes to endCash even though it does not fund the dividend', () => {
    // revenue=180, shares=10, price=$55 → halfPay: effectiveRevenue=90, withheld=90, thresholdRevenue=90
    // N=2: adjustedPrice=$45, totalTarget=$90; 90 ≥ 90 ✓
    // loans repaid after; endCash = 0 (cash) + 90 (withheld) - 10 (interest) = 80
    // without withheld: 0 - 10 = -90 (withheld adds $90, making it possible)
    const r = halfPayDoubleJumpAnalysis(180, 10, 0, 0, 0, 5, 55)
    expect(r.possible).toBe(true)
    expect(r.loansNeeded).toBe(2)
    expect(r.adjustedPrice).toBe(45)
    expect(r.effectiveRevenue).toBe(90)
    expect(r.withheld).toBe(90)
    expect(r.endCash).toBe(80)
  })

  it('threshold uses the rounded payout, so odd revenue that rounds up can qualify without extra loans', () => {
    // revenue=190, shares=10, price=$50 → halfPay rounds UP: payout=$100, withheld=$90
    // thresholdRevenue=$100 = totalTarget=$100 at N=0 → qualifies with no loans
    // endCash = 0 (cash) + 90 (withheld) - 0 (interest) = 90
    const r = halfPayDoubleJumpAnalysis(190, 10, 0, 0, 0, 5, 50)
    expect(r.possible).toBe(true)
    expect(r.loansNeeded).toBe(0)
    expect(r.adjustedPrice).toBe(50)
    expect(r.effectiveRevenue).toBe(100)
    expect(r.withheld).toBe(90)
    expect(r.endCash).toBe(90)
  })

  it('exactly $200 revenue qualifies for double jump at $50 with no loans', () => {
    // revenue=200, price=$50, totalTarget=100; thresholdRevenue=100 ≥ 100 ✓
    // endCash = 0 + 200 - 100 - 0 - 0 = 100
    const r = halfPayDoubleJumpAnalysis(200, 10, 0, 0, 0, 5, 50)
    expect(r.possible).toBe(true)
    expect(r.loansNeeded).toBe(0)
    expect(r.adjustedPrice).toBe(50)
    expect(r.endCash).toBe(100)
  })
})
