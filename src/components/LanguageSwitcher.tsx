import { SegmentedControl } from '@mantine/core'
import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <SegmentedControl
      size="xs"
      value={i18n.language}
      onChange={(lang) => i18n.changeLanguage(lang)}
      data={[
        { label: 'RU', value: 'ru' },
        { label: 'EN', value: 'en' },
      ]}
    />
  )
}
