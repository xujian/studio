import React from 'react'
import { SplitBlock } from './magazine/split-block'
import { ImageRow } from './magazine/image-row'
import { InsetImage } from './magazine/inset-image'
import { PullQuote } from './magazine/pull-quote'
import { Column } from './magazine/Column'

export const mdxComponents: Record<string, React.ComponentType<any>> = {
  Column,
  SplitBlock,
  ImageRow,
  InsetImage,
  PullQuote,
}
