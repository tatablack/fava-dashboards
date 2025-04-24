import * as echartslib from "echarts";
import {render_d3sankey} from "./sankey";
import {PanelCtx} from "./types";

function runFunction(src: string, args: Record<string, any>): Promise<any> {
    const AsyncFunction = async function () {}.constructor;
    const params = Object.entries(args);
    const fn = AsyncFunction(
        params.map(([k, _]) => k),
        src,
    );
    return fn(...params.map(([_, v]) => v));
}

function runScript(ctx: PanelCtx) {
    return runFunction(ctx.panel.script!, {
        ...ctx,
        // pass 'fava' for backwards compatibility
        fava: ctx.ledger,
    });
}

export async function html(ctx: PanelCtx, elem: HTMLDivElement) {
    try {
        elem.innerHTML = await runScript(ctx);
    } catch (e) {
        elem.innerHTML = e;
    }

    return elem;
}

export async function echarts(ctx: PanelCtx, elem: HTMLDivElement) {
    let options: echartslib.EChartsOption;
    try {
        options = await runScript(ctx);
    } catch (e) {
        elem.innerHTML = e;
        return;
    }

    const renderer = window.navigator.userAgent === "puppeteer" ? "svg" : undefined;
    const isDarkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = isDarkMode ? "dark" : undefined;
    const chart = echartslib.init(elem, theme, { renderer });
    if (options.onClick) {
        chart.on("click", (options as any).onClick);
        delete options.onClick;
    }
    if (options.onDblClick) {
        chart.on("dblclick", (options as any).onDblClick);
        delete options.onDblClick;
    }
    if (theme === "dark" && options.backgroundColor === undefined) {
        options.backgroundColor = "transparent";
    }
    chart.setOption(options);

    return chart;
}

export async function d3_sankey(ctx: PanelCtx, elem: HTMLDivElement) {
    let options: any;
    try {
        options = await runScript(ctx);
    } catch (e) {
        elem.innerHTML = e;
        return;
    }

    return render_d3sankey(elem, options);
}

export async function jinja2(ctx: PanelCtx, elem: HTMLDivElement) {
    elem.innerHTML = ctx.panel.template ?? "";
    return elem;
}
