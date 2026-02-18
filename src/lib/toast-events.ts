type ToastType = 'success' | 'error' | 'info';

type ToastEvent = {
    message: string;
    type: ToastType;
    id: number;
};

type ToastListener = (toast: ToastEvent) => void;

class ToastEmitter {
    private listeners: ToastListener[] = [];
    private counter = 0;

    subscribe(listener: ToastListener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    emit(message: string, type: ToastType) {
        const event: ToastEvent = { message, type, id: this.counter++ };
        this.listeners.forEach(listener => listener(event));
    }

    success(message: string) {
        this.emit(message, 'success');
    }

    error(message: string) {
        this.emit(message, 'error');
    }

    info(message: string) {
        this.emit(message, 'info');
    }
}

export const toast = new ToastEmitter();
