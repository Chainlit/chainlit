<div id="custom-counter" className="mt-4 flex flex-col gap-2">
    <div>Count: {props.count}</div>
    <Button id="increment" onClick={() => updateElement(Object.assign(props, {count: props.count + 1}))}><Icon name="align-horizontal-space-between" /> Increment</Button>
    <Button id="action" onClick={() => callAction({name: "test", payload: {}})}>Run test action</Button>
    <Button id="remove" onClick={deleteElement}>Remove</Button>
</div>