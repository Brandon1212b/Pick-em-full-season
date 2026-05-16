import React from "react";
import { 
  useGetLeaderboard, 
  useGetLeaderboardTrends, 
  useGetWeeklyExtremes, 
  useGetPickPopularity 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Progress } from "@/components/ui/progress";

export default function Leaderboard() {
  const { data: leaderboard, isLoading: loadingBoard } = useGetLeaderboard();
  const { data: trends, isLoading: loadingTrends } = useGetLeaderboardTrends();
  const { data: extremes, isLoading: loadingExtremes } = useGetWeeklyExtremes();
  const { data: popularity, isLoading: loadingPopularity } = useGetPickPopularity();

  if (loadingBoard || loadingTrends || loadingExtremes || loadingPopularity) {
    return <div className="space-y-4"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  // Format trends for recharts: array of objects { week: "1", "User1": 10, "User2": 5 }
  const chartData = [];
  if (trends && trends.length > 0) {
    const numWeeks = trends[0].weeklyPoints.length;
    for (let w = 0; w < numWeeks; w++) {
      const dataPoint: any = { week: `W${w + 1}` };
      trends.forEach(user => {
        dataPoint[user.name] = user.weeklyPoints[w];
      });
      chartData.push(dataPoint);
    }
  }

  const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Standings & Analytics</h1>
        <p className="text-muted-foreground">League performance and global trends</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>League Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Correct</TableHead>
                <TableHead className="text-right">Record</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard?.map((entry) => (
                <TableRow key={entry.userId}>
                  <TableCell className="font-medium text-lg">{entry.rank}</TableCell>
                  <TableCell className="font-semibold">
                    {entry.name}
                    <span className="ml-2 inline-flex gap-1">
                      {entry.badges.map((b, i) => (
                        <span key={i} title={b}>
                          {b === "Perfect Week" ? "🏆" : 
                           b === "The Cellar" ? "🪣" : 
                           b === "Against the Grain" ? "⚡" : 
                           b === "League Leader" ? "👑" : ""}
                        </span>
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">{entry.totalPoints}</TableCell>
                  <TableCell className="text-right">{entry.correctPicks}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {entry.correctPicks}-{entry.totalPicks - entry.correctPicks}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {extremes?.topUsers && extremes.topUsers.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">🔥</div>
              <h3 className="font-bold text-xl mb-1">Week {extremes.week} High Score</h3>
              <p className="text-muted-foreground mb-2">They were on fire last week</p>
              <div className="font-semibold text-lg text-primary">
                {extremes.topUsers.map(u => `${u.name} (${u.points} pts)`).join(', ')}
              </div>
            </CardContent>
          </Card>
        )}
        
        {extremes?.bottomUsers && extremes.bottomUsers.length > 0 && (
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">🥶</div>
              <h3 className="font-bold text-xl mb-1">Week {extremes.week} Low Score</h3>
              <p className="text-muted-foreground mb-2">Tough week for the squad</p>
              <div className="font-semibold text-lg text-destructive">
                {extremes.bottomUsers.map(u => `${u.name} (${u.points} pts)`).join(', ')}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Season Trajectory</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="week" className="text-xs" tickLine={false} axisLine={false} />
              <YAxis className="text-xs" tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} 
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {trends?.map((user, idx) => (
                <Line
                  key={user.userId}
                  type="monotone"
                  dataKey={user.name}
                  stroke={chartColors[idx % chartColors.length]}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Global Pick Popularity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {popularity?.map(pop => (
            <div key={pop.matchId} className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>{pop.awayTeam} ({pop.awayPickPct}%)</span>
                <span>{pop.homeTeam} ({pop.homePickPct}%)</span>
              </div>
              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${pop.awayPickPct}%` }}
                />
                <div 
                  className="h-full bg-primary/40" 
                  style={{ width: `${pop.homePickPct}%` }}
                />
              </div>
            </div>
          ))}
          {(!popularity || popularity.length === 0) && (
            <div className="text-center text-muted-foreground py-4">No data available for current week.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
