import { FileElement } from '@/components/Elements/File';
import type { IFileElement } from '@chainlit/react-client';


interface Props {
  items: IFileElement[];
}

const InlinedFileList = ({ items }: Props) => {
  return (
    <div className='flex items-center gap-1'>
      {items.map((file, i) => {
        return (
          <div key={i}>
            <FileElement element={file} />
          </div>
        );
      })}
    </div>
  );
};

export { InlinedFileList };
