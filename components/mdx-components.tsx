import React from 'react'
import type { MDXComponents } from 'mdx/types'
import { SplitBlock } from './magazine/split-block'
import { ImageRow } from './magazine/image-row'
import { InsetImage } from './magazine/inset-image'
import { PullQuote } from './magazine/pull-quote'
import { Column } from './magazine/Column'

export const mdxComponents: MDXComponents = {
  Column,
  SplitBlock,
  ImageRow,
  InsetImage,
  PullQuote,
}
