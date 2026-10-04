/**
 * Mysuru Dasara 2026 - Expense Split & Budget Calculator
 * Computes live balances, who owes whom, category breakdowns, and budget metrics.
 */

class TripCalculator {
  static calculate(expenses, budget = 15000) {
    let totalTrip = 0;
    let avinashPaid = 0;
    let thannmayPaid = 0;
    let avinashShare = 0;
    let thannmayShare = 0;

    const categoryTotals = {
      travel: 0,
      food: 0,
      stay: 0,
      sightseeing: 0,
      shopping: 0,
      misc: 0
    };

    const payerCategoryBreakdown = {
      avinash: { travel: 0, food: 0, stay: 0, sightseeing: 0, shopping: 0, misc: 0 },
      thannmay: { travel: 0, food: 0, stay: 0, sightseeing: 0, shopping: 0, misc: 0 }
    };

    expenses.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      totalTrip += amt;

      // 1. Who paid
      if (exp.paidBy === 'avinash') {
        avinashPaid += amt;
        if (payerCategoryBreakdown.avinash[exp.category] !== undefined) {
          payerCategoryBreakdown.avinash[exp.category] += amt;
        }
      } else if (exp.paidBy === 'thannmay') {
        thannmayPaid += amt;
        if (payerCategoryBreakdown.thannmay[exp.category] !== undefined) {
          payerCategoryBreakdown.thannmay[exp.category] += amt;
        }
      }

      // 2. Category totals
      if (categoryTotals[exp.category] !== undefined) {
        categoryTotals[exp.category] += amt;
      } else {
        categoryTotals.misc += amt;
      }

      // 3. Share split breakdown
      if (exp.splitType === 'equal') {
        const half = amt / 2;
        avinashShare += half;
        thannmayShare += half;
      } else if (exp.splitType === 'personal') {
        if (exp.paidBy === 'avinash') {
          avinashShare += amt;
        } else {
          thannmayShare += amt;
        }
      } else if (exp.splitType === 'custom' && exp.splitDetails) {
        avinashShare += Number(exp.splitDetails.avinash) || 0;
        thannmayShare += Number(exp.splitDetails.thannmay) || 0;
      } else {
        // Fallback to equal
        const half = amt / 2;
        avinashShare += half;
        thannmayShare += half;
      }
    });

    // Net settlement calculation
    // Avinash Net = what Avinash paid - what Avinash's true share is
    const avinashNet = avinashPaid - avinashShare;
    // Thannmay Net = what Thannmay paid - what Thannmay's true share is
    const thannmayNet = thannmayPaid - thannmayShare;

    let settlement = {
      isSettled: false,
      payer: null,      // who has to send money
      receiver: null,   // who gets money
      amount: 0,
      description: 'All settled up!'
    };

    const diff = Math.round(avinashNet * 100) / 100;

    if (Math.abs(diff) < 0.5) {
      settlement.isSettled = true;
      settlement.description = 'Trip expenses are perfectly even!';
    } else if (diff > 0) {
      // Avinash paid more than his share => Thannmay owes Avinash
      settlement.payer = 'thannmay';
      settlement.receiver = 'avinash';
      settlement.amount = Math.abs(diff);
      settlement.description = `Thannmay owes Avinash ₹${settlement.amount.toLocaleString('en-IN')}`;
    } else {
      // Avinash paid less than his share => Avinash owes Thannmay
      settlement.payer = 'avinash';
      settlement.receiver = 'thannmay';
      settlement.amount = Math.abs(diff);
      settlement.description = `Avinash owes Thannmay ₹${settlement.amount.toLocaleString('en-IN')}`;
    }

    // Budget Metrics
    const budgetTotal = Number(budget) || 15000;
    const budgetRemaining = budgetTotal - totalTrip;
    const budgetPercent = Math.min(100, Math.round((totalTrip / budgetTotal) * 100));
    const isOverBudget = totalTrip > budgetTotal;

    return {
      totalTrip: Math.round(totalTrip * 100) / 100,
      avinash: {
        paid: Math.round(avinashPaid * 100) / 100,
        share: Math.round(avinashShare * 100) / 100,
        net: Math.round(avinashNet * 100) / 100
      },
      thannmay: {
        paid: Math.round(thannmayPaid * 100) / 100,
        share: Math.round(thannmayShare * 100) / 100,
        net: Math.round(thannmayNet * 100) / 100
      },
      settlement,
      categoryTotals,
      payerCategoryBreakdown,
      budget: {
        total: budgetTotal,
        spent: totalTrip,
        remaining: Math.max(0, budgetRemaining),
        overBy: Math.max(0, totalTrip - budgetTotal),
        percent: budgetPercent,
        isOver: isOverBudget
      }
    };
  }
}

window.TripCalculator = TripCalculator;
