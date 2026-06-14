'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the RevenueChart with SSR disabled
const OverviewChart = dynamic(() => import('./RevenueChart'), {
  loading: () => <div className="h-[300px] w-full animate-pulse bg-slate-100 rounded-xl"></div>,
  ssr: false
});

export default function RevenueChartWrapper() {
  return <OverviewChart />;
}