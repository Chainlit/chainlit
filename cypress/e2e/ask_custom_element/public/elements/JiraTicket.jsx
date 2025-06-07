import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import React, { useEffect, useMemo, useState } from 'react';

export default function JiraTicket() {
  const [timeLeft, setTimeLeft] = useState(props.timeout || 30);
  const [values, setValues] = useState(() => {
    const init = {};
    (props.fields || []).forEach((f) => {
      init[f.id] = f.value || '';
    });
    return init;
  });

  const allValid = useMemo(() => {
    if (!props.fields) return true;
    return props.fields.every((f) => {
      if (!f.required) return true;
      const val = values[f.id];
      return val !== undefined && val !== '';
    });
  }, [props.fields, values]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (id, val) => {
    setValues((v) => ({ ...v, [id]: val }));
  };

  const renderField = (field) => {
    const value = values[field.id];
    switch (field.type) {
      case 'textarea':
        return <Textarea id={field.id} value={value} onChange={(e) => handleChange(field.id, e.target.value)} />;
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleChange(field.id, val)}>
            <SelectTrigger id={field.id}>
              <SelectValue placeholder={field.label} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'date':
        return <Input type="date" id={field.id} value={value} onChange={(e) => handleChange(field.id, e.target.value)} />;
      case 'datetime':
        return <Input type="datetime-local" id={field.id} value={value} onChange={(e) => handleChange(field.id, e.target.value)} />;
      default:
        return <Input id={field.id} value={value} onChange={(e) => handleChange(field.id, e.target.value)} />;
    }
  };

  return (
    <Card id="jira-ticket" className="mt-4 w-full max-w-3xl grid grid-cols-2 gap-4">
      <CardHeader className="col-span-2">
        <CardTitle>Create JIRA Ticket</CardTitle>
        <CardDescription>Provide details for the new issue. {timeLeft}s left</CardDescription>
      </CardHeader>
      <CardContent className="col-span-2 grid grid-cols-2 gap-4">
        {props.fields.map((field) => (
          <div key={field.id} className="flex flex-col gap-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            {renderField(field)}
          </div>
        ))}
      </CardContent>
      <CardFooter className="col-span-2 flex justify-end gap-2">
        <Button id="ticket-cancel" variant="outline" onClick={() => cancelElement()}>
          Cancel
        </Button>
        <Button
          id="ticket-submit"
          disabled={!allValid}
          onClick={() => submitElement(values)}
        >
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}
