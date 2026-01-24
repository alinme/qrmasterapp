import { type HTMLAttributes, defineComponent, h } from 'vue'
import { cn } from '@/lib/utils'

const Card = defineComponent((props: { class?: HTMLAttributes['class'] }, { slots }) => {
  return () => h('div', { class: cn('rounded-xl border bg-card text-card-foreground shadow', props.class) }, slots.default?.())
}, { props: ['class'] })

const CardHeader = defineComponent((props: { class?: HTMLAttributes['class'] }, { slots }) => {
  return () => h('div', { class: cn('flex flex-col space-y-1.5 p-6', props.class) }, slots.default?.())
}, { props: ['class'] })

const CardTitle = defineComponent((props: { class?: HTMLAttributes['class'] }, { slots }) => {
  return () => h('h3', { class: cn('font-semibold leading-none tracking-tight', props.class) }, slots.default?.())
}, { props: ['class'] })

const CardDescription = defineComponent((props: { class?: HTMLAttributes['class'] }, { slots }) => {
  return () => h('p', { class: cn('text-sm text-muted-foreground', props.class) }, slots.default?.())
}, { props: ['class'] })

const CardContent = defineComponent((props: { class?: HTMLAttributes['class'] }, { slots }) => {
  return () => h('div', { class: cn('p-6 pt-0', props.class) }, slots.default?.())
}, { props: ['class'] })

const CardFooter = defineComponent((props: { class?: HTMLAttributes['class'] }, { slots }) => {
  return () => h('div', { class: cn('flex items-center p-6 pt-0', props.class) }, slots.default?.())
}, { props: ['class'] })

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
