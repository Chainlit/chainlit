import { Button } from "@/components/ui/button";
import React, { useState } from 'react';

export default function AskForm() {
  const [value, setValue] = useState(props.value || '');
  return (
    <div id="ask-form" className="mt-4 flex flex-col gap-2">
      <input id="ask-input" value={value} onChange={(e) => setValue(e.target.value)} />
      <Button id="ask-submit" onClick={() => submitElement({ value })}>Submit</Button>
    </div>
  );
}
