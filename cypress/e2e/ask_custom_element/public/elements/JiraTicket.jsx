import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import React, { useState } from 'react';

export default function JiraTicket() {
  const [summary, setSummary] = useState(props.summary || '');
  const [description, setDescription] = useState(props.description || '');
  const [priority, setPriority] = useState(props.priority || 'Medium');

  return (
    <Card id="jira-ticket" className="mt-4 w-full max-w-md">
      <CardHeader>
        <CardTitle>Create JIRA Ticket</CardTitle>
        <CardDescription>Provide details for the new issue</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ticket-summary">Summary</Label>
          <Input id="ticket-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ticket-description">Description</Label>
          <Textarea id="ticket-description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ticket-priority">Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger id="ticket-priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          id="ticket-submit"
          onClick={() => {
            sendUserMessage(`Created ticket: ${summary}`);
            submitElement({ summary, description, priority });
          }}
        >
          Submit Ticket
        </Button>
      </CardFooter>
    </Card>
  );
}
