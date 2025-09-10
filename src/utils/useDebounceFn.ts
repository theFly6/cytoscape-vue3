// 通用防抖函数
export function useDebounceFn<T extends (...args: any[]) => any>(
    fn: T,
    wait = 300
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null

    return function (...args: Parameters<T>) {
        if (timeout) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(() => {
            fn(...args)
        }, wait)
    }
}
