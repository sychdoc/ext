import { Graphviz } from "@hpcc-js/wasm";

async function render(container: HTMLElement, data: string) {
    const graphviz = await Graphviz.load();
    container.innerHTML = graphviz.layout(data, "svg", "dot");
}

export {
    render
}