import React, { useState, useEffect } from 'react';
import { useReportsStore } from '../../store/useReportsStore';
import { reportsApi } from '../../services/reportsApi';

export const SamplePreviewModal: React.FC = () => {
  const samplePreview = useReportsStore((state) => state.samplePreview);
  const closeSample = useReportsStore((state) => state.closeSample);
  const showToast = useReportsStore((state) => state.showToast);

  const [activeTabIdx, setActiveTabIdx] = useState(0);

  const previewType = samplePreview?.type;

  useEffect(() => {
    setActiveTabIdx(0);
  }, [previewType]);

  if (!samplePreview || !samplePreview.open) return null;

  const { type: sampleType, title } = samplePreview;

  const SAMP_TABS: Record<string, { label: string; key: string }[]> = {
    allorders: [{ label: 'Sample Data', key: 'ao' }],
    fwdintransit: [{ label: 'Sample Data', key: 'it' }],
    ndr: [{ label: 'Sample Data', key: 'ndr' }],
    productwise: [{ label: 'Sample Data', key: 'pw' }],
    performance: [
      { label: 'Overall Delivery', key: 'perf_overall' },
      { label: 'Prepaid / COD', key: 'perf_cod' },
      { label: 'SLA Performance', key: 'perf_sla' },
      { label: 'Attemptwise', key: 'perf_attempt' },
      { label: 'Statewise', key: 'perf_state' },
      { label: 'RTO Reasons', key: 'perf_rto' }
    ]
  };

  const FILENAME_MAP: Record<string, string> = {
    allorders: 'All_Orders_Sample_Report.xlsx',
    fwdintransit: 'FWD_InTransit_Orders_Report.xlsx',
    ndr: 'NDR_Report_Sample.xlsx',
    productwise: 'Product_Wise_Summary_Report.csv',
    performance: 'Sample_Performance_Reports.xlsx',
  };
  const sampleFilename = FILENAME_MAP[sampleType] || `Sample_${sampleType}_report.xlsx`;

  const tabs = SAMP_TABS[sampleType] || [];
  const currentTab = tabs[activeTabIdx] || tabs[0] || { key: 'ao' };

  const handleDownload = async () => {
    showToast(`⬇ Preparing "Sample Report"…`);
    try {
      const key = currentTab.key;
      let headers: string[] = [];
      let rows: string[][] = [];

      if (key === 'ao') {
        headers = ['AWB Number', 'Order Date', 'Amount', 'Payment', 'Name', 'Address', 'Contact', 'Weight', 'Status', 'Shipping Chrg.', 'Discount', 'Product'];
        rows = [
          ['XB666937844', '19/04/2026', 'Rs.1,600', 'PREPAID', 'Amit Verma', 'Pune 411001 to Kolkata 700001', '9188456388', '1.0 kg', 'Pickup Scheduled', 'Rs.91', 'Rs.408', 'Whey Protein Combo'],
          ['XB999679763', '23/04/2026', 'Rs.4,606', 'COD', 'Karan Patel', 'Delhi 110001 to Hyderabad 500001', '9648036479', '0.5 kg', 'Pickup Not Scheduled', 'Rs.106', 'Rs.461', 'Whey Protein Combo'],
          ['XB931924341', '15/04/2026', 'Rs.2,353', 'PREPAID', 'Amit Verma', 'Bangalore 560001 to Hyderabad 500001', '9371423823', '4.0 kg', 'In-Transit', 'Rs.53', 'Rs.224', 'Protein Powder 1kg'],
          ['XB637899121', '16/04/2026', 'Rs.3,655', 'COD', 'Rahul Sharma', 'Bangalore 560001 to Chennai 600001', '9615756698', '2.0 kg', 'Delivered', 'Rs.55', 'Rs.35', 'Protein Powder 1kg'],
          ['XB185659046', '22/04/2026', 'Rs.3,454', 'COD', 'Sneha Joshi', 'Bangalore 560001 to Kolkata 700001', '9358221973', '4.0 kg', 'RTO', 'Rs.171', 'Rs.396', 'Protein Powder 1kg'],
          ['XB891115231', '10/04/2026', 'Rs.4,798', 'COD', 'Sneha Joshi', 'Bangalore 560001 to Chennai 600001', '9843130364', '5.0 kg', 'RTO', 'Rs.120', 'Rs.24', 'Mass Gainer 2kg'],
          ['XB550850041', '10/04/2026', 'Rs.2,308', 'PREPAID', 'Karan Patel', 'Mumbai 400001 to Hyderabad 500001', '9667234179', '3.0 kg', 'In-Transit', 'Rs.163', 'Rs.135', 'Vitamin Gummies'],
        ];
      } else if (key === 'it') {
        headers = ['AWB No.', 'Order ID', 'Address', 'Status', 'EDD', 'Days In-Transit'];
        rows = [
          ['XB293321676', 'ORD94874', 'Bangalore 560001 to Kolkata 700001', 'Ontime', '26/04/2026', '7 days'],
          ['XB372161168', 'ORD39251', 'Bangalore 560001 to Ahmedabad 380001', 'Delayed', '04/04/2026', '7 days'],
          ['XB389212598', 'ORD18382', 'Delhi 110001 to Ahmedabad 380001', 'Delayed', '25/04/2026', '6 days'],
          ['XB420063942', 'ORD52017', 'Pune 411001 to Ahmedabad 380001', 'Ontime', '07/04/2026', '3 days'],
          ['XB940076390', 'ORD38912', 'Bangalore 560001 to Ahmedabad 380001', 'Ontime', '22/04/2026', '7 days'],
          ['XB827822276', 'ORD16674', 'Delhi 110001 to Hyderabad 500001', 'Ontime', '01/05/2026', '2 days'],
          ['XB406803674', 'ORD32487', 'Delhi 110001 to Chennai 600001', 'Delayed', '08/04/2026', '6 days'],
          ['XB785898879', 'ORD25229', 'Delhi 110001 to Hyderabad 500001', 'Delayed', '19/04/2026', '7 days'],
        ];
      } else if (key === 'ndr') {
        headers = ['Order / AWB', 'Delivery Address', 'Shipment Type', 'Attempts', 'NDR Reason', 'Payment', 'Last Updated', 'Last Action By', 'Action Priority'];
        rows = [
          ['ORD59723 / XB199329026', 'Mumbai 400001', 'XPRESSBEES Air', '5', 'Future Delivery Requested', 'Rs.4,651 - PREPAID', '10/04/2026', 'Seller', 'No-Action Required'],
          ['ORD70093 / XB414479272', 'Delhi 110001', 'XPRESSBEES Air', '3', 'Address Incomplete', 'Rs.2,004 - COD', '19/04/2026', 'XpressBees', 'Critical Action Required'],
          ['ORD58933 / XB917336369', 'Hyderabad 500001', 'XPRESSBEES Air', '3', 'Customer Refused', 'Rs.2,141 - COD', '26/04/2026', 'XpressBees', 'Action Required'],
          ['ORD86903 / XB150226877', 'Pune 411001', 'XPRESSBEES Surface', '3', 'Customer Refused', 'Rs.2,773 - COD', '22/04/2026', 'Seller', 'No-Action Required'],
          ['ORD25891 / XB891711905', 'Delhi 110001', 'XPRESSBEES Surface', '1', 'Incorrect Pincode', 'Rs.2,641 - PREPAID', '16/04/2026', 'XpressBees', 'Critical Action Required'],
          ['ORD69063 / XB845379411', 'Pune 411001', 'XPRESSBEES Air', '5', 'Customer Not Available', 'Rs.3,182 - PREPAID', '13/04/2026', 'Seller', 'Action Required'],
          ['ORD22039 / XB502719388', 'Mumbai 400001', 'XPRESSBEES Air', '4', 'Customer Refused', 'Rs.3,147 - COD', '30/04/2026', 'XpressBees', 'No-Action Required'],
        ];
      } else if (key === 'pw') {
        headers = ['Product Name', 'Product SKU', 'Total Order Qty', 'Booked', 'Pending Pickup', 'In Transit', 'Delivered', 'RTO'];
        rows = [
          ['Whey Protein Combo', 'SKU-WPC-001', '42', '8', '6', '12', '14', '2'],
          ['Protein Powder 1kg', 'SKU-PP1-002', '38', '5', '4', '10', '17', '2'],
          ['Mass Gainer 2kg', 'SKU-MG2-003', '29', '3', '5', '8', '11', '2'],
          ['Yoga Mat', 'SKU-YM-004', '24', '2', '3', '6', '11', '2'],
          ['Vitamin Gummies', 'SKU-VG-005', '18', '1', '2', '5', '8', '2'],
          ['TOTAL', '-', '151', '19', '20', '41', '61', '10']
        ];
      } else if (key === 'perf_overall') {
        headers = ['Zone', 'Delivered', 'LOST', 'RTO', 'Shipped', 'STD', 'Grand Total', 'Delivered %', 'RTO %'];
        rows = [
          ['Rest Of India', '2,150', '10', '610', '95', '5', '2,870', '75%', '21%'],
          ['Regional', '920', '5', '220', '45', '1', '1,191', '77%', '18%'],
          ['Within City', '225', '1', '25', '5', '0', '256', '88%', '10%'],
          ['TOTAL', '3,825', '18', '925', '163', '6', '4,937', '77%', '19%']
        ];
      } else if (key === 'perf_cod') {
        headers = ['Payment Mode', 'Delivered', 'LOST', 'RTO', 'Grand Total', 'Delivered %', 'RTO %'];
        rows = [
          ['COD', '2,100', '18', '860', '3,098', '68%', '28%'],
          ['PREPAID', '1,725', '2', '65', '1,902', '91%', '3%'],
          ['TOTAL', '3,825', '20', '925', '5,000', '76.5%', '18.5%']
        ];
      } else if (key === 'perf_sla') {
        headers = ['Zone', 'Ontime', 'Beyond SLA', 'RTO/UD', 'Grand Total', 'Ontime %', 'Beyond SLA %'];
        rows = [
          ['Rest Of India', '1,820', '410', '640', '2,870', '63%', '14%'],
          ['Regional', '780', '160', '251', '1,191', '65%', '13%'],
          ['TOTAL', '3,070', '630', '981', '4,681', '65%', '13%']
        ];
      } else if (key === 'perf_attempt') {
        headers = ['Zone', '1st Attempt', '2nd Attempt', '3rd Attempt', '>3 Attempts', 'RTO/UD', 'Grand Total'];
        rows = [
          ['Rest Of India', '1,700', '320', '95', '25', '730', '2,870'],
          ['Regional', '690', '135', '42', '9', '315', '1,191'],
          ['TOTAL', '2,810', '510', '149', '36', '1,176', '4,681']
        ];
      } else if (key === 'perf_state') {
        headers = ['State', 'Delivered', 'LOST', 'RTO', 'Grand Total', 'Delivered %', 'S2A', 'S2D', 'FAD'];
        rows = [
          ['MAHARASHTRA', '820', '2', '180', '1,022', '80%', '95%', '74%', '72%'],
          ['KARNATAKA', '520', '3', '130', '668', '78%', '94%', '72%', '70%'],
          ['DELHI', '465', '1', '95', '571', '81%', '97%', '75%', '74%'],
          ['TOTAL', '2,195', '10', '555', '2,817', '78%', '94%', '72%', '69%']
        ];
      } else if (key === 'perf_rto') {
        headers = ['NDR Reason', '0', '1', '2', '3', '4', '>5', 'Grand Total', 'Contribution %'];
        rows = [
          ['OTP Verified', '40', '160', '420', '140', '30', '5', '795', '35%'],
          ['Customer Not Available', '20', '110', '310', '90', '15', '3', '548', '24%'],
          ['Customer Refused', '5', '25', '110', '40', '10', '1', '191', '8%'],
          ['TOTAL', '68', '313', '915', '294', '59', '9', '1,658', '72%']
        ];
      }

      if (headers.length === 0) {
        showToast('❌ No sample data found');
        return;
      }

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const csvFilename = sampleFilename.replace('.xlsx', '.csv');
      link.setAttribute('download', csvFilename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`✓ "Sample Report" downloaded`);
    } catch {
      showToast('❌ Download failed');
    }
  };

  const renderTableContent = () => {
    const key = currentTab.key;
    if (key === 'ao') {
      const aoRows: string[][] = [
        ['XB666937844', '19/04/2026', 'Rs.1,600', 'PREPAID', 'Amit Verma', 'Pune 411001 to Kolkata 700001', '9188456388', '1.0 kg', 'Pickup Scheduled', 'Rs.91', 'Rs.408', 'Whey Protein Combo'],
        ['XB999679763', '23/04/2026', 'Rs.4,606', 'COD', 'Karan Patel', 'Delhi 110001 to Hyderabad 500001', '9648036479', '0.5 kg', 'Pickup Not Scheduled', 'Rs.106', 'Rs.461', 'Whey Protein Combo'],
        ['XB931924341', '15/04/2026', 'Rs.2,353', 'PREPAID', 'Amit Verma', 'Bangalore 560001 to Hyderabad 500001', '9371423823', '4.0 kg', 'In-Transit', 'Rs.53', 'Rs.224', 'Protein Powder 1kg'],
        ['XB637899121', '16/04/2026', 'Rs.3,655', 'COD', 'Rahul Sharma', 'Bangalore 560001 to Chennai 600001', '9615756698', '2.0 kg', 'Delivered', 'Rs.55', 'Rs.35', 'Protein Powder 1kg'],
        ['XB185659046', '22/04/2026', 'Rs.3,454', 'COD', 'Sneha Joshi', 'Bangalore 560001 to Kolkata 700001', '9358221973', '4.0 kg', 'RTO', 'Rs.171', 'Rs.396', 'Protein Powder 1kg'],
        ['XB891115231', '10/04/2026', 'Rs.4,798', 'COD', 'Sneha Joshi', 'Bangalore 560001 to Chennai 600001', '9843130364', '5.0 kg', 'RTO', 'Rs.120', 'Rs.24', 'Mass Gainer 2kg'],
        ['XB550850041', '10/04/2026', 'Rs.2,308', 'PREPAID', 'Karan Patel', 'Mumbai 400001 to Hyderabad 500001', '9667234179', '3.0 kg', 'In-Transit', 'Rs.163', 'Rs.135', 'Vitamin Gummies'],
      ];
      return (
        <table className="stbl-s">
          <thead>
            <tr>
              <th>AWB Number</th>
              <th>Order Date</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Name</th>
              <th>Address</th>
              <th>Contact</th>
              <th>Weight</th>
              <th>Status</th>
              <th>Shipping Chrg.</th>
              <th>Discount</th>
              <th>Product</th>
            </tr>
          </thead>
          <tbody>
            {aoRows.map((row, idx) => (
              <tr key={idx}>
                {row.map((cell, j) => (
                  <td key={j} style={j === 0 ? { fontFamily: 'var(--mono)' } : undefined}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (key === 'it') {
      const itRows: Array<{ awb: string; orderId: string; address: string; status: 'Ontime' | 'Delayed'; edd: string; days: string }> = [
        { awb: 'XB293321676', orderId: 'ORD94874', address: 'Bangalore 560001 to Kolkata 700001', status: 'Ontime', edd: '26/04/2026', days: '7 days' },
        { awb: 'XB372161168', orderId: 'ORD39251', address: 'Bangalore 560001 to Ahmedabad 380001', status: 'Delayed', edd: '04/04/2026', days: '7 days' },
        { awb: 'XB389212598', orderId: 'ORD18382', address: 'Delhi 110001 to Ahmedabad 380001', status: 'Delayed', edd: '25/04/2026', days: '6 days' },
        { awb: 'XB420063942', orderId: 'ORD52017', address: 'Pune 411001 to Ahmedabad 380001', status: 'Ontime', edd: '07/04/2026', days: '3 days' },
        { awb: 'XB940076390', orderId: 'ORD38912', address: 'Bangalore 560001 to Ahmedabad 380001', status: 'Ontime', edd: '22/04/2026', days: '7 days' },
        { awb: 'XB827822276', orderId: 'ORD16674', address: 'Delhi 110001 to Hyderabad 500001', status: 'Ontime', edd: '01/05/2026', days: '2 days' },
        { awb: 'XB406803674', orderId: 'ORD32487', address: 'Delhi 110001 to Chennai 600001', status: 'Delayed', edd: '08/04/2026', days: '6 days' },
        { awb: 'XB785898879', orderId: 'ORD25229', address: 'Delhi 110001 to Hyderabad 500001', status: 'Delayed', edd: '19/04/2026', days: '7 days' },
      ];
      return (
        <table className="stbl-s">
          <thead>
            <tr>
              <th>AWB No.</th>
              <th>Order ID</th>
              <th>Address</th>
              <th>Status</th>
              <th>EDD</th>
              <th>Days In-Transit</th>
            </tr>
          </thead>
          <tbody>
            {itRows.map((r) => (
              <tr key={r.awb}>
                <td style={{ fontFamily: 'var(--mono)' }}>{r.awb}</td>
                <td>{r.orderId}</td>
                <td>{r.address}</td>
                <td>
                  <span style={{ color: r.status === 'Ontime' ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                    {r.status}
                  </span>
                </td>
                <td>{r.edd}</td>
                <td>{r.days}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (key === 'ndr') {
      const ndrRows: Array<{
        orderAwb: string;
        address: string;
        shipType: string;
        attempts: string;
        reason: string;
        payment: string;
        updated: string;
        actionBy: string;
        priority: 'Critical Action Required' | 'Action Required' | 'No-Action Required';
      }> = [
        { orderAwb: 'ORD59723 / XB199329026', address: 'Mumbai 400001', shipType: 'XPRESSBEES Air', attempts: '5', reason: 'Future Delivery Requested', payment: 'Rs.4,651 - PREPAID', updated: '10/04/2026', actionBy: 'Seller', priority: 'No-Action Required' },
        { orderAwb: 'ORD70093 / XB414479272', address: 'Delhi 110001', shipType: 'XPRESSBEES Air', attempts: '3', reason: 'Address Incomplete', payment: 'Rs.2,004 - COD', updated: '19/04/2026', actionBy: 'XpressBees', priority: 'Critical Action Required' },
        { orderAwb: 'ORD58933 / XB917336369', address: 'Hyderabad 500001', shipType: 'XPRESSBEES Air', attempts: '3', reason: 'Customer Refused', payment: 'Rs.2,141 - COD', updated: '26/04/2026', actionBy: 'XpressBees', priority: 'Action Required' },
        { orderAwb: 'ORD86903 / XB150226877', address: 'Pune 411001', shipType: 'XPRESSBEES Surface', attempts: '3', reason: 'Customer Refused', payment: 'Rs.2,773 - COD', updated: '22/04/2026', actionBy: 'Seller', priority: 'No-Action Required' },
        { orderAwb: 'ORD25891 / XB891711905', address: 'Delhi 110001', shipType: 'XPRESSBEES Surface', attempts: '1', reason: 'Incorrect Pincode', payment: 'Rs.2,641 - PREPAID', updated: '16/04/2026', actionBy: 'XpressBees', priority: 'Critical Action Required' },
        { orderAwb: 'ORD69063 / XB845379411', address: 'Pune 411001', shipType: 'XPRESSBEES Air', attempts: '5', reason: 'Customer Not Available', payment: 'Rs.3,182 - PREPAID', updated: '13/04/2026', actionBy: 'Seller', priority: 'Action Required' },
        { orderAwb: 'ORD22039 / XB502719388', address: 'Mumbai 400001', shipType: 'XPRESSBEES Air', attempts: '4', reason: 'Customer Refused', payment: 'Rs.3,147 - COD', updated: '30/04/2026', actionBy: 'XpressBees', priority: 'No-Action Required' },
      ];
      return (
        <table className="stbl-s">
          <thead>
            <tr>
              <th>Order / AWB</th>
              <th>Delivery Address</th>
              <th>Shipment Type</th>
              <th>Attempts</th>
              <th>NDR Reason</th>
              <th>Payment</th>
              <th>Last Updated</th>
              <th>Last Action By</th>
              <th>Action Priority</th>
            </tr>
          </thead>
          <tbody>
            {ndrRows.map((r) => (
              <tr key={r.orderAwb}>
                <td>{r.orderAwb}</td>
                <td>{r.address}</td>
                <td>{r.shipType}</td>
                <td>{r.attempts}</td>
                <td>{r.reason}</td>
                <td>{r.payment}</td>
                <td>{r.updated}</td>
                <td>{r.actionBy}</td>
                <td>
                  {r.priority === 'Critical Action Required' ? (
                    <span style={{ color: 'var(--red)', fontWeight: 600 }}>{r.priority}</span>
                  ) : (
                    r.priority
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (key === 'pw') {
      const pwRows: Array<[string, string, string, string, string, string, string, string]> = [
        ['Whey Protein Combo', 'SKU-WPC-001', '42', '8', '6', '12', '14', '2'],
        ['Protein Powder 1kg', 'SKU-PP1-002', '38', '5', '4', '10', '17', '2'],
        ['Mass Gainer 2kg', 'SKU-MG2-003', '29', '3', '5', '8', '11', '2'],
        ['Yoga Mat', 'SKU-YM-004', '24', '2', '3', '6', '11', '2'],
        ['Vitamin Gummies', 'SKU-VG-005', '18', '1', '2', '5', '8', '2'],
      ];
      return (
        <table className="stbl-s">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Product SKU</th>
              <th>Total Order Qty</th>
              <th>Booked</th>
              <th>Pending Pickup</th>
              <th>In Transit</th>
              <th>Delivered</th>
              <th>RTO</th>
            </tr>
          </thead>
          <tbody>
            {pwRows.map((row) => (
              <tr key={row[1]}>
                {row.map((cell, idx) => (
                  <td key={idx}>{idx === 0 ? <b>{cell}</b> : cell}</td>
                ))}
              </tr>
            ))}
            <tr className="total-row">
              <td><b>TOTAL</b></td>
              <td>-</td>
              <td><b>151</b></td>
              <td><b>19</b></td>
              <td><b>20</b></td>
              <td><b>41</b></td>
              <td><b>61</b></td>
              <td><b>10</b></td>
            </tr>
          </tbody>
        </table>
      );
    } else if (key === 'perf_overall') {
      return (
        <table className="stbl-s">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Delivered</th>
              <th>LOST</th>
              <th>RTO</th>
              <th>Shipped</th>
              <th>STD</th>
              <th>Grand Total</th>
              <th>Delivered %</th>
              <th>RTO %</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rest Of India</td>
              <td>2,150</td>
              <td>10</td>
              <td>610</td>
              <td>95</td>
              <td>5</td>
              <td>2,870</td>
              <td>75%</td>
              <td>21%</td>
            </tr>
            <tr>
              <td>Regional</td>
              <td>920</td>
              <td>5</td>
              <td>220</td>
              <td>45</td>
              <td>1</td>
              <td>1,191</td>
              <td>77%</td>
              <td>18%</td>
            </tr>
            <tr>
              <td>Within City</td>
              <td>225</td>
              <td>1</td>
              <td>25</td>
              <td>5</td>
              <td>0</td>
              <td>256</td>
              <td>88%</td>
              <td>10%</td>
            </tr>
            <tr className="total-row">
              <td>TOTAL</td>
              <td>3,825</td>
              <td>18</td>
              <td>925</td>
              <td>163</td>
              <td>6</td>
              <td>4,937</td>
              <td>77%</td>
              <td>19%</td>
            </tr>
          </tbody>
        </table>
      );
    } else if (key === 'perf_cod') {
      return (
        <table className="stbl-s">
          <thead>
            <tr>
              <th>Payment Mode</th>
              <th>Delivered</th>
              <th>LOST</th>
              <th>RTO</th>
              <th>Grand Total</th>
              <th>Delivered %</th>
              <th>RTO %</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>COD</td>
              <td>2,100</td>
              <td>18</td>
              <td>860</td>
              <td>3,098</td>
              <td>68%</td>
              <td>28%</td>
            </tr>
            <tr>
              <td>PREPAID</td>
              <td>1,725</td>
              <td>2</td>
              <td>65</td>
              <td>1,902</td>
              <td>91%</td>
              <td>3%</td>
            </tr>
            <tr className="total-row">
              <td>TOTAL</td>
              <td>3,825</td>
              <td>20</td>
              <td>925</td>
              <td>5,000</td>
              <td>76.5%</td>
              <td>18.5%</td>
            </tr>
          </tbody>
        </table>
      );
    } else if (key === 'perf_sla') {
      return (
        <table className="stbl-s">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Ontime</th>
              <th>Beyond SLA</th>
              <th>RTO/UD</th>
              <th>Grand Total</th>
              <th>Ontime %</th>
              <th>Beyond SLA %</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rest Of India</td>
              <td>1,820</td>
              <td>410</td>
              <td>640</td>
              <td>2,870</td>
              <td>63%</td>
              <td>14%</td>
            </tr>
            <tr>
              <td>Regional</td>
              <td>780</td>
              <td>160</td>
              <td>251</td>
              <td>1,191</td>
              <td>65%</td>
              <td>13%</td>
            </tr>
            <tr className="total-row">
              <td>TOTAL</td>
              <td>3,070</td>
              <td>630</td>
              <td>981</td>
              <td>4,681</td>
              <td>65%</td>
              <td>13%</td>
            </tr>
          </tbody>
        </table>
      );
    } else if (key === 'perf_attempt') {
      return (
        <table className="stbl-s">
          <thead>
            <tr>
              <th>Zone</th>
              <th>1st Attempt</th>
              <th>2nd Attempt</th>
              <th>3rd Attempt</th>
              <th>&gt;3 Attempts</th>
              <th>RTO/UD</th>
              <th>Grand Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rest Of India</td>
              <td>1,700</td>
              <td>320</td>
              <td>95</td>
              <td>25</td>
              <td>730</td>
              <td>2,870</td>
            </tr>
            <tr>
              <td>Regional</td>
              <td>690</td>
              <td>135</td>
              <td>42</td>
              <td>9</td>
              <td>315</td>
              <td>1,191</td>
            </tr>
            <tr className="total-row">
              <td>TOTAL</td>
              <td>2,810</td>
              <td>510</td>
              <td>149</td>
              <td>36</td>
              <td>1,176</td>
              <td>4,681</td>
            </tr>
          </tbody>
        </table>
      );
    } else if (key === 'perf_state') {
      return (
        <table className="stbl-s">
          <thead>
            <tr>
              <th>State</th>
              <th>Delivered</th>
              <th>LOST</th>
              <th>RTO</th>
              <th>Grand Total</th>
              <th>Delivered %</th>
              <th>S2A</th>
              <th>S2D</th>
              <th>FAD</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>MAHARASHTRA</td>
              <td>820</td>
              <td>2</td>
              <td>180</td>
              <td>1,022</td>
              <td>80%</td>
              <td>95%</td>
              <td>74%</td>
              <td>72%</td>
            </tr>
            <tr>
              <td>KARNATAKA</td>
              <td>520</td>
              <td>3</td>
              <td>130</td>
              <td>668</td>
              <td>78%</td>
              <td>94%</td>
              <td>72%</td>
              <td>70%</td>
            </tr>
            <tr>
              <td>DELHI</td>
              <td>465</td>
              <td>1</td>
              <td>95</td>
              <td>571</td>
              <td>81%</td>
              <td>97%</td>
              <td>75%</td>
              <td>74%</td>
            </tr>
            <tr className="total-row">
              <td>TOTAL</td>
              <td>2,195</td>
              <td>10</td>
              <td>555</td>
              <td>2,817</td>
              <td>78%</td>
              <td>94%</td>
              <td>72%</td>
              <td>69%</td>
            </tr>
          </tbody>
        </table>
      );
    } else if (key === 'perf_rto') {
      return (
        <table className="stbl-s">
          <thead>
            <tr>
              <th>NDR Reason</th>
              <th>0</th>
              <th>1</th>
              <th>2</th>
              <th>3</th>
              <th>4</th>
              <th>&gt;5</th>
              <th>Grand Total</th>
              <th>Contribution %</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>OTP Verified</td>
              <td>40</td>
              <td>160</td>
              <td>420</td>
              <td>140</td>
              <td>30</td>
              <td>5</td>
              <td>795</td>
              <td>35%</td>
            </tr>
            <tr>
              <td>Customer Not Available</td>
              <td>20</td>
              <td>110</td>
              <td>310</td>
              <td>90</td>
              <td>15</td>
              <td>3</td>
              <td>548</td>
              <td>24%</td>
            </tr>
            <tr>
              <td>Customer Refused</td>
              <td>5</td>
              <td>25</td>
              <td>110</td>
              <td>40</td>
              <td>10</td>
              <td>1</td>
              <td>191</td>
              <td>8%</td>
            </tr>
            <tr className="total-row">
              <td>TOTAL</td>
              <td>68</td>
              <td>313</td>
              <td>915</td>
              <td>294</td>
              <td>59</td>
              <td>9</td>
              <td>1,658</td>
              <td>72%</td>
            </tr>
          </tbody>
        </table>
      );
    }
    return null;
  };

  return (
    <div
      className={`mo-ov ${samplePreview.open ? 'sh' : ''}`}
      onClick={(e) => e.target === e.currentTarget && closeSample()}
    >
      <div className="samp-mo" id="sampMo">
        <div className="samp-mo-hdr">
          <div>
            <div className="samp-mo-title" id="sampMoTitle">
              {title} — Sample Preview
            </div>
            <div className="samp-mo-sub" id="sampMoSub">
              Representative sample data. Actual export will reflect your selected date range.
            </div>
          </div>
          <div className="mo-x" onClick={closeSample}>
            ✕
          </div>
        </div>

        <div id="sampMoBody">
          {tabs.length > 1 && (
            <div className="samp-tabs">
              {tabs.map((tab, idx) => (
                <div
                  key={tab.key}
                  className={`samp-tab ${idx === activeTabIdx ? 'on' : ''}`}
                  onClick={() => setActiveTabIdx(idx)}
                >
                  {tab.label}
                </div>
              ))}
            </div>
          )}

          <div className="samp-tbl-wrap">
            {renderTableContent()}
          </div>

          <div className="samp-dl-bar">
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)' }}>
                📊 {sampleFilename}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '1px' }}>
                Preview only · actual export reflects your date range
              </div>
            </div>
            <button className="btn btn-p btn-sm" onClick={handleDownload}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" width="12" height="12">
                <path d="M7 2v7M4.5 6.5L7 9l2.5-2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 11h10" strokeLinecap="round" />
              </svg>
              Download Sample
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SamplePreviewModal;
