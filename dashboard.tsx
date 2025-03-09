"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Bar,
  BarChart,
  ComposedChart,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  LineChartIcon,
  PieChartIcon,
  Grid,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// ----------------------------------------------------------------
// Weekly Overview Data Simulation for Histogram
// ----------------------------------------------------------------
const generateWeeklyData = () => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  return days.map((day) => {
    const total = 240;
    let uprightCount = 0;
    for (let i = 0; i < total; i++) {
      uprightCount += Math.random() < 0.5 ? 1 : 0;
    }
    const uprightPercent = Number(((uprightCount / total) * 100).toFixed(1));
    const abnormalPercent = Number((100 - uprightPercent).toFixed(1));
    return { day, upright: uprightPercent, abnormal: abnormalPercent };
  });
};

// ----------------------------------------------------------------
// Generate a 10x10 grid of random sensor values for the live heatmap
// ----------------------------------------------------------------
const generateHeatmapData = () => {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => Math.floor(Math.random() * 600) + 300)
  );
};

// ----------------------------------------------------------------
// Generate Weekly (5-day average) Heatmap Data for Overview
// Each cell is the mean of 5 days' simulated force values.
// ----------------------------------------------------------------
const generateWeeklyHeatmapData = () => {
  const days = 5;
  const grid = [];
  for (let row = 0; row < 10; row++) {
    const currentRow = [];
    for (let col = 0; col < 10; col++) {
      let sum = 0;
      for (let d = 0; d < days; d++) {
        sum += Math.floor(Math.random() * 600) + 300;
      }
      currentRow.push(Math.round(sum / days));
    }
    grid.push(currentRow);
  }
  return grid;
};

export default function Dashboard() {
  // Only one card at the top: display upright sit time (from live pie data)
  const [pieData, setPieData] = useState([
    { name: "Upright", value: 12 },
    { name: "Abnormal", value: 8 },
  ]);
  const [liveHeatmapData, setLiveHeatmapData] = useState(generateHeatmapData());
  // Calculate weekly overview histogram data once on mount.
  const weeklyHistogramData = useMemo(() => generateWeeklyData(), []);
  // Calculate weekly overview heatmap data once on mount.
  const weeklyHeatmapData = useMemo(() => generateWeeklyHeatmapData(), []);

  // Live Pie Chart: update every 2 seconds with randomized data over 20 sensors.
  useEffect(() => {
    const pieInterval = setInterval(() => {
      const uprightCount = Math.floor(Math.random() * 21); // 0 to 20 sensors upright
      setPieData([
        { name: "Upright", value: uprightCount },
        { name: "Abnormal", value: 20 - uprightCount },
      ]);
    }, 2000);
    return () => clearInterval(pieInterval);
  }, []);

  // Live Heatmap: update every 500ms.
  useEffect(() => {
    const heatmapInterval = setInterval(() => {
      setLiveHeatmapData(generateHeatmapData());
    }, 500);
    return () => clearInterval(heatmapInterval);
  }, []);

  // Compute upright percentage from the live pie data.
  const totalSits = pieData.reduce((sum, d) => sum + d.value, 0);
  const uprightData = pieData.find((d) => d.name === "Upright");
  const uprightPercentage =
    totalSits > 0 ? ((uprightData.value / totalSits) * 100).toFixed(1) : 0;

  // For the heatmap color, map a value (0-1024) to a shade of blue.
  const getColor = (value) => {
    const lightness = 80 - (value / 1024) * 40;
    return `hsl(210, 100%, ${lightness}%)`;
  };

  // Manage active tab.
  const [activeTab, setActiveTab] = useState("overview"); // "overview" for histogram

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Digital Twins Dashboard
      </h1>
      <p className="text-muted-foreground">
        Track your back health with real-time analytics.
      </p>

      {/* Top Card: Show the proportion of upright sit time */}
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Upright Sit Time</CardTitle>
          <CardDescription>
            Live proportion over the past 10 seconds
          </CardDescription>
        </CardHeader>
        <CardContent className="text-3xl font-bold text-center">
          {uprightPercentage}%
          {parseFloat(uprightPercentage) < 50 && (
            <div className="mt-2 text-red-500 text-base">
              Warning: Please stand up or move around!
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview Histogram</span>
          </TabsTrigger>
          <TabsTrigger
            value="weekly-heatmap"
            className="flex items-center gap-2"
          >
            <Grid className="h-4 w-4" />
            <span>Overview Heatmap</span>
          </TabsTrigger>
          <TabsTrigger value="sitting" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            <span>Live Pie Chart</span>
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4" />
            <span>Live Heatmap</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Histogram Tab (Weekly Overview Histogram) */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Overview Histogram</CardTitle>
              <CardDescription>
                Proportion of upright (blue) vs abnormal (orange) sitting time
                over the past 5 days.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={weeklyHistogramData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar
                    dataKey="upright"
                    stackId="a"
                    fill="#0088FE"
                    name="Upright"
                  />
                  <Bar
                    dataKey="abnormal"
                    stackId="a"
                    fill="#FF8042"
                    name="Abnormal"
                  />
                  <Line
                    type="monotone"
                    dataKey="upright"
                    stroke="#000"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Upright Trend"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Heatmap Tab (Weekly Aggregated Heatmap) */}
        <TabsContent value="weekly-heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Overview Heatmap</CardTitle>
              <CardDescription>
                Mean sensor force distribution over the past 5 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-1 w-full max-w-[500px] mx-auto">
                {weeklyHeatmapData.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-10 gap-1">
                    {row.map((value, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        style={{ backgroundColor: getColor(value) }}
                        className="aspect-square"
                        title={`Value: ${value}`}
                      >
                        {/* Number removed */}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Pie Chart Tab */}
        <TabsContent value="sitting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Pie Chart</CardTitle>
              <CardDescription>
                Proportion of time sitting upright vs abnormal over the past 10
                seconds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      data={pieData}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? "#0088FE" : "#FF8042"}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Heatmap Tab */}
        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Heatmap</CardTitle>
              <CardDescription>
                Mean sensor force per square over the past 10 seconds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-1 w-full max-w-[500px] mx-auto">
                {liveHeatmapData.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-10 gap-1">
                    {row.map((value, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        style={{ backgroundColor: getColor(value) }}
                        className="aspect-square"
                        title={`Value: ${value}`}
                      >
                        {/* Number removed */}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
