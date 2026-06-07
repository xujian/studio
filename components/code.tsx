'use client'

import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

SyntaxHighlighter.registerLanguage('json', json)

type CodeProps = {
  children: string
  language?: string
}

export const Code = ({ children, language = 'json' }: CodeProps) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={oneDark}
      codeTagProps={{ style: { background: 'transparent' } }}
      customStyle={{
        margin: 0,
        borderRadius: '1rem',
        fontSize: '11px',
        overflowX: 'auto',
        wordBreak: 'break-all',
        whiteSpace: 'pre-wrap',
        background: 'transparent'
      }}>
      {children}
    </SyntaxHighlighter>
  )
}
