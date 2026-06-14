import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define PDF styles (similar to React Native styling)
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: '2 solid #0A2540', paddingBottom: 10, marginBottom: 20 },
  bankName: { fontSize: 24, fontWeight: 'bold', color: '#0A2540' },
  title: { fontSize: 18, color: '#64748b' },
  section: { marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottom: '1 solid #e2e8f0' },
  label: { fontSize: 12, color: '#64748b' },
  value: { fontSize: 12, color: '#0f172a', fontWeight: 'bold' },
  netPayView: { backgroundColor: '#0A2540', padding: 15, borderRadius: 5, marginTop: 20 },
  netPayText: { color: '#D4AF37', fontSize: 16, textAlign: 'center', fontWeight: 'bold' }
});

interface PayslipData {
  id: string;
  employeeName: string;
  role: string;
  payPeriod: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
}

export const PayslipDocument = ({ data }: { data: PayslipData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.bankName}>ENTERPRISE BANK</Text>
        <Text style={styles.title}>Official Payslip</Text>
      </View>

      {/* Employee Details */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Employee Name</Text>
          <Text style={styles.value}>{data.employeeName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Role / Designation</Text>
          <Text style={styles.value}>{data.role}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Pay Period</Text>
          <Text style={styles.value}>{data.payPeriod}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Transaction ID</Text>
          <Text style={styles.value}>{data.id}</Text>
        </View>
      </View>

      {/* Financial Breakdown */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Base Salary</Text>
          <Text style={styles.value}>${data.baseSalary.toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Allowances</Text>
          <Text style={styles.value}>+ ${data.allowances.toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tax & Deductions</Text>
          <Text style={styles.value}>- ${data.deductions.toLocaleString()}</Text>
        </View>
      </View>

      {/* Total Net Pay Box */}
      <View style={styles.netPayView}>
        <Text style={styles.netPayText}>Net Disbursed: ${data.netPay.toLocaleString()}</Text>
      </View>
    </Page>
  </Document>
);