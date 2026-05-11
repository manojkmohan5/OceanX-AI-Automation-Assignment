export const metadata = {
  title: "Global Logistics Group - OceanX Incomplete Data Packet"
};

export default function GlobalLogisticsSourcePage() {
  return (
    <main style={{ fontFamily: "Arial, sans-serif", lineHeight: 1.6, padding: 32, maxWidth: 920 }}>
      <h1>Global Logistics Group - OceanX Incomplete Data Packet</h1>
      <p>Sandbox source for OceanX AI underwriting demo. This page simulates a case where several critical verification sources are missing.</p>

      <h2>Customer Summary</h2>
      <p>Company: Global Logistics Group</p>
      <p>Headquarters: United States.</p>
      <p>Industry: Third-party logistics and distribution.</p>
      <p>Founded 2022 (Early stage).</p>
      <p>Business model: Distributes electronic components. Looking for financing to bridge gap between supplier payments and customer collections.</p>
      <p>Import regions: China, Taiwan.</p>

      <h2>Data Coverage</h2>
      <p>Bank connected: No.</p>
      <p>Accounting connected: No.</p>
      <p>E-commerce connected: No.</p>
      <p>Uploads received: Partial bank statements (PDFs), Unverified P&L.</p>
      <p>Meeting notes: Missing.</p>
      <p>Direct debit mandate: Pending.</p>

      <h2>Underwriting Metrics (Self-Reported)</h2>
      <p>Annual revenue: $850,000.</p>
      <p>Gross margin: 18%.</p>
      <p>Debt ratio: 45%.</p>
      <p>Cash runway: 1.5 months.</p>
      <p>Average daily balance: Missing.</p>
      <p>Minimum daily balance: Missing.</p>
      <p>Cash in bank: $12,000.</p>
      <p>Average monthly inflow: $70,000.</p>
      <p>Average monthly outflow: $68,000.</p>
      <p>Overdue AP: 32%.</p>
      <p>Inventory on hand: $150,000.</p>

      <h2>Operational Notes</h2>
      <p>The company is in an early growth phase and has not yet connected live data feeds. High debt ratio and low cash runway suggest high volatility. Overdue AP is significantly above the policy threshold of 10%.</p>
      <p>Requested facility: $200,000 revolving credit line.</p>
    </main>
  );
}
