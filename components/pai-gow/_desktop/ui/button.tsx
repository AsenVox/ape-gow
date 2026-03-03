import React from 'react'
import { cn } from '../../lib/utils'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'ghost' | 'default'
  size?: 'icon' | 'default'
}

export function Button({ className, variant = 'default', size = 'default', ...props }: Props) {
  // Minimal shadcn-ish button. Tailwind classes are used by the template components.
  const base = 'inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none'
  const variants: Record<string, string> = {
    default: 'bg-[#1D282E] border border-[#27353D] text-white hover:bg-[#2a2e30]',
    ghost: 'bg-transparent hover:bg-white/10',
  }
  const sizes: Record<string, string> = {
    default: 'h-10 px-4 py-2',
    icon: 'h-10 w-10',
  }
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />
}

export default Button
