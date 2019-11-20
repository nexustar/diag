export type NumberConverter = (val: number) => string;

export type DecimalCount = number | null | undefined;

// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/round
export const toFixed = (value: number, decimals?: DecimalCount): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const factor = decimals ? 10 ** Math.max(0, decimals) : 1;
  const formatted = String(Math.round(value * factor) / factor);

  // if exponent return directly
  if (formatted.indexOf('e') !== -1 || value === 0) {
    return formatted;
  }

  // If tickDecimals was specified, ensure that we have exactly that
  // much precision; otherwise default to the value's own precision.
  if (decimals !== null && decimals !== undefined) {
    const decimalPos = formatted.indexOf('.');
    const precision = decimalPos === -1 ? 0 : formatted.length - decimalPos - 1;
    if (precision < decimals) {
      return (
        (precision ? formatted : `${formatted}.`) + String(factor).substr(1, decimals - precision)
      );
    }
  }

  return formatted;
};

const toFixedN = (n: number) => (val: number) => toFixed(val, n);

export const toFixed1: NumberConverter = toFixedN(1);
export const toFixed2: NumberConverter = toFixedN(2);
export const toFixed4: NumberConverter = toFixedN(4);

export const bytesSizeFormatter = (bytes = 0, si = true, fixed = 0) => {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`;
  }
  const units = si
    ? ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  do {
    bytes /= thresh;
    u += 1;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return `${toFixed(bytes, fixed)} ${units[u]}`;
};

export const networkBitSizeFormatter = (bits = 0, fixed = 0) => {
  const thresh = 1000;
  if (Math.abs(bits) < thresh) {
    return `${bits} bps`;
  }
  const units = ['kbps', 'mbps', 'gbps', 'tbps'];
  let u = -1;
  do {
    bits /= thresh;
    u += 1;
  } while (Math.abs(bits) >= thresh && u < units.length - 1);
  return `${toFixed(bits, fixed)} ${units[u]}`;
};

export const timeSecondsFormatter = (seconds = 0, fixed = 0) => {
  if (seconds >= 60) {
    const mins = seconds / 60;
    if (mins < 60) {
      return `${toFixed(mins, fixed)} min`;
    }
    const hours = mins / 60;
    if (hours < 24) {
      return `${toFixed(hours, fixed)} hour`;
    }
    const days = hours / 24;
    return `${toFixed(days, fixed)} day`;
  }
  if (seconds < 1 && seconds > 0) {
    const units = ['ms', 'us', 'ns'];
    let u = -1;
    do {
      seconds *= 1000;
      u += 1;
    } while (seconds < 1 && u < units.length - 1);
    return `${toFixed(seconds, fixed)} ${units[u]}`;
  }
  return `${toFixed(seconds, fixed)} s`;
};

// 0.5 => 50%
export const toPercent = (size: number, decimals: number = 2) => {
  if (size === null || size === undefined) {
    return '';
  }
  return `${toFixed(100 * size, decimals)}%`;
};

// add % unit, 0.5 => 0.5%
export const toPercentUnit = (size: number, decimals: number = 2) => {
  if (size === null || size === undefined) {
    return '';
  }
  return `${toFixed(size, decimals)}%`;
};

export const toAnyUnit = (val: number, multiply: number, fixed: number, unit: string) =>
  `${toFixed(val * multiply, fixed)} ${unit}`;
