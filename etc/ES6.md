
### ECMA6
* **Globális változó: ** ez a default
* **Blokkszintű scope: ** let
* **Funkciószintű scope:** var
* **Konstans:** const
* **Cast nélküli equals: ** ===
* **If shorthand: ** (x > 0) ? 'yes' : 'no';
* **Object prototype: ** `function Person(name) { this.name = name;}`
* **new Array**: `var a = new Array(size);` or `var b = [];`
* **loop on array: ** `for (const v of a){}` or `a.forEach(function(){});`
* **Array functions: ** `push, pop, join, reverse, shift, slice, sort, splice, concat`
* **Multiple params: ** `..args`
* **Object params as functions or Shared functions: ** `Person.prototype.func = function (){};`
* **Closure - állapot elmentése, fvgyártás: ** ```
function makeAdder(a) { return function(b) {  return a + b;  }; }
var x = makeAdder(5); x(6); ```
* **Default paraméterek: ** `function(height = 50){}`
* **Template literálok és multiline string: ** ```var first = "John"; var name = `Your name is ${first}.` ```
* **Adat destrukturálás: ** `var {username, password} = req.body`
* **Copy: ** `var b = Object.create(a)`
* **Function shorthand with this closure?: ** `()=>{}`
* **Promise - callback helyett async chain: ** ``` 
var wait1000 =  ()=> new Promise((resolve, reject)=> {setTimeout(resolve, 1000)});
// ************
wait1000()
  .then(function() {
    console.log('Yay!')
    return wait1000()
  })
  .then(function() {
    console.log('Wheeyee!')
  })```
  * **Osztályok: ** ```
  class baseModel extends XY {
  constructor(options = {}) { // class constructor
    this.name = 'Base'
    this.options = options
  }
    getName() { console.log(`Class name: ${this.name}`)
    }
   }```
   * **Ős hívása: ** `super()`
   * **Export és import: ** ```
   // in s.js
   export var port = 3000
export function getAccounts(url) {}
// in main.js
import {port, getAccounts} from 's'
console.log(port) // 3000
```
* **Computed paramter names **
* **Swap: ** `[a,b] = [b,a]`
* **Destruktúrálással lehet matchelni-validálni is**
* **Static member - shared változo/fv: **
* **Symbol, Generator, Set, Map, WeakSet, WeakMap**
* **Paraméterek felülírása, régiek megtartása: ** `Object.assign(cél, x)`
* **Array.find és Array.findIndex**
* **Math.trunc, sign, isSafe**
* **Reflection, Proxy**
