import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { 
  useGetSeasonStatus, 
  useListMatches, 
  useGetUserPicks, 
  useGetLeaderboard,
  useListSmackMessages,
  usePostSmackMessage,
  getGetUserPicksQueryKey,
  getListSmackMessagesQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Send, CheckCircle2, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [smackText, setSmackText] = useState("");

  const { data: status, isLoading: loadingStatus } = useGetSeasonStatus();
  const activeWeek = status ? (status.lastCompletedWeek || 1) : 1;
  
  const { data: matches, isLoading: loadingMatches } = useListMatches({ week: activeWeek });
  const { data: picks, isLoading: loadingPicks } = useGetUserPicks(user?.id || 0, {
    query: { enabled: !!user?.id, queryKey: getGetUserPicksQueryKey(user?.id || 0) }
  });
  const { data: leaderboard, isLoading: loadingBoard } = useGetLeaderboard();
  
  const { data: smackMessages, isLoading: loadingSmack } = useListSmackMessages({
    query: { refetchInterval: 15000 }
  });

  const postSmack = usePostSmackMessage({
    mutation: {
      onSuccess: () => {
        setSmackText("");
        queryClient.invalidateQueries({ queryKey: getListSmackMessagesQueryKey() });
      }
    }
  });

  if (loadingStatus || loadingMatches || loadingPicks || loadingBoard || loadingSmack) {
    return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  const userStats = leaderboard?.find(entry => entry.userId === user?.id);
  const weekMatches = matches || [];
  
  const handleSmackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smackText.trim() || !user) return;
    postSmack.mutate({ data: { name: user.name, message: smackText.substring(0, 280) } });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 font-medium">Your Rank</p>
              <h2 className="text-4xl font-bold">{userStats ? `#${userStats.rank}` : '-'}</h2>
            </div>
            <Trophy className="w-12 h-12 opacity-20" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground font-medium">Total Points</p>
            <h2 className="text-4xl font-bold">{userStats?.totalPoints || 0}</h2>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground font-medium">Active Week</p>
            <h2 className="text-4xl font-bold">Week {activeWeek}</h2>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Week {activeWeek} Matchups</CardTitle>
        </CardHeader>
        <CardContent>
          {weekMatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No games found for this week.
            </div>
          ) : (
            <div className="space-y-3">
              {weekMatches.map(match => {
                const pick = picks?.find(p => p.matchId === match.id);
                const isCorrect = match.isCompleted && match.winner === pick?.selectedTeam;
                const isWrong = match.isCompleted && match.winner && match.winner !== pick?.selectedTeam;
                
                return (
                  <div 
                    key={match.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      isCorrect ? 'bg-green-500/10 border-green-500/20' : 
                      isWrong ? 'bg-muted opacity-60' : 'bg-card'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-lg">{match.awayTeam} @ {match.homeTeam}</span>
                      <span className="text-sm text-muted-foreground">
                        Your Pick: {pick?.selectedTeam ? <span className="font-medium text-foreground">{pick.selectedTeam}</span> : <span className="italic">None</span>}
                        {pick?.isLock && " (LOCK)"}
                      </span>
                    </div>
                    <div>
                      {isCorrect && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                      {isWrong && <XCircle className="w-6 h-6 text-destructive" />}
                      {!match.isCompleted && pick && <Badge variant="secondary">Locked In</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Smack Board</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[300px] overflow-y-auto space-y-4 pr-2 flex flex-col-reverse">
            {[...(smackMessages || [])].reverse().map(msg => (
              <div key={msg.id} className="bg-secondary/50 p-3 rounded-xl border">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-sm">{msg.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm">{msg.message}</p>
              </div>
            ))}
            {(!smackMessages || smackMessages.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">No smack talk yet. Be the first!</div>
            )}
          </div>
          
          <form onSubmit={handleSmackSubmit} className="flex gap-2 pt-2">
            <Input
              value={smackText}
              onChange={(e) => setSmackText(e.target.value)}
              placeholder="Talk some smack..."
              maxLength={280}
              disabled={postSmack.isPending}
            />
            <Button type="submit" disabled={!smackText.trim() || postSmack.isPending}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
