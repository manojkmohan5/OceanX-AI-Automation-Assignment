export const metadata = {
  title: "Northstar Outfitters - OceanX Verified Connected Data Packet"
};

export default function NorthstarOutfittersSourcePage() {
  return (
    <main style={{ fontFamily: "Arial, sans-serif", lineHeight: 1.6, padding: 32, maxWidth: 920 }}>
      <h1>Northstar Outfitters - OceanX Verified Connected Data Packet</h1>
      <p>Sandbox connected source for OceanX AI underwriting demo. This page simulates connected bank, accounting, and e-commerce evidence.</p>

      <h2>Customer Summary</h2>
      <p>Company: Northstar Outfitters Ltd.</p>
      <p>Headquarters: United States.</p>
      <p>Industry: Apparel and consumer goods.</p>
      <p>Founded 2018.</p>
      <p>Business model: Imports physical goods from overseas suppliers and sells outdoor apparel, footwear, and travel accessories through e-commerce and wholesale channels.</p>
      <p>Import regions: Vietnam, China, and Portugal.</p>

      <h2>Data Coverage</h2>
      <p>Bank connected: Yes.</p>
      <p>Accounting connected: Yes.</p>
      <p>E-commerce connected: Yes.</p>
      <p>Uploads received: AP ledger, supplier invoices, purchase orders, KYC pack.</p>
      <p>Meeting notes: Yes.</p>
      <p>Direct debit mandate: Active.</p>

      <h2>Underwriting Metrics</h2>
      <p>Annual revenue: $6.4 million.</p>
      <p>Gross margin: 42%.</p>
      <p>Debt ratio: 4%.</p>
      <p>Cash runway: 9 months.</p>
      <p>Average daily balance: $220,000.</p>
      <p>Minimum daily balance: $92,000.</p>
      <p>Cash in bank: $710,000.</p>
      <p>Average monthly inflow: $680,000.</p>
      <p>Average monthly outflow: $510,000.</p>
      <p>Overdue AP: 8%.</p>
      <p>Inventory on hand: $1.1 million.</p>

      <h2>Operational Notes</h2>
      <p>Supplier payment terms average 45 days. Inventory turns every 4 months. No NSF events or overdrafts were observed in the connected bank packet.</p>
      <p>Requested facility: import finance and inventory finance for confirmed purchase orders, secured against stock where applicable.</p>
    </main>
  );
}
