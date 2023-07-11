import find from 'lodash/find';
import forEach from 'lodash/forEach';

import { ListSubheader } from '@mui/material';

import useIsDarkMode from 'hooks/useIsDarkMode';

import SelectInput, {
  SelectInputProps,
  SelectItem,
  renderMenuItem
} from './selectInput';

export type CategoryItem = {
  header: string;
  items: SelectItem[];
};

type SelectCategoryProps = {
  items: CategoryItem[];
} & Omit<SelectInputProps, 'items'>;

export default function SelectCategoryInput({
  items,
  value,
  ...rest
}: SelectCategoryProps): JSX.Element {
  const isDarkMode = useIsDarkMode();

  const renderCategoryItem = (categoryItem: CategoryItem) => {
    const header = <ListSubheader>{categoryItem.header}</ListSubheader>;
    const items = categoryItem.items.map((item, index) =>
      renderMenuItem({
        index,
        isDarkMode,
        item,
        selected: item.value === value
      })
    );

    return [header, ...items];
  };

  const renderLabel = () => {
    let label: string | undefined = undefined;

    forEach(items, (item: CategoryItem) => {
      label = find(item.items, (el) => el.value === value)?.label;

      if (label) return false;
    });

    return label || '';
  };

  return (
    <SelectInput value={value} renderLabel={renderLabel} {...rest}>
      {items.map(renderCategoryItem)}
    </SelectInput>
  );
}
