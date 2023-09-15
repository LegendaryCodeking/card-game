
const example = [
  { weight: 1, object: 1 },
  { weight: 1, group: [
    { weight: 1, object: 2 },
    { weight: 1, object: 3 }
  ]}
];

const result = [
  { weight: 0, object: 1 },
  { weight: 1, object: 2 },
  { weight: 1.5, object: 3 }
]

function findSum(objects) {
  let sum = 0; 
  objects.forEach(o => sum += o.weight);
  return sum;
}

function flatten(object, max, offset, output) {
  if (object.object) {
    output.push()
  }
}

export default class RandomDistributor {

  constructor(groups) {
    
  }

}