/**
 * Host half of the plugin. The feature is intentionally browser-only; this
 * no-op entry enrolls the package in the Host loader so DSH can discover its
 * `dsh.client` manifest and serve the prebuilt client bundle.
 */
export const name = 'dsh-live-wallpaper'

export function apply() {}
