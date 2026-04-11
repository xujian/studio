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
      customStyle={{
        margin: 0,
        borderRadius: '1rem',
        fontSize: '0.75rem',
        maxHeight: '300px',
        overflowX: 'auto',
        wordBreak: 'break-all',
        whiteSpace: 'pre-wrap',
        wrapLoneLines: true,
      }}>
      {children}
    </SyntaxHighlighter>
  )
}
