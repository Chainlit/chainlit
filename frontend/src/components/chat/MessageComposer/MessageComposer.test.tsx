import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { RecoilRoot, useRecoilValue, useSetRecoilState } from 'recoil';
import MessageComposer from './index'; // Adjust path as necessary
import {
  customWidgetDefinitionsState,
  customWidgetValuesState,
  IAttachment,
  attachmentsState,
  persistentCommandState
} from '@/state/chat'; // Adjust path
import { ICustomWidgetElement, IDropdownWidgetProps } from '@/types/widgets'; // Adjust path
import { useChatData, useChatInteract, useAuth } from '@chainlit/react-client';
import { TFunction } from 'i18next';

// Mock @chainlit/react-client hooks
vi.mock('@chainlit/react-client', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useChatData: vi.fn(),
        useChatInteract: vi.fn(),
        useAuth: vi.fn(),
    };
});

// Mock child components that are not the focus of this test
vi.mock('./Attachments', () => ({ Attachments: () => <div data-testid="attachments-mock" /> }));
vi.mock('./CommandButtons', () => ({ default: () => <div data-testid="commandbuttons-mock" /> }));
vi.mock('./CommandPopoverButton', () => ({ default: () => <div data-testid="commandpopoverbutton-mock" /> }));
vi.mock('./Input', () => ({ default: vi.forwardRef((props, ref) => <textarea data-testid="input-mock" {...props} ref={ref as any} />) }));
vi.mock('./Mcp', () => ({ default: () => <div data-testid="mcpbutton-mock" /> }));
vi.mock('./SubmitButton', () => ({ default: () => <button data-testid="submitbutton-mock">Submit</button> }));
vi.mock('./UploadButton', () => ({ default: () => <div data-testid="uploadbutton-mock" /> }));
vi.mock('./VoiceButton', () => ({ default: () => <div data-testid="voicebutton-mock" /> }));
vi.mock('@/components/widgets/CustomWidgetRenderer', () => ({
    default: ({ element, value, onChange }: any) => (
        <div data-testid={`custom-widget-${element.props.id}`}>
            <span>Value: {value}</span>
            <button onClick={() => onChange(element.props.id, 'new-' + value)}>
                Change {element.props.label}
            </button>
        </div>
    )
}));


// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: ((key: string) => key) as TFunction,
  }),
}));


const mockUser = { id: 'user1', identifier: 'test-user' };
const mockSendMessage = vi.fn();
const mockReplyMessage = vi.fn();

const initialMockElements: ICustomWidgetElement[] = [
  {
    id: 'element-uuid-dropdown',
    type: 'custom',
    name: 'model_select_dropdown_element',
    display: 'inline',
    forId: 'COMPOSER_WIDGET',
    props: {
      widgetType: 'dropdown',
      label: 'Select Model',
      id: 'model_dropdown_widget_test',
      options: [{ value: 'gpt-4', label: 'GPT-4' }, { value: 'claude-2', label: 'Claude 2' }],
      initialValue: 'gpt-4',
    } as IDropdownWidgetProps,
  }
];

// Helper component to render MessageComposer and expose Recoil states for testing
const TestBed = ({ initialElements = initialMockElements }: { initialElements?: ICustomWidgetElement[] }) => {
  // Setup mock return values for hooks
  (useChatData as Mock).mockReturnValue({
    elements: initialElements,
    askUser: null,
    chatSettingsInputs: [],
    disabled: false,
  });
  (useChatInteract as Mock).mockReturnValue({
    sendMessage: mockSendMessage,
    replyMessage: mockReplyMessage,
  });
  (useAuth as Mock).mockReturnValue({ user: mockUser, isAuthenticated: true, isReady: true });

  const definitions = useRecoilValue(customWidgetDefinitionsState);
  const values = useRecoilValue(customWidgetValuesState);
  const setAttachments = useSetRecoilState(attachmentsState);
  const setPersistentCommand = useSetRecoilState(persistentCommandState);

  useEffect(() => {
    // Initialize other states if MessageComposer depends on them for rendering
    setAttachments([]);
    setPersistentCommand(undefined);
  }, [setAttachments, setPersistentCommand]);


  return (
    <div>
      <MessageComposer
        fileSpec={{ accept: ['*/*'], max_size_mb: 20, max_files: 1 }}
        onFileUpload={() => {}}
        onFileUploadError={() => {}}
        autoScrollRef={{ current: false }}
      />
      <div data-testid="definitions-output">{JSON.stringify(definitions)}</div>
      <div data-testid="values-output">{JSON.stringify(values)}</div>
    </div>
  );
};


