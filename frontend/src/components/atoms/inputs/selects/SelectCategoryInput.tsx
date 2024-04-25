import ListSubheader from '@mui/material/ListSubheader';

import { useIsDarkMode } from 'hooks/useIsDarkMode';

import { MenuItem } from './MenuItem';
import { SelectInput, SelectInputProps, SelectItem } from './SelectInput';

type CategoryItem = {
  header: string;
  items: SelectItem[];
};

type SelectCategoryProps = {
  items: CategoryItem[];
} & Omit<SelectInputProps, 'items'>;

const SelectCategoryInput = ({
  items,
  value,
  ...rest
}: SelectCategoryProps): JSX.Element => {
  const isDarkMode = useIsDarkMode();

  const renderCategoryItem = (categoryItem: CategoryItem) => {
    const header = <ListSubheader>{categoryItem.header}</ListSubheader>;
    const items = categoryItem.items.map((item) => (
      <MenuItem
        isDarkMode={isDarkMode}
        item={item}
        selected={item.value === value}
        value={item.value}
      />
    ));

    return [header, ...items];
  };

  const renderLabel = () => {
    let label: string | undefined = undefined;

    for (const item of items) {
      const foundItem = item.items.find((el) => el.value === value);
      if (foundItem) {
        label = foundItem.label;
        break;
      }
    }

    return label || '';
  };

  return (
    <SelectInput value={value} renderLabel={renderLabel} {...rest}>
      {items.map(renderCategoryItem)}
    </SelectInput>
  );
};

export { SelectCategoryInput };
