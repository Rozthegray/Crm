'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the chart with SSR disabled
const PayrollChart = dynamic(() => import('./PayrollChart'), {
  loading: () => <div className="h-[350px] w-full animate-pulse bg-slate-100 rounded-xl"></div>,
  ssr: false
});

export default function PayrollChartWrapper() {
  return <PayrollChart />;
}