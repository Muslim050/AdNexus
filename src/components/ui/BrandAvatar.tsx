import { fileHref, type AttachedFile } from '@/lib/files'
import { Avatar } from './Avatar'

/** Логотип бренда, а без него — инициалы в цвете бренда. */
export function BrandAvatar({
  name,
  logo,
  color,
  size,
}: {
  name: string
  logo: AttachedFile | null
  color: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <Avatar
      name={name}
      size={size}
      color={color ?? undefined}
      src={logo ? fileHref(logo) : null}
    />
  )
}
