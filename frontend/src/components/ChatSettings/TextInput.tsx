import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { InputStateHandler } from './InputStateHandler'
import { IInput } from 'types/Input'

interface TextInputProps extends 
  IInput,
  Omit<React.InputHTMLAttributes<any>, 'id' | 'size'> {
  setField?: (field: string, value: string, shouldValidate?: boolean) => void
  value?: string
  placeholder?: string
  multiline?: boolean
}

const TextInput = ({
  description,
  disabled,
  hasError,
  id,
  label,
  tooltip,
  multiline,
  className,
  setField,
  ...rest
}: TextInputProps): JSX.Element => {
  const InputComponent = multiline ? Textarea : Input
  
  return (
    <InputStateHandler
      description={description}
      hasError={hasError}
      id={id}
      label={label}
      tooltip={tooltip}
    >
      <InputComponent
        disabled={disabled}
        id={id}
        name={id}
        onChange={(e) => setField?.(id, e.target.value)}
        className={`text-sm font-normal my-0.5 ${className ?? ''}`}
        {...rest}
      />
    </InputStateHandler>
  )
}

export { TextInput }
export type { TextInputProps }