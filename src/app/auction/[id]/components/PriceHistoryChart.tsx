"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Bid } from "@/types/bid.types";
import { useLanguage } from "@/i18n";
import { useCurrency } from "@/hooks/useCurrency";

interface PriceHistoryChartProps {
  bids: Bid[];
  startingPrice: number;
}

export default function PriceHistoryChart({ bids, startingPrice }: PriceHistoryChartProps) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const chartData = useMemo(() => {
    if (bids.length === 0) return [];

    const sortedBids = [...bids]
      .filter((b) => b.createdAt)
      .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());

    const data = [
      {
        time: sortedBids.length > 0 
          ? new Date(sortedBids[0].createdAt.toMillis() - 60000).getTime()
          : Date.now(),
        amount: startingPrice,
        label: t.auction?.startingPrice || "Precio inicial",
      },
      ...sortedBids.map((bid) => ({
        time: bid.createdAt.toMillis(),
        amount: bid.amount,
        label: bid.bidderName,
        isAutoBid: bid.isAutoBid || false,
      })),
    ];

    return data;
  }, [bids, startingPrice, t]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    }).format(date);
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { time: number; amount: number; label: string; isAutoBid?: boolean } }> }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold">{formatPrice(data.amount)}</p>
          <p className="text-slate-400 text-sm">{data.label}</p>
          <p className="text-slate-500 text-xs">{formatTime(data.time)}</p>
          {data.isAutoBid && (
            <span className="text-xs text-blue-400">Auto-bid</span>
          )}
        </div>
      );
    }
    return null;
  };

  if (chartData.length < 2) {
    return null;
  }

  const priceIncrease = chartData.length > 1
    ? ((chartData[chartData.length - 1].amount - chartData[0].amount) / chartData[0].amount * 100).toFixed(1)
    : "0";

  return (
    <div className="bg-slate-900 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          {t.auction?.priceHistory || "Historial de precios"}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {chartData.length - 1} {t.auction?.bids || "pujas"}
          </span>
          {Number(priceIncrease) > 0 && (
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
              +{priceIncrease}%
            </span>
          )}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              stroke="#475569"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              tickFormatter={(value) => formatPrice(value)}
              stroke="#475569"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#334155" }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="stepAfter"
              dataKey="amount"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={{ fill: "#10b981", stroke: "#0d9488", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2, fill: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="text-slate-400">
          <span className="text-slate-500">{t.auction?.startingPrice || "Precio inicial"}:</span>{" "}
          <span className="text-white">{formatPrice(startingPrice)}</span>
        </div>
        <div className="text-slate-400">
          <span className="text-slate-500">{t.auction?.currentBid || "Puja actual"}:</span>{" "}
          <span className="text-emerald-400 font-semibold">
            {formatPrice(chartData[chartData.length - 1]?.amount || startingPrice)}
          </span>
        </div>
      </div>
    </div>
  );
}
