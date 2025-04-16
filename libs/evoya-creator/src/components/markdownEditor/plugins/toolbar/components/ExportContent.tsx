import {
  ButtonWithTooltip,
  activeEditor$,
  iconComponentFor$,
  useTranslation,
  markdownSourceEditorValue$,
} from '@mdxeditor/editor';
import React, { useCallback } from 'react';
import { Cell, Action, map, useCellValue, usePublisher, withLatestFrom } from '@mdxeditor/gurx';
import {
  $selectAll,
} from 'lexical';
import EvoyaLogo from '@/svg/EvoyaLogo';
import {
  selectDocument$,
  creatorType$,
} from '../../evoyaAi';
import fileDownload from 'js-file-download';

const getNewFileInfo = (type: string): {mimeType: string | null, extension: string} => {
  switch(type) {
    case 'markdown':
      return {
        mimeType: 'text/markdown',
        extension: 'md'
      };
    case 'javascript':
      return {
        mimeType: 'text/javascript',
        extension: 'js'
      };
    case 'python':
      return {
        mimeType: 'text/x-python',
        extension: 'py'
      };
    default:
      return {
        mimeType: null,
        extension: 'txt'
      };
  }
}

export const ExportContent: React.FC = () => {
  const iconComponentFor = useCellValue(iconComponentFor$);
  const markdownContent = useCellValue(markdownSourceEditorValue$);
  const creatorType = useCellValue(creatorType$);
  // const selectDocument = usePublisher(selectDocument$);
  const t = useTranslation();

  const exportDocument = useCallback(() => {
    // const exportFile = new Blob([markdownContent], {
    //   type: getMimeType()
    // });
    const exportFile = new Blob([markdownContent]);
    const fileInfo = getNewFileInfo(creatorType);

    fileDownload(exportFile, `export.${fileInfo.extension}`)
  }, [markdownContent]);

  return (
    <ButtonWithTooltip
      title={t('toolbar.export', 'Export Document')}
      onClick={() => {
        exportDocument();
      }}
    >
      {iconComponentFor('save')}
    </ButtonWithTooltip>
  )
}