/** True on touch screens (phones, tablets), where there's no hover and fingers need bigger targets. */
export const IS_TOUCH_SCREEN = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
