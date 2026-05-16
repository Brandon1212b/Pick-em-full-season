import React, { useState } from "react";
import { 
  useListMatches, 
  useGetSeasonStatus, 
  useSetMatchResult, 
  useUpdateSeasonMode, 
  useSendWebhookNotification,
  getListMatchesQueryKey,
  getGetSeasonStatusQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

export default function Admin() {
  const queryClient = useQueryClient();
  
  const { data: status, isLoading: loadingStatus } = useGetSeasonStatus();
  const { data: matches, isLoading: loadingMatches } = useListMatches();

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookMsg, setWebhookMsg] = useState("");

  const updateSeasonMode = useUpdateSeasonMode({
    mutation: {
      onSuccess: () => {
        toast.success("Season mode updated");
        queryClient.invalidateQueries({ queryKey: getGetSeasonStatusQueryKey() });
      }
    }
  });

  const setMatchResult = useSetMatchResult({
    mutation: {
      onSuccess: () => {
        toast.success("Match result set successfully!");
        queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
      }
    }
  });

  const sendWebhook = useSendWebhookNotification({
    mutation: {
      onSuccess: () => {
        toast.success("Notification sent!");
        setWebhookMsg("");
      },
      onError: () => {
        toast.error("Failed to send notification");
      }
    }
  });

  if (loadingStatus || loadingMatches) {
    return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  const handleModeToggle = (checked: boolean) => {
    updateSeasonMode.mutate({ data: { mode: checked ? 'in-season' : 'pre-season' } });
  };

  const handleSetWinner = (matchId: number, winner: string) => {
    if (!winner) return;
    setMatchResult.mutate({ matchId, data: { winner } });
  };

  const handleSendWebhook = () => {
    if (!webhookUrl || !webhookMsg) return;
    sendWebhook.mutate({ data: { webhookUrl, message: webhookMsg } });
  };

  const matchesByWeek = matches?.reduce((acc, m) => {
    if (!acc[m.week]) acc[m.week] = [];
    acc[m.week].push(m);
    return acc;
  }, {} as Record<number, typeof matches>);

  return (
    <div className="space-y-6">
      <div className="bg-destructive/10 border-destructive/20 border text-destructive p-4 rounded-xl flex items-center gap-3">
        <AlertTriangle className="w-6 h-6" />
        <div>
          <h2 className="font-bold">Commissioner Access Only</h2>
          <p className="text-sm opacity-90">Actions taken here affect all users in the league.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Season Settings</CardTitle>
          <CardDescription>Control the global state of the league.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-xl bg-secondary/30">
            <div>
              <Label className="text-base font-semibold">In-Season Mode</Label>
              <p className="text-sm text-muted-foreground">Locks all picks and begins live scoring</p>
            </div>
            <Switch 
              checked={status?.mode === 'in-season'} 
              onCheckedChange={handleModeToggle}
              disabled={updateSeasonMode.isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blast Notification</CardTitle>
          <CardDescription>Send a webhook message to Discord/Slack.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input 
              value={webhookUrl} 
              onChange={e => setWebhookUrl(e.target.value)} 
              placeholder="https://discord.com/api/webhooks/..."
            />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea 
              value={webhookMsg} 
              onChange={e => setWebhookMsg(e.target.value)}
              placeholder="Don't forget to set your picks!"
            />
          </div>
          <Button onClick={handleSendWebhook} disabled={!webhookUrl || !webhookMsg || sendWebhook.isPending}>
            Blast Notification
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Match Results</CardTitle>
          <CardDescription>Set the winner for completed games.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            {matchesByWeek && Object.entries(matchesByWeek).map(([week, weekMatches]) => (
              <AccordionItem key={week} value={week} className="border rounded-xl px-2">
                <AccordionTrigger className="px-2 hover:no-underline font-semibold">
                  Week {week}
                </AccordionTrigger>
                <AccordionContent className="space-y-3 p-2">
                  {weekMatches.map(match => (
                    <div key={match.id} className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 border rounded-lg bg-card">
                      <div className="font-medium text-lg">
                        {match.awayTeam} @ {match.homeTeam}
                      </div>
                      
                      {match.isCompleted ? (
                        <div className="bg-green-500/10 text-green-600 px-4 py-2 rounded-lg font-bold">
                          Winner: {match.winner}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Select 
                            onValueChange={(val) => handleSetWinner(match.id, val)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select winner..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={match.awayTeam}>{match.awayTeam}</SelectItem>
                              <SelectItem value={match.homeTeam}>{match.homeTeam}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
