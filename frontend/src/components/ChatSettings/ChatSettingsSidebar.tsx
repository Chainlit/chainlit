import mapValues from 'lodash/mapValues';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRecoilState, useSetRecoilState } from 'recoil';

import {
    chatSettingsValueState,
    useChatData,
    useChatInteract,
    useConfig
} from '@chainlit/react-client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Translator } from 'components/i18n';

import { useIsMobile } from '@/hooks/use-mobile';

import { chatSettingsSidebarOpenState } from '@/state/project';

import { FormInput, TFormInputValue } from './FormInput';

export default function ChatSettingsSidebar() {
    const { config } = useConfig();
    const { chatSettingsValue, chatSettingsInputs, chatSettingsDefaultValue } =
        useChatData();
    const { updateChatSettings } = useChatInteract();
    const [sidebarOpen, setSidebarOpen] = useRecoilState(
        chatSettingsSidebarOpenState
    );
    const isMobile = useIsMobile();
    const [isVisible, setIsVisible] = useState(false);

    const { handleSubmit, setValue, reset, watch } = useForm({
        defaultValues: chatSettingsValue
    });
    const setChatSettingsValue = useSetRecoilState(chatSettingsValueState);

    useEffect(() => {
        reset(chatSettingsValue);
    }, [chatSettingsValue, reset]);

    useEffect(() => {
        if (config?.ui?.default_chat_settings_open && chatSettingsInputs.length > 0) {
            setSidebarOpen(true);
        }
    }, [config?.ui?.default_chat_settings_open, chatSettingsInputs.length, setSidebarOpen]);

    useEffect(() => {
        if (sidebarOpen) {
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        } else {
            setIsVisible(false);
        }
    }, [sidebarOpen]);

    const handleClose = () => {
        reset(chatSettingsValue);
        setSidebarOpen(false);
    };

    const handleConfirm = handleSubmit((data) => {
        const processedValues = mapValues(data, (x: TFormInputValue) =>
            x !== '' ? x : null
        );
        updateChatSettings(processedValues);
        setChatSettingsValue(processedValues);
        setSidebarOpen(false);
    });

    const handleReset = () => {
        reset(chatSettingsDefaultValue);
    };

    const handleChange = () => { };

    const setFieldValue = (field: string, value: any) => {
        setValue(field, value);
    };

    const values = watch();
    const tabInputs = chatSettingsInputs.filter(
        (input: any) => Array.isArray(input?.inputs) && input.inputs.length > 0
    );
    const regularInputs = chatSettingsInputs.filter(
        (input: any) => !Array.isArray(input?.inputs) || input.inputs.length === 0
    );
    const hasTabs = tabInputs.length > 0;
    const defaultTab = tabInputs[0]?.id;

    if (!sidebarOpen || chatSettingsInputs.length === 0) return null;

    const settingsContent = (
        <>
            {hasTabs ? (
                <Tabs
                    defaultValue={defaultTab}
                    className="flex flex-col flex-grow min-h-0"
                >
                    <TabsList className="w-full flex justify-start flex-wrap h-auto">
                        {tabInputs.map((tab: any) => (
                            <TabsTrigger key={tab.id} value={tab.id}>
                                {tab.label ?? tab.id}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {tabInputs.map((tab: any) => (
                        <TabsContent
                            key={tab.id}
                            value={tab.id}
                            className="data-[state=active]:flex flex-col flex-grow overflow-y-auto gap-4 p-1 mt-4"
                        >
                            {tab.inputs?.map((input: any) => (
                                <FormInput
                                    key={input.id}
                                    element={{
                                        ...input,
                                        value: values[input.id],
                                        onChange: handleChange,
                                        setField: setFieldValue
                                    }}
                                />
                            ))}
                        </TabsContent>
                    ))}
                </Tabs>
            ) : (
                <div className="flex flex-col flex-grow overflow-y-auto gap-4 p-1">
                    {regularInputs.map((input: any) => (
                        <FormInput
                            key={input.id}
                            element={{
                                ...input,
                                value: values[input.id],
                                onChange: handleChange,
                                setField: setFieldValue
                            }}
                        />
                    ))}
                </div>
            )}
            <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={handleReset}>
                    <Translator path="common.actions.reset" />
                </Button>
                <div className="flex-1" />
                <Button variant="ghost" size="sm" onClick={handleClose}>
                    <Translator path="common.actions.cancel" />
                </Button>
                <Button size="sm" onClick={handleConfirm} id="confirm-sidebar">
                    <Translator path="common.actions.confirm" />
                </Button>
            </div>
        </>
    );

    if (isMobile) {
        return (
            <Sheet open onOpenChange={(open) => !open && handleClose()}>
                <SheetContent className="flex flex-col md:hidden">
                    <SheetHeader>
                        <SheetTitle id="chat-settings-sidebar-title">
                            <Translator path="chat.settings.title" />
                        </SheetTitle>
                    </SheetHeader>
                    <div className="overflow-y-auto flex-grow flex flex-col gap-4 mt-4">
                        {settingsContent}
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <>
            <ResizableHandle className="sm:hidden md:block bg-transparent" />
            <ResizablePanel
                minSize={15}
                defaultSize={25}
                className={`md:flex flex-col flex-grow sm:hidden transform transition-transform duration-300 ease-in-out ${isVisible ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <aside className="relative flex-grow overflow-y-auto mr-4 mb-4">
                    <Card className="overflow-y-auto h-full relative flex flex-col">
                        <div
                            id="chat-settings-sidebar-title"
                            className="text-lg font-semibold text-foreground px-6 py-4 flex items-center"
                        >
                            <Button
                                className="-ml-2"
                                onClick={handleClose}
                                size="icon"
                                variant="ghost"
                            >
                                <ArrowLeft />
                            </Button>
                            <Translator path="chat.settings.title" />
                        </div>
                        <CardContent
                            id="chat-settings-sidebar-content"
                            className="flex flex-col flex-grow gap-4 overflow-y-auto"
                        >
                            {settingsContent}
                        </CardContent>
                    </Card>
                </aside>
            </ResizablePanel>
        </>
    );
}
