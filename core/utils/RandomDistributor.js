
export default class RandomDistributor {

  constructor(props) {
    Object.assign(this, props);
  }

  pick(nodes = this.nodes) {
    let sum = 0;
    nodes.forEach(node => sum += node.weight ?? node.w);

    // NOTE: Please do not return "undefined". It will be very hard to reproduce.

    const pickValue = Math.random() * sum;
    let range = 0;
    for (let node of nodes) {
      range += node.weight ?? node.w;
      if (pickValue <= range) {
        if (node.value || node.v) return node.value ?? node.v;
        if (node.group) return this.pick(node.group);
        else return nodes[0].value ?? node[0].v;
      }
    }

    return nodes[0].value ?? nodes[0].v;
  }

}