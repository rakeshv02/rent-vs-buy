import { useState } from "react";

const fmt  = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtD = (n) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function App() {
  const [homePrice,    setHomePrice]    = useState("");
  const [downPct,      setDownPct]      = useState("20");
  const [mortgageRate, setMortgageRate] = useState("");
  const [loanYears,    setLoanYears]    = useState("30");
  const [rent,         setRent]         = useState("");
  const [stayYears,    setStayYears]    = useState("7");
  const [appreciation, setAppreciation] = useState("3");
  const [rentIncrease, setRentIncrease] = useState("3");
  const [propTax,      setPropTax]      = useState("1.2");
  const [maintenance,  setMaintenance]  = useState("1");
  const [result,       setResult]       = useState(null);

  const calculate = () => {
    const P  = parseFloat(homePrice);
    const dp = P * (parseFloat(downPct) / 100);
    const loan = P - dp;
    const r  = parseFloat(mortgageRate) / 100 / 12;
    const n  = parseFloat(loanYears) * 12;
    const stay = parseFloat(stayYears);
    const R  = parseFloat(rent);
    const appRate = parseFloat(appreciation) / 100;
    const rentRate = parseFloat(rentIncrease) / 100;
    const taxRate  = parseFloat(propTax) / 100;
    const maintRate = parseFloat(maintenance) / 100;

    if (!P || !loan || !r || !R || !stay) return;

    // Monthly mortgage
    const monthly = (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    // BUY costs over stay period
    let totalBuyCost = dp; // upfront down payment
    let remainingBalance = loan;
    let totalInterest = 0;

    for (let m = 1; m <= stay * 12; m++) {
      const intPayment = remainingBalance * r;
      const prinPayment = monthly - intPayment;
      remainingBalance = Math.max(0, remainingBalance - prinPayment);
      totalInterest += intPayment;
    }

    const annualTax   = P * taxRate;
    const annualMaint = P * maintRate;
    const closingCosts = P * 0.03; // ~3% closing costs
    const sellingCosts = P * Math.pow(1 + appRate, stay) * 0.06; // ~6% agent fees when selling

    const totalBuyPayments = monthly * stay * 12;
    const totalTax         = annualTax * stay;
    const totalMaint       = annualMaint * stay;
    const futureHomeValue  = P * Math.pow(1 + appRate, stay);
    const equity           = futureHomeValue - remainingBalance;
    const netBuyCost       = closingCosts + totalBuyPayments + totalTax + totalMaint + sellingCosts - equity;

    // RENT costs over stay period
    let totalRentCost = 0;
    let currentRent = R;
    for (let y = 0; y < stay; y++) {
      totalRentCost += currentRent * 12;
      currentRent *= (1 + rentRate);
    }
    // Opportunity cost of down payment (invested at 7%)
    const opportunityCost = dp * (Math.pow(1.07, stay) - 1);
    const netRentCost = totalRentCost + opportunityCost;

    // Break-even month estimate
    let buyCumulative = closingCosts + dp;
    let rentCumulative = 0;
    let breakEvenMonth = null;
    let mr = R;
    remainingBalance = loan;
    for (let m = 1; m <= stay * 12 + 120; m++) {
      const intP = remainingBalance * r;
      const prinP = monthly - intP;
      remainingBalance = Math.max(0, remainingBalance - prinP);
      const monthlyTax  = annualTax / 12;
      const monthlyMaint = annualMaint / 12;
      buyCumulative  += monthly + monthlyTax + monthlyMaint;
      const homeVal   = P * Math.pow(1 + appRate, m / 12);
      const eq        = homeVal - remainingBalance;
      const netBuyM   = buyCumulative - eq;
      rentCumulative += mr + (opportunityCost / (stay * 12));
      if (netBuyM < rentCumulative && breakEvenMonth === null) breakEvenMonth = m;
      if (m % 12 === 0) mr *= (1 + rentRate);
    }

    setResult({
      monthly, totalBuyCost: netBuyCost, totalRentCost: netRentCost,
      futureHomeValue, equity, totalInterest, closingCosts, sellingCosts,
      totalTax, totalMaint, breakEvenMonth, opportunityCost,
      winner: netBuyCost < netRentCost ? "buy" : "rent",
      savings: Math.abs(netBuyCost - netRentCost),
    });
  };

  const reset = () => { setHomePrice(""); setRent(""); setResult(null); };

  const inputStyle = { width: "100%", padding: "10px 14px", fontSize: "15px", border: "1.5px solid #e5e7eb", borderRadius: "10px", outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#fff" };
  const labelStyle = { display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em" };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@media print { .no-print { display:none!important; } }`}</style>

      <div className="no-print" style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "16px 24px" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a href="https://tabutility.com" style={{ fontSize: "15px", fontWeight: "700", color: "#6366f1", textDecoration: "none" }}>⌘ Tabutility</a>
          <button onClick={() => window.print()} style={{ padding: "8px 18px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>🖨️ Print / Save PDF</button>
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px" }}>
        <h1 style={{ fontSize: "30px", fontWeight: "900", color: "#0f172a", margin: "0 0 6px" }}>Rent vs Buy Calculator</h1>
        <p style={{ fontSize: "15px", color: "#6b7280", margin: "0 0 28px" }}>Find out whether renting or buying makes more financial sense for your situation.</p>

        {/* Inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          {/* Buy inputs */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <span style={{ fontSize: "20px" }}>🏠</span>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>Buying</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Home Price</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: "700" }}>$</span>
                  <input type="number" placeholder="e.g. 400000" value={homePrice} onChange={e => setHomePrice(e.target.value)} style={{ ...inputStyle, paddingLeft: "26px" }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Down Payment (%)</label>
                <div style={{ position: "relative" }}>
                  <input type="number" placeholder="20" value={downPct} onChange={e => setDownPct(e.target.value)} max="100" style={{ ...inputStyle, paddingRight: "30px" }} />
                  <span style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: "700" }}>%</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Mortgage Rate</label>
                <div style={{ position: "relative" }}>
                  <input type="number" placeholder="e.g. 6.5" value={mortgageRate} onChange={e => setMortgageRate(e.target.value)} step="0.01" style={{ ...inputStyle, paddingRight: "30px" }} />
                  <span style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: "700" }}>%</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Loan Term</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  {["15", "20", "30"].map(y => (
                    <button key={y} onClick={() => setLoanYears(y)} style={{ flex: 1, padding: "10px 4px", borderRadius: "8px", border: "1.5px solid", borderColor: loanYears === y ? "#6366f1" : "#e5e7eb", background: loanYears === y ? "#6366f1" : "#fff", color: loanYears === y ? "#fff" : "#374151", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>{y}yr</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Property Tax Rate</label>
                <div style={{ position: "relative" }}>
                  <input type="number" placeholder="1.2" value={propTax} onChange={e => setPropTax(e.target.value)} step="0.1" style={{ ...inputStyle, paddingRight: "30px" }} />
                  <span style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: "700" }}>%</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Home Appreciation</label>
                <div style={{ position: "relative" }}>
                  <input type="number" placeholder="3" value={appreciation} onChange={e => setAppreciation(e.target.value)} step="0.1" style={{ ...inputStyle, paddingRight: "30px" }} />
                  <span style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: "700" }}>%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rent inputs */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <span style={{ fontSize: "20px" }}>🏢</span>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>Renting</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Monthly Rent</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: "700" }}>$</span>
                  <input type="number" placeholder="e.g. 2000" value={rent} onChange={e => setRent(e.target.value)} style={{ ...inputStyle, paddingLeft: "26px" }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Annual Rent Increase</label>
                <div style={{ position: "relative" }}>
                  <input type="number" placeholder="3" value={rentIncrease} onChange={e => setRentIncrease(e.target.value)} step="0.1" style={{ ...inputStyle, paddingRight: "30px" }} />
                  <span style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: "700" }}>%</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>How Long You'll Stay</label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {["3", "5", "7", "10", "15"].map(y => (
                    <button key={y} onClick={() => setStayYears(y)} style={{ flex: "1 1 40px", padding: "10px 4px", borderRadius: "8px", border: "1.5px solid", borderColor: stayYears === y ? "#6366f1" : "#e5e7eb", background: stayYears === y ? "#6366f1" : "#fff", color: stayYears === y ? "#fff" : "#374151", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>{y}yr</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "24px", padding: "14px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #86efac" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#15803d", marginBottom: "4px" }}>💡 Opportunity Cost</div>
              <div style={{ fontSize: "12px", color: "#16a34a", lineHeight: "1.5" }}>
                Down payment invested in index funds (7% avg) is counted in the rent comparison — giving you an apples-to-apples comparison.
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          <button onClick={calculate} disabled={!homePrice || !mortgageRate || !rent} style={{ flex: 1, padding: "13px", background: (!homePrice || !mortgageRate || !rent) ? "#e5e7eb" : "#6366f1", color: (!homePrice || !mortgageRate || !rent) ? "#9ca3af" : "#fff", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: "pointer" }}>
            Compare Rent vs Buy
          </button>
          <button onClick={reset} style={{ padding: "13px 20px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>Reset</button>
        </div>

        {result && (
          <>
            {/* Winner banner */}
            <div style={{ background: result.winner === "buy" ? "linear-gradient(135deg, #1e3a5f, #1d4ed8)" : "linear-gradient(135deg, #14532d, #16a34a)", borderRadius: "20px", padding: "28px", marginBottom: "16px", textAlign: "center", color: "#fff" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>{result.winner === "buy" ? "🏠" : "🏢"}</div>
              <div style={{ fontSize: "22px", fontWeight: "900" }}>
                {result.winner === "buy" ? "Buying is better" : "Renting is better"} in {stayYears} years
              </div>
              <div style={{ fontSize: "16px", color: "rgba(255,255,255,0.8)", marginTop: "6px" }}>
                You save <strong style={{ color: "#fff" }}>${fmt(result.savings)}</strong> by {result.winner === "buy" ? "buying" : "renting"}
              </div>
              {result.breakEvenMonth && (
                <div style={{ marginTop: "12px", display: "inline-block", background: "rgba(255,255,255,0.15)", borderRadius: "999px", padding: "6px 16px", fontSize: "13px" }}>
                  Break-even point: {Math.floor(result.breakEvenMonth / 12)}yr {result.breakEvenMonth % 12}mo
                </div>
              )}
            </div>

            {/* Side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              {[
                {
                  label: "🏠 Total Cost to Buy", color: "#1d4ed8", bg: "#eff6ff",
                  rows: [
                    { label: "Down Payment", value: fmt(parseFloat(homePrice) * (parseFloat(downPct) / 100)) },
                    { label: "Closing Costs (~3%)", value: fmt(result.closingCosts) },
                    { label: "Mortgage Payments", value: fmt(result.monthly * parseFloat(stayYears) * 12) },
                    { label: "Property Tax", value: fmt(result.totalTax) },
                    { label: "Maintenance", value: fmt(result.totalMaint) },
                    { label: "Selling Costs (~6%)", value: fmt(result.sellingCosts) },
                    { label: "Less: Home Equity", value: `− $${fmt(result.equity)}`, highlight: true },
                  ],
                  total: result.totalBuyCost,
                },
                {
                  label: "🏢 Total Cost to Rent", color: "#16a34a", bg: "#f0fdf4",
                  rows: [
                    { label: "Total Rent Paid", value: fmt(result.totalRentCost - result.opportunityCost) },
                    { label: "Opportunity Cost", value: fmt(result.opportunityCost) },
                  ],
                  total: result.totalRentCost,
                },
              ].map(col => (
                <div key={col.label} style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: col.color, marginBottom: "14px" }}>{col.label}</div>
                  {col.rows.map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                      <span style={{ fontSize: "13px", color: row.highlight ? "#16a34a" : "#6b7280" }}>{row.label}</span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: row.highlight ? "#16a34a" : "#111827" }}>{row.highlight ? row.value : `$${row.value}`}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "800" }}>Net Cost</span>
                    <span style={{ fontSize: "18px", fontWeight: "900", color: col.color }}>${fmt(col.total)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Monthly breakdown */}
            <div style={{ background: "#fff", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: "32px" }}>
              <h2 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: "800" }}>Monthly Payment Comparison (Year 1)</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ padding: "14px", background: "#eff6ff", borderRadius: "10px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#1d4ed8", marginBottom: "6px" }}>🏠 Buying</div>
                  <div style={{ fontSize: "22px", fontWeight: "900", color: "#1d4ed8" }}>${fmtD(result.monthly + (parseFloat(homePrice) * parseFloat(propTax) / 100 / 12))}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>mortgage + tax</div>
                </div>
                <div style={{ padding: "14px", background: "#f0fdf4", borderRadius: "10px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#16a34a", marginBottom: "6px" }}>🏢 Renting</div>
                  <div style={{ fontSize: "22px", fontWeight: "900", color: "#16a34a" }}>${fmtD(parseFloat(rent))}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>current monthly rent</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Resources */}
        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: "32px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "800" }}>🏡 Useful Resources</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            {[
              { label: "Today's Mortgage Rates", url: "https://www.bankrate.com/mortgages/mortgage-rates/", source: "Bankrate" },
              { label: "Homes For Sale", url: "https://www.zillow.com", source: "Zillow" },
              { label: "Rental Listings", url: "https://www.apartments.com", source: "Apartments.com" },
              { label: "First-Time Buyer Guide", url: "https://www.consumerfinance.gov/owning-a-home/", source: "CFPB" },
            ].map(r => (
              <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "14px", background: "#f9fafb", borderRadius: "10px", border: "1px solid #e5e7eb", textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.background = "#f5f3ff"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#f9fafb"; }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "3px" }}>{r.label}</div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#6366f1", textTransform: "uppercase" }}>via {r.source} →</div>
              </a>
            ))}
          </div>
        </div>

        <div className="no-print" style={{ textAlign: "center" }}>
          <a href="https://tabutility.com" style={{ fontSize: "14px", color: "#6366f1", textDecoration: "none", fontWeight: "600" }}>← Back to all free tools</a>
        </div>
      </div>
    </div>
  );
}
