export const required = (v) => v !== undefined && v !== null && String(v).trim() !== "";
export const isPhone = (v) => /^[6-9]\d{9}$/.test(String(v).trim());
export const isEmail = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
