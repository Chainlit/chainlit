import { useEffect, useRef } from 'react'
import hljs from 'highlight.js'
import { Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

import 'highlight.js/styles/monokai-sublime.css'
import { useTheme } from './ThemeProvider'

interface CodeSnippetProps {
  language: string
  children: string
}

const HighlightedCode = ({ language, children }: CodeSnippetProps) => {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      const highlighted = codeRef.current.getAttribute('data-highlighted') === 'yes'
      if (!highlighted) {
        hljs.highlightElement(codeRef.current)
      }
    }
  }, [])

  return (
    <pre className="m-0">
      <code
        ref={codeRef}
        className={`language-${language} font-mono text-sm rounded-b-lg block`}
      >
        {children}
      </code>
    </pre>
  )
}

interface CodeProps {
  children: React.ReactNode
  node?: {
    children?: Array<{
      properties?: {
        className?: string[]
      }
      children?: Array<{
        value?: string
      }>
    }>
  }
}

export default function CodeSnippet({ children, ...props }: CodeProps) {
  const { variant } = useTheme()
  const isDarkMode = variant === 'dark'

  const codeChildren = props.node?.children?.[0]
  const className = codeChildren?.properties?.className?.[0]
  const match = /language-(\w+)/.exec(className || '')
  const code = codeChildren?.children?.[0]?.value

  const showSyntaxHighlighter = match && code

  const handleCopy = async () => {
    if (code) {
      await navigator.clipboard.writeText(code)
    }
  }

  const highlightedCode = showSyntaxHighlighter ? (
    <HighlightedCode language={match[1]}>{code}</HighlightedCode>
  ) : null

  const nonHighlightedCode = showSyntaxHighlighter ? null : (
    <div className={`rounded-lg p-4 min-h-20 overflow-x-auto ${
      isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'
    }`}>
      <code className="whitespace-pre-wrap">
        {children}
      </code>
    </div>
  )

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between py-2 px-4">
        <span className="text-sm text-muted-foreground">
          {match?.[1] || 'Raw code'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleCopy}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {highlightedCode}
        {nonHighlightedCode}
      </CardContent>
    </Card>
  )
}