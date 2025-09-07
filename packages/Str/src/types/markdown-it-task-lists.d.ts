declare module "markdown-it-task-lists" {
    import type { PluginSimple, PluginWithOptions } from "markdown-it";
    const plugin: PluginSimple | PluginWithOptions<unknown>;
    export default plugin;
}
