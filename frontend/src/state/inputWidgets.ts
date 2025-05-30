import { atom } from 'recoil';
import { IInputWidget } from 'types/Input'; // Assuming IInputWidget will be defined here or imported

// Define IInputWidget in types/Input.ts if it doesn't exist.
// For now, a basic structure:
// export interface IInputWidget {
//   id: string;
//   type: string; // 'slider', 'select', etc.
//   label: string;
//   [key: string]: any; // Other properties like min, max, initial, items
// }

export const inputWidgetsState = atom<IInputWidget[]>({
  key: 'InputWidgetsState',
  default: [],
});