describe('MessageComposer - Recoil State Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Recoil states for each test if necessary, though RecoilRoot should isolate
  });

  it('populates customWidgetDefinitionsState from useChatData elements', () => {
    render(
      <RecoilRoot>
        <TestBed />
      </RecoilRoot>
    );
    const definitionsOutput = screen.getByTestId('definitions-output');
    const parsedDefinitions = JSON.parse(definitionsOutput.textContent || '[]');
    expect(parsedDefinitions).toEqual(initialMockElements);
  });

  it('initializes customWidgetValuesState with initialValue from definitions', () => {
    render(
      <RecoilRoot>
        <TestBed />
      </RecoilRoot>
    );
    const valuesOutput = screen.getByTestId('values-output');
    const parsedValues = JSON.parse(valuesOutput.textContent || '{}');
    
    const expectedInitialValue = initialMockElements[0].props.initialValue;
    const widgetHtmlId = initialMockElements[0].props.id;
    expect(parsedValues[widgetHtmlId]).toBe(expectedInitialValue);
  });

  it('updates customWidgetValuesState when handleWidgetChange is triggered via CustomWidgetRenderer', async () => {
    render(
      <RecoilRoot>
        <TestBed />
      </RecoilRoot>
    );

    const widgetHtmlId = initialMockElements[0].props.id;
    const widgetInitialValue = initialMockElements[0].props.initialValue;

    // Check initial value first
    let valuesOutput = screen.getByTestId('values-output');
    let parsedValues = JSON.parse(valuesOutput.textContent || '{}');
    expect(parsedValues[widgetHtmlId]).toBe(widgetInitialValue);

    // Find the button for the mocked widget and click it to trigger onChange
    const changeButton = screen.getByRole('button', { name: `Change ${initialMockElements[0].props.label}` });
    
    await act(async () => {
      fireEvent.click(changeButton);
    });

    // Check updated value
    valuesOutput = screen.getByTestId('values-output'); // Re-query after update
    parsedValues = JSON.parse(valuesOutput.textContent || '{}');
    expect(parsedValues[widgetHtmlId]).toBe(`new-${widgetInitialValue}`);
  });

  it('does not initialize value if initialValue is undefined', () => {
     const elementsWithoutInitialValue: ICustomWidgetElement[] = [
      {
        ...initialMockElements[0],
        props: {
          ...initialMockElements[0].props,
          initialValue: undefined,
        } as IDropdownWidgetProps,
      }
    ];
    render(
      <RecoilRoot>
        <TestBed initialElements={elementsWithoutInitialValue} />
      </RecoilRoot>
    );
    const valuesOutput = screen.getByTestId('values-output');
    const parsedValues = JSON.parse(valuesOutput.textContent || '{}');
    const widgetHtmlId = elementsWithoutInitialValue[0].props.id;
    expect(parsedValues.hasOwnProperty(widgetHtmlId)).toBe(false); // Value should not be set
  });

  it('filters out elements not meant for COMPOSER_WIDGET or without widgetType', () => {
    const mixedElements: ICustomWidgetElement[] = [
      ...initialMockElements, // Valid composer widget
      {
        id: 'element-uuid-not-composer', type: 'custom', name: 'some_other_element',
        display: 'inline', forId: 'NOT_COMPOSER', // Different forId
        props: { widgetType: 'dropdown', id: 'other_id' } as any,
      },
      {
        id: 'element-uuid-no-widgetType', type: 'custom', name: 'no_widget_type_element',
        display: 'inline', forId: 'COMPOSER_WIDGET',
        props: { id: 'another_id' } as any, // Missing widgetType
      }
    ];
     render(
      <RecoilRoot>
        <TestBed initialElements={mixedElements} />
      </RecoilRoot>
    );
    const definitionsOutput = screen.getByTestId('definitions-output');
    const parsedDefinitions = JSON.parse(definitionsOutput.textContent || '[]');
    expect(parsedDefinitions).toEqual([initialMockElements[0]]); // Only the valid composer widget
  });

});
