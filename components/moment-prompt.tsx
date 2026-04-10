import { motion } from 'motion/react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui'
import {
  Copy,
  Earth,
  Ellipsis,
  ExternalLink,
  Eye,
  FileOutput,
  MessageCircle,
  Search,
  User
} from 'lucide-react'
import { assetTypeNames } from '@/lib/types'

export type MomentPromptProps = {
  value: string
}

const languages = ['日本語', '漢語']

export const MomentPrompt = ({ value }: MomentPromptProps) => {
  return (
    <div className="relative rounded-2xl border bg-linear-to-t from-background/80 to-background/40 p-2">
      <Badge className="absolute -top-2 left-1 bg-background/80 text-foreground">
        Prompt
      </Badge>
      <motion.div
        className="relative inset-0 max-h-24 overflow-clip"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}>
        <p className="text-xs text-foreground">{value || '(EMPTY)'}</p>
      </motion.div>
      { value &&
        (<div className="absolute left-2 -bottom-4 z-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" className="h-6 w-8 bg-background!" variant="outline">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-full z-200 text-xs">
              <DropdownMenuItem className="text-xs">
                <Copy className="size-4 text-muted-foreground" />
                Copy
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  <FileOutput className="size-4 text-muted-foreground" />
                  Extract
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  { assetTypeNames.map((name) => (
                    <DropdownMenuItem key={name} className="text-xs">
                      {name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  <Earth className="size-4 text-muted-foreground" />
                  Translate
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {languages.map((lang) => (
                    <DropdownMenuItem key={lang} className="text-xs">
                      {lang}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>)}
    </div>
  )
}
