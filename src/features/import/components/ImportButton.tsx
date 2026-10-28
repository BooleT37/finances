import { ActionIcon, Tooltip } from '@mantine/core';
import { IconFileImport } from '@tabler/icons-react';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { ImportModal, importModalOpenAtom } from './ImportModal';

export function ImportButton() {
  const { t } = useTranslation('import');
  const setImportOpen = useSetAtom(importModalOpenAtom);
  return (
    <>
      <Tooltip label={t('import')}>
        <ActionIcon
          variant="default"
          size="lg"
          aria-label={t('import')}
          onClick={() => setImportOpen(true)}
        >
          <IconFileImport size={16} />
        </ActionIcon>
      </Tooltip>
      <ImportModal />
    </>
  );
}
