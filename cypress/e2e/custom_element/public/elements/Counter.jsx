import { Button } from "@/components/ui/button"
import { X } from 'lucide-react';

export default function Counter() {
    return (
        <div id="custom-counter" className="mt-4 flex flex-col gap-2">
                <div>Count: {props.count}</div>
                {props.loading ? "Loading..." : null}
                <Button id="increment" onClick={() => updateElement(Object.assign(props, {count: props.count + 1}))}> Increment</Button>
                <Button id="action" onClick={async() => {
                await updateElement(Object.assign(props, {loading: true}))
                await callAction({name: "test", payload: {}})
                await updateElement(Object.assign(props, {loading: false}))
                }}>Run test action</Button>
                <Button id="remove" onClick={deleteElement}><X/> Remove</Button>
        </div>
    );
}

