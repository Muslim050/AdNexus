import { redirect } from 'next/navigation'
import { HOME } from '@/lib/nav'

export default function Index() {
  redirect(HOME)
}
