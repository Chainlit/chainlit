import { atom } from 'recoil';

export interface IDatasetFilters {
  authorEmail?: string;
  search?: string;
  feedback?: number;
}

export const datasetFiltersState = atom<IDatasetFilters>({
  key: 'DatasetFilters',
  default: {}
});
