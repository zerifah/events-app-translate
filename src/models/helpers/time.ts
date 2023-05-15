
export const formatTime = (date: Date) => {
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${hours}:${minutes}`;
}

export const formatDate = (date: Date) => {
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = `${date.getFullYear()}`.padStart(4, '0');

    return `${day}.${month}.${year}`;
}

export const formatDateTime = (date: Date) => {
    return `${formatDate(date)} ${formatTime(date)}`;
}

export const toLocalDate = (date: Date) => {   
    return new Date(date.getTime() + date.getTimezoneOffset() * MINUTE_2_MS)
}

export const toGlobalDate = (date: Date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * MINUTE_2_MS)
}

export const SEC_2_MS = 1000;
export const MINUTE_2_MS = 60 * SEC_2_MS;
export const HOUR_2_MS = 60 * MINUTE_2_MS;
export const DAY_2_MS = 24 * HOUR_2_MS; // 1000*60*60*24=86400000
export const WEEK_2_MS = 7 * DAY_2_MS;
export const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const;

export const getWeekdayOffsetMS = (date: Date) => {
    const days = date.getUTCDay() - 1;
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
    return days * DAY_2_MS + hours * HOUR_2_MS + minutes * MINUTE_2_MS + seconds * SEC_2_MS;
}

export const getKW = (date: Date) => {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
    const dayNumber = date.getUTCDay() || 7;
    utcDate.setUTCDate(date.getUTCDate() + 4 - dayNumber);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    return Math.ceil(((utcDate.getTime() - yearStart.getTime()) / DAY_2_MS + 1) / 7);
}

/**
 * 
 * @param date date in local time
 * @returns first monday of this week, in local time 
 */
export const getLastMonday = (date: Date = new Date()) => {
    const dateCopy = new Date(date.getTime());
    dateCopy.setHours(0, 0, 0, 0);
    return new Date(dateCopy.getTime() - ((dateCopy.getDay() + 6) % 7) * DAY_2_MS);
}