import {
  ButtonWithTooltip,
  activeEditor$,
  iconComponentFor$,
  useTranslation,
} from '@mdxeditor/editor';
import React from 'react';
import { Cell, Action, map, useCellValue, usePublisher, withLatestFrom } from '@mdxeditor/gurx';
import {
  $selectAll,
} from 'lexical';
import EvoyaLogo from '@/svg/EvoyaLogo';
import HandPointer from '@/svg/HandPointer';
import {
  selectDocument$,
} from '../../evoyaAi';

// const selectDocument$ = Action((realm) => {
//   realm.sub(realm.pipe(selectDocument$, withLatestFrom(activeEditor$)), ([value, activeEditor]) => {
//     activeEditor?.update(() => {
//       $selectAll();
//     });
//   });
// });

/**
 * A toolbar button that allows the user to insert a table.
 * For this button to work, you need to have the `tablePlugin` plugin enabled.
 * @group Toolbar Components
 */
export const SelectDocument: React.FC = () => {
  const iconComponentFor = useCellValue(iconComponentFor$);
  const selectDocument = usePublisher(selectDocument$);
  const t = useTranslation();

  return (
    <ButtonWithTooltip
      title={t('toolbar.selectAll', 'Select All')}
      onClick={() => {
        selectDocument();
      }}
    >
      {/* <HandPointer /> */}
      {iconComponentFor('handPointer')}
    </ButtonWithTooltip>
  )
}