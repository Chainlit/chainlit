import { toast as sonnerToast } from 'sonner';

const toast = {
    success(content: any) {
        // @ts-expect-error custom property
        if (window.addToastMessage) {
            // @ts-expect-error custom property
            window.addToastMessage('success', content);
        } else {
            sonnerToast.success(content);
        }
    },

    warning(content: any) {
        // @ts-expect-error custom property
        if (window.addToastMessage) {
            // @ts-expect-error custom property
            window.addToastMessage('warning', content);
        } else {
            sonnerToast.warning(content);
        }
    },

    error(content: any) {
        // @ts-expect-error custom property
        if (window.addToastMessage) {
            // @ts-expect-error custom property
            window.addToastMessage('error', content);
        } else {
            sonnerToast.error(content);
        }
    }
}

export default toast;